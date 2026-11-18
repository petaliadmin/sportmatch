# Runbook d'exploitation — SportMatch (staging / production)

> Chaque alerte Prometheus renvoie à une section de ce document (`annotations.runbook`).
> Convention : `NS=sportmatch`, contexte kubectl positionné sur le bon cluster
> (`aws eks update-kubeconfig --region eu-west-3 --name sportmatch-<env>`).

## Niveaux de gravité

| Gravité | Exemple | Délai de prise en charge | Communication |
|---|---|---|---|
| **critical** | Gateway en 5xx, outbox bloquée, base indisponible | 15 min, 24 h/24 pendant la bêta | Statut utilisateurs + canal #incidents |
| **warning** | Latence p95 élevée, pod qui redémarre, retard consommateur | Heures ouvrées | Canal #incidents |

## Gestes de base

```bash
kubectl -n $NS get pods -o wide                       # état général
kubectl -n $NS logs deploy/sportmatch-<service> --tail=200
kubectl -n $NS describe pod <pod>                     # événements (OOMKilled, sondes…)
kubectl -n $NS rollout restart deploy/sportmatch-<service>
helm -n $NS history sportmatch                        # versions déployées
```

## Retour arrière d'une version

Le déploiement est `--atomic` : un échec pendant la mise à jour revient seul à la version précédente.
Pour revenir en arrière après coup :

```bash
helm -n $NS history sportmatch
helm -n $NS rollback sportmatch <REVISION> --wait
```

Les migrations Liquibase suivent la règle **expand / contract** (DAT §8) : une version N-1 fonctionne toujours
sur le schéma de la version N. Ne jamais lancer de `rollback` Liquibase en production sans revue.

## Erreurs 5xx

1. Identifier le service fautif dans Grafana (taux d'erreur par `application`) ou via les journaux de la gateway.
2. Réponse **503 « Service indisponible »** : le circuit breaker de la gateway est ouvert, le service en aval est en panne → voir *Pod en échec*.
3. 500 sur un seul endpoint après une mise en production → retour arrière (ci-dessus), puis correctif sur `develop`.

## Latence élevée

1. Vérifier la saturation : `kubectl -n $NS top pods` ; le HPA ajoute des pods au-delà de 65-70 % de CPU.
2. Base de données : Performance Insights (RDS) → requêtes les plus coûteuses, connexions.
3. Si le HPA est au maximum : augmenter `autoscaling.maxReplicas` et/ou le node group (Terraform `node_max_size`).

## Pod en échec

| Symptôme | Cause probable | Action |
|---|---|---|
| `OOMKilled` | Mémoire insuffisante | Relever `resources.limits.memory` |
| Sonde de démarrage en échec | Base ou Kafka injoignable, migration Liquibase bloquée | Journaux du pod ; verrou Liquibase : `select * from databasechangeloglock` |
| `ImagePullBackOff` | Tag absent du registre | Vérifier la promotion des images (pipeline de release) |
| `CrashLoopBackOff` au démarrage | Variable ou secret manquant | `kubectl describe pod`, ExternalSecret synchronisé ? |

## Kafka indisponible / outbox en retard

Les services **continuent de répondre** : les événements s'accumulent dans `outbox_event` (jauge
`sportmatch_outbox_pending`) et partent dès le retour de Kafka. Rien n'est perdu.

1. Strimzi : `kubectl -n kafka get kafka,kafkanodepool,pods` ; MSK : console AWS → état des brokers.
2. Une fois Kafka rétabli, la jauge redescend seule en quelques secondes. Sinon : redémarrer le service émetteur.

## Retard consommateur / messages en DLQ

Après 3 tentatives, un message en échec part dans `<topic>.DLT` (ex. `sportmatch.app.match.v1.DLT`).

```bash
# Inspecter la DLQ (Strimzi)
kubectl -n kafka exec -it sportmatch-kafka-dual-role-0 -- bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic sportmatch.app.match.v1.DLT --from-beginning --property print.headers=true
```

Les en-têtes `kafka_dlt-exception-message` donnent la cause. Une fois corrigé, **rejouer** en republiant les
messages sur le topic d'origine : les consommateurs sont idempotents (`processed_event`), un rejeu ne crée pas de doublon.

```bash
kubectl -n kafka exec -it sportmatch-kafka-dual-role-0 -- sh -c \
  'bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic sportmatch.app.match.v1.DLT --from-beginning --timeout-ms 10000 \
   | bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic sportmatch.app.match.v1'
```

## Sauvegardes et restauration

| Donnée | Mécanisme | Rétention |
|---|---|---|
| PostgreSQL (RDS) | Sauvegardes automatiques + restauration à la seconde (PITR) | 7 j staging · 14 j production |
| Médias (S3) | Versionnage du bucket (à activer en production) | 30 j |
| Kafka | Données transitoires : la source de vérité est en base (outbox) | — |
| Configuration | Git (Helm, Terraform) | illimitée |

**Exercice de restauration (une fois par mois pendant la bêta)** :

```bash
aws rds restore-db-instance-to-point-in-time --region eu-west-3 \
  --source-db-instance-identifier sportmatch-production \
  --target-db-instance-identifier sportmatch-restore-test \
  --restore-time "$(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ)" --db-instance-class db.t4g.medium
# vérifier : nombre de matchs, réservations et messages proches de la production, puis supprimer l'instance
aws rds delete-db-instance --db-instance-identifier sportmatch-restore-test --skip-final-snapshot
```

## Clôture d'incident

Post-mortem sans recherche de coupable sous 5 jours ouvrés : chronologie, impact (utilisateurs, durée),
cause racine, actions correctives avec responsable et échéance, dans `docs/operations/postmortems/AAAA-MM-JJ-titre.md`.
