# Phase 4 — Production bêta

> Suite de la [phase 3](PHASE-3-STAGING.md). Lot 4A : tout ce qui rend la mise en production sûre et répétable.
> Lot 4B (suivant) : application mobile Flutter en test fermé.

## 1. Ce qui est livré

| Élément | Emplacement | Validé par la CI |
|---|---|---|
| Terraform factorisé : un module `platform`, deux environnements | `infra/terraform/modules/platform`, `envs/staging`, `envs/production` | `fmt` + `validate` des deux environnements |
| Valeurs Helm de production | `deploy/helm/sportmatch/values-production.yaml` | `helm lint` + rendu |
| Alertes Prometheus (5xx, latence p95, redémarrages, outbox, retard Kafka) | `templates/alerts.yaml` | rendu |
| Jauge `sportmatch_outbox_pending` | `platform-messaging` | tests backend |
| **Test de charge k6** | `infra/load/load-test.js` | **exécuté à chaque CI sur Kubernetes (kind)** |
| Pipeline de release | `.github/workflows/release-production.yml` | — (se déclenche sur un tag) |
| Runbook d'exploitation | `docs/operations/RUNBOOK.md` | — |

### Staging et production : ce qui change

| | Staging | Production |
|---|---|---|
| Zones de disponibilité | 2 | **3** |
| NAT | 1 partagée | **1 par AZ** |
| Nœuds EKS | Spot, 2 à 4 | **À la demande, 3 à 8** |
| RDS | `db.t4g.medium`, mono-AZ, 7 j | **`db.m6g.large`, Multi-AZ, 14 j, protection contre la suppression** |
| Redis | 1 nœud | **2 nœuds, bascule automatique** |
| Kafka | Strimzi dans le cluster | **Amazon MSK, 3 brokers, réplication 3** |
| Pods par service | 2 à 4 | **3 à 8 (un par AZ minimum), PDB `minAvailable: 2`** |
| Données de démonstration | oui | **non** (`SPRING_LIQUIBASE_CONTEXTS=prod`) |
| Seuils d'alerte | 2 % de 5xx, p95 1 s | **1 % de 5xx, p95 0,8 s** |

## 2. Le test de charge

Deux profils, mêmes scénarios : 75 % de navigation anonyme (proximité PostGIS, matchs, tournois, créneaux)
et 25 % d'utilisateurs connectés (création de match, notifications, réservations, conversations).

| Profil | Utilisateurs simultanés | Durée | Objectifs |
|---|---|---|---|
| `ci` (kind, un seul nœud) | 20 | 90 s | p95 < 1,5 s · erreurs < 1 % |
| `staging` (objectifs de service bêta) | 200 | 10 min | **p95 < 800 ms · p99 < 1,5 s · erreurs < 1 %** |

```bash
# Sur le staging, depuis un poste ou un runner (k6 installé)
k6 run -e PROFILE=staging -e GATEWAY=https://api.staging.<domaine> -e KEYCLOAK=https://auth.staging.<domaine> infra/load/load-test.js
```

Le profil `staging` utilise les comptes de démonstration : à lancer sur le staging uniquement, jamais en production.

## 3. Mettre une version en production

```
develop ──(CI verte + déploiement staging)──▶ production ──tag v1.0.0-beta.N──▶ release-production
```

1. **Préparer** : `develop` est vert (`backend-ci`, `platform-ci`) et tourne en staging depuis au moins 24 h sans alerte.
2. **Avancer `production`** sans commit de fusion, pour garder **exactement** le commit testé :
   ```bash
   git fetch origin && git checkout production && git merge --ff-only origin/develop && git push origin production
   ```
3. **Taguer** :
   ```bash
   git tag -a v1.0.0-beta.1 -m "SportMatch 1.0.0 bêta 1" && git push origin v1.0.0-beta.1
   ```
4. Le pipeline `release-production` :
   - vérifie le format SemVer, que le commit est sur `production`, et que les CI sont vertes pour ce commit ;
   - **promeut les images** : `sportmatch-*:<sha>` → `sportmatch-*:v1.0.0-beta.1` (même digest, aucune reconstruction) ;
   - publie la **release GitHub** avec des notes générées depuis les Conventional Commits ;
   - attend l'**approbation manuelle** (environnement `production`), puis `helm upgrade --atomic` et contrôle de santé.

### Configuration à faire une fois (GitHub → Settings)

- **Environments → production** : *required reviewers* (au moins une personne autre que l'auteur), branche autorisée `production`.
- **Branches** : protéger `develop` et `production` (PR obligatoire, `backend-ci` et `platform-ci` requis, pas de push direct).
- **Variables** : `PRODUCTION_ENABLED=true`, `AWS_PRODUCTION_ROLE_ARN`, `PRODUCTION_RDS_ENDPOINT`,
  `PRODUCTION_REDIS_ENDPOINT`, `PRODUCTION_KAFKA_BOOTSTRAP`, `PRODUCTION_API_URL` (en plus de celles du staging).

## 4. Check-list d'ouverture de la bêta

- [ ] `terraform apply` de `envs/production`, outillage du cluster et amorçage des bases (même procédure que le staging, phase 3 §3)
- [ ] Keycloak de production **sans comptes de démonstration**, inscription ouverte ou sur invitation
- [ ] SES sorti du mode sandbox (e-mails transactionnels), domaine vérifié (SPF, DKIM)
- [ ] WAF AWS devant l'ALB (règles gérées « Core » et « Known bad inputs »), limitation de débit sur `/api/v1/*`
- [ ] Alertes reliées à un canal (Slack ou e-mail) via Alertmanager
- [ ] Test de charge `staging` réussi sur la version candidate
- [ ] Exercice de restauration RDS réalisé (runbook, section « Sauvegardes et restauration »)
- [ ] Mentions légales, politique de confidentialité et conditions d'utilisation publiées (données personnelles : loi sénégalaise n° 2008-12 et CDP)
- [ ] Premier tag `v1.0.0-beta.1`

## 5. Suite : lot 4B — application mobile Flutter

Application Flutter (Android d'abord) branchée sur la même API : connexion Keycloak (PKCE via `flutter_appauth`),
terrains à proximité, matchs, réservations, chat temps réel, notifications push (FCM) ; distribution en test fermé
(Google Play *internal testing*, puis TestFlight) depuis la CI.
