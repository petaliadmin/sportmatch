# Phase 5 — Rôles, espace prestataire, back-office et sécurité

> Toutes les données restent fictives ; aucun paiement ni réservation réelle.

## Ce qui est livré

| Brique | Détail |
|---|---|
| **RBAC à la gateway** | Rôles Keycloak (`realm_access.roles`) → autorités `ROLE_*`. `/api/v1/admin/**` réservé à `admin`, `/api/v1/business/pro/**` à `provider`. Les rôles et le login sont relayés aux services (`X-User-Roles`, `X-User-Login`), qui revérifient (défense en profondeur). |
| **Espace prestataire** (`sportmatch-business`) | Terrains rattachés au prestataire (`owner_login`), tarif et horaires modifiables, planning 7 jours, blocage/libération de créneaux (statut `BLOCKED`, retiré des disponibilités publiques), tableau de bord (réservations, revenu démo, taux d'occupation). |
| **Back-office** (`sportmatch-admin`) | Consomme les 3 topics Kafka dans `platform_event` (idempotent) : journal d'audit filtrable, indicateurs 7 jours, histogramme quotidien. |
| **Modération** | `POST /api/v1/matches/{id}/cancel` : organisateur ou admin (403 sinon). Événement `match.cancelled` → chaque participant est notifié. |
| **Rate limiting** | `RequestRateLimiter` Redis à la gateway : 50 req/s, rafale 100, clé = utilisateur authentifié sinon IP. `RATE_LIMIT_ENABLED=false` pour le couper. |
| **Scans** | Workflow `security` : Trivy (vulnérabilités, IaC, secrets ; bloquant sur CRITICAL corrigeable) + CodeQL Java et TypeScript, résultats dans l'onglet *Security*. Dependabot hebdomadaire (Maven, npm, pub, Actions, Docker, Terraform). |
| **Web** | Onglets « Espace pro » et « Admin » affichés selon le rôle, bouton « Annuler » sur les matchs. |

## Tester en local

```bash
cd infra/local && docker compose up -d --build && ./smoke-test.sh   # 15 étapes
```

Comptes (mot de passe `demo1234`) : `ibou.business` → Espace pro ; `admin.sportmatch` → Admin ;
`awa.player` → reçoit 403 sur ces deux espaces.

## Endpoints ajoutés

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `/api/v1/business/pro/courts` · `/dashboard` · `/bookings?from&to` | provider |
| POST / PATCH | `/api/v1/business/pro/courts` · `/courts/{id}` | provider |
| POST / DELETE | `/api/v1/business/pro/courts/{id}/blocks` · `/blocks/{id}` | provider |
| GET | `/api/v1/admin/overview` · `/api/v1/admin/events?type&limit` | admin |
| POST | `/api/v1/matches/{id}/cancel` | organisateur du match ou admin |

## À faire côté plateforme

- Activer *Code scanning* (gratuit sur dépôt public, GHAS sinon) pour voir les SARIF.
- Staging/production : renseigner `REDIS_HOST` (ElastiCache), déjà injecté par les workflows de déploiement.
