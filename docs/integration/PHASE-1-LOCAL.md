# Phase 1 — Socle backend en local

> Plan d'intégration de la bêta SportMatch 1.0.0 · référence : DAT (Dossier d'Architecture Technique), sections 6 à 13.
> Objectif de la phase : faire tourner **toute la chaîne technique sur un poste de développeur**, sans coût cloud,
> avec un parcours métier réel de bout en bout. AWS n'intervient qu'en phase 3.

## 1. Ce qui est livré

| Élément | Emplacement | État |
|---|---|---|
| Parent Maven multi-modules (Spring Boot 3.5, Java 21) | `backend/pom.xml` | ✅ |
| Contrats partagés (enveloppe d'événement, topics) | `backend/platform-commons` | ✅ |
| **sportmatch-gateway** — routage, JWT Keycloak, CORS, relais `X-User-Id` | `backend/sportmatch-gateway` · port 8080 | ✅ |
| **sportmatch-app** — terrains, création et inscription aux matchs, outbox Kafka | `backend/sportmatch-app` · 8081 | ✅ tranche verticale |
| **sportmatch-notifications** — consommateur Kafka idempotent, DLQ, boîte de réception | `backend/sportmatch-notifications` · 8085 | ✅ tranche verticale |
| sportmatch-events · business · admin · chat | ports 8082 · 8083 · 8084 · 8086 | 🟡 amorcés (base, migrations, santé, route) |
| Migrations Liquibase par service, données de démo **fictives** | `*/src/main/resources/db/changelog` | ✅ |
| Contrats OpenAPI 3.1 et AsyncAPI 3.0 | `contracts/` | ✅ |
| Environnement Docker Compose complet | `infra/local/docker-compose.yml` | ✅ |
| Test de bout en bout | `infra/local/smoke-test.sh` | ✅ |
| CI GitHub Actions : unitaires → intégration → e2e | `.github/workflows/backend-ci.yml` | ✅ |

## 2. Prérequis

- **Docker Desktop** (ou Docker Engine + Compose v2.20 ou plus), avec **au moins 8 Go de RAM** alloués
  (Docker Desktop → Settings → Resources).
- **Git** et un terminal bash (macOS, Linux ; sous Windows : **WSL 2** ou Git Bash).
- Facultatif, pour lancer les tests hors Docker : **JDK 21** et **Maven 3.9**.

Aucune installation de Java n'est nécessaire pour faire tourner l'environnement : les images sont compilées dans Docker.

## 3. Pas à pas

### Étape 1 — Récupérer le code

```bash
git clone https://github.com/petaliadmin/sportmatch.git
cd sportmatch
git checkout develop
```

### Étape 2 — Démarrer l'environnement

```bash
make up
# équivalent sans make :
docker compose -f infra/local/docker-compose.yml up -d --build --wait --wait-timeout 600
```

Le premier démarrage prend **5 à 10 minutes** (téléchargement des images et des dépendances Maven) ;
les suivants environ une minute. La commande rend la main quand tous les services sont sains.

```bash
make ps     # tous les services doivent être "healthy" ou "running"
```

### Étape 3 — Lancer le test de bout en bout

```bash
make smoke
```

Résultat attendu : huit étapes vertes puis `✅ Phase 1 validée`. Le script vérifie, dans l'ordre :

1. la gateway répond ;
2. le catalogue des terrains est lisible sans être connecté ;
3. une écriture sans jeton est refusée (401) ;
4. deux joueuses ou joueurs de démo se connectent via Keycloak ;
5. Awa crée un match de 2 places ;
6. Moussa le rejoint, le match passe à `FULL` ;
7. Awa reçoit la notification « Un joueur a rejoint ton match » (chemin : outbox → Kafka → sportmatch-notifications) ;
8. les quatre services amorcés répondent via la gateway.

### Étape 4 — Explorer à la main

| Outil | URL | Identifiants |
|---|---|---|
| Gateway (point d'entrée de l'API) | http://localhost:8080 | — |
| Swagger de sportmatch-app | http://localhost:8081/swagger-ui.html | — |
| Keycloak (console d'administration) | http://localhost:8180 | `admin` / `admin` |
| Kafka UI (topics, messages, DLQ) | http://localhost:8090 | — |
| Mailpit (e-mails de test) | http://localhost:8025 | — |
| PostgreSQL | `localhost:5432` | `postgres` / `postgres` (une base et un utilisateur par service) |
| Prometheus · Grafana (`make up-obs`) | http://localhost:9090 · http://localhost:3001 | Grafana : `admin` / `admin` |

Comptes de démonstration (mot de passe `demo1234` pour tous) : `awa.player`, `moussa.player`,
`fatou.orga`, `ibou.business`, `admin.sportmatch`.

Exemple d'appel authentifié :

```bash
TOKEN=$(curl -s -X POST http://localhost:8180/realms/sportmatch/protocol/openid-connect/token \
  -d grant_type=password -d client_id=sportmatch-web -d username=awa.player -d password=demo1234 \
  | sed -E 's/.*"access_token":"([^"]+)".*/\1/')

curl -s http://localhost:8080/api/v1/matches
curl -s http://localhost:8080/api/v1/notifications -H "Authorization: Bearer $TOKEN"
```

### Étape 5 — Tester la tolérance aux pannes (recommandé)

```bash
docker compose -f infra/local/docker-compose.yml stop kafka
# créer un match : l'API répond 201, l'événement attend dans la table outbox_event
docker compose -f infra/local/docker-compose.yml start kafka
# quelques secondes plus tard, l'événement part et la notification arrive
```

Même exercice avec `stop sportmatch-notifications` : les messages s'accumulent dans Kafka et sont traités au redémarrage,
sans doublon (déduplication sur `eventId`).

### Étape 6 — Arrêter

```bash
make down     # conserve les données
make reset    # efface bases et topics (repart de zéro)
```

## 4. Lancer les tests sans Docker Compose

```bash
cd backend
mvn test      # tests unitaires (règles métier, construction des notifications, sécurité gateway)
mvn verify    # + test d'intégration Testcontainers (PostgreSQL et Kafka réels, Docker requis)
```

## 5. Flux Git et CI

```
feature/*  ──PR──▶  develop  ──PR──▶  production
              │                 │
              └─ backend-ci :   └─ backend-ci (mêmes contrôles)
                 1. tests unitaires
                 2. tests d'intégration
                 3. tests de bout en bout
```

- **Version** : `1.0.0-SNAPSHOT` sur `develop` ; chaque livraison en bêta est étiquetée `v1.0.0-beta.N`.
- **Commits** : Conventional Commits (`feat:`, `fix:`, `chore:`…).
- **À activer par un administrateur du dépôt** (Settings → Branches) : protection de `develop` et `production`,
  PR obligatoire, les trois jobs `backend-ci` exigés, fusion directe interdite.

## 6. Choix assumés pour le local (à durcir ensuite)

| Sujet | En local | En staging / production |
|---|---|---|
| Vérification de l'émetteur du jeton | signature seule (JWKS) | `issuer-uri` vérifié |
| Kafka | 1 broker KRaft, réplication 1 | MSK ou Strimzi, 3 brokers, réplication 3, `min.insync.replicas=2` |
| PostgreSQL | 1 conteneur, 6 bases | RDS, 6 bases, sauvegardes, Multi-AZ en production |
| Secrets | en clair dans le compose | AWS Secrets Manager + IRSA |
| PostGIS | non activé | activé en phase 2 (recherche de terrains par distance) |
| Images | construites localement | Jib → Docker Hub, promotion par digest |

## 7. Critères de sortie de la phase 1

- [ ] `make up` puis `make smoke` passent sur au moins deux postes différents
- [ ] Les trois jobs de `backend-ci` sont verts sur `develop`
- [ ] Les tests de panne (étape 5) se comportent comme décrit
- [ ] Règles de protection des branches activées

## 8. Suite du plan

| Phase | Contenu | Environnement |
|---|---|---|
| **2 — Métier bêta** | Réservations de créneaux (business), tournois (events), chat WebSocket + Redis, notifications push et e-mail, PostGIS, Resilience4j, branchement du front Next.js sur l'API | local + CI |
| **3 — Staging AWS** | Terraform (VPC, EKS, RDS, ECR/Docker Hub), charts Helm, Liquibase en job pre-upgrade, Grafana/Loki/Tempo, déploiement auto sur `develop` | AWS (crédits) |
| **4 — Production bêta** | Promotion par digest vers `production`, sauvegardes, alertes, tests de charge, app Flutter en test fermé | AWS |
