# Phase 2B — Tournois, PostGIS et front branché sur l'API

> Suite de la [phase 2A](PHASE-2A.md). Démarrage inchangé : `make up` puis `make smoke`
> (ou double-clic sur `sportmatch-launch.bat` sous Windows).
> **Nouveau :** l'interface tourne aussi en local → **http://localhost:3080/#live**

## 1. Ce qui est livré

| Brique | Nouveautés |
|---|---|
| **sportmatch-events** | Tournois à élimination directe : création, inscription d'équipes (un capitaine = une équipe), tableau généré avec exemptions pour les têtes de série, saisie des scores (pas de nul), qualification automatique, champion. Événements `tournament.*` |
| **sportmatch-app + PostGIS** | Localisation des terrains (`geography`, index GiST), `GET /api/v1/venues/nearby?lat&lng&radiusKm&sport` trié par distance |
| **sportmatch-notifications** | Inscription d'équipe (capitaine), fin de tournoi (organisateur) |
| **Front « Bêta live »** | Connexion Keycloak (OIDC + PKCE), terrains à proximité avec géolocalisation, réservation de créneaux, matchs (création, inscription), mes réservations, tournois (tableau, scores), chat temps réel WebSocket, notifications |
| **Infra locale** | Image PostGIS, conteneur `postgres-setup` (active PostGIS même sur un volume existant), conteneur `web` (nginx, port 3080) |
| **CI** | Test d'interface Playwright : connexion PKCE réelle, données réelles, réception d'un message par WebSocket |

Le prototype statique (Vercel) est inchangé : sans `NEXT_PUBLIC_API_URL`, l'espace Bêta live affiche une explication au lieu d'appeler l'API.

## 2. Essayer l'interface

1. Ouvrir http://localhost:3080 puis la carte **« Bêta live · API réelle »**.
2. Onglet **Terrains** : « Me localiser » (ou Dakar Plateau par défaut), choisir un rayon, ouvrir un terrain, réserver un créneau.
3. **Se connecter** : `awa.player` / `demo1234`.
4. Onglet **Matchs** → « Créer un match », puis « Chat du match ».
5. Dans une **fenêtre de navigation privée**, se connecter avec `moussa.player`, rejoindre le match d'Awa, ouvrir son chat et écrire : le message apparaît instantanément chez Awa (badge « Temps réel »).
6. Onglet **Tournois** avec `fatou.orga` : créer un tournoi ; inscrire une équipe avec chaque compte ; Fatou génère le tableau et saisit les scores jusqu'au champion.

## 3. Nouveaux endpoints

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/v1/venues/nearby?lat=14.75&lng=-17.51&radiusKm=5&sport=football` | public |
| GET | `/api/v1/events/tournaments[?status=]` · `/api/v1/events/tournaments/{id}` | public |
| POST | `/api/v1/events/tournaments` `{name, sport, startsOn, maxTeams}` | connecté |
| POST | `/api/v1/events/tournaments/{id}/teams` `{name}` | connecté |
| POST | `/api/v1/events/tournaments/{id}/start` | organisateur |
| POST | `/api/v1/events/tournaments/{id}/matches/{matchId}/result` `{homeScore, awayScore}` | organisateur |

## 4. Points d'attention

- **Volume PostgreSQL existant** : rien à faire, `postgres-setup` active PostGIS au démarrage.
- **Keycloak** : le realm est réimporté automatiquement (variable `SPORTMATCH_REALM_VERSION`). Les comptes de démo sont recréés à l'identique.
- **Premier lancement** : la construction de l'image `web` télécharge les dépendances npm (quelques minutes sur une connexion lente).

## 5. Suite du plan : phase 3 — staging AWS

Terraform (VPC, EKS, RDS PostgreSQL + PostGIS, MSK ou Strimzi, ElastiCache), charts Helm par service,
Liquibase en job `pre-upgrade`, observabilité Grafana/Loki/Tempo, déploiement automatique de `develop` vers le staging.
