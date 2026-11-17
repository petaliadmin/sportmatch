# Phase 2A — Métier bêta : réservations, chat temps réel, e-mails, résilience

> Suite de la [phase 1](PHASE-1-LOCAL.md). Même démarrage : `make up` puis `make smoke`
> (ou double-clic sur `sportmatch-launch.bat` sous Windows).

## 1. Ce qui est livré

| Service | Nouveautés |
|---|---|
| **platform-messaging** (nouveau module) | Outbox transactionnelle et gestion d'erreurs Kafka (3 tentatives puis `.DLT`) partagées, en auto-configuration Spring Boot |
| **sportmatch-business** | Terrains réservables (19 terrains de démo), disponibilités heure par heure, réservation **de démonstration sans paiement**, refus des chevauchements (verrou sur le terrain), annulation, événements `booking.confirmed` / `booking.cancelled` |
| **sportmatch-chat** | Une conversation par match, créée et alimentée via Kafka (`match.created`, `match.player-joined`) ; messages en REST ; diffusion temps réel en WebSocket via Redis pub/sub ; accès réservé aux participants |
| **sportmatch-notifications** | Notifications de réservation et **e-mails** (Mailpit en local, aucun envoi réel) |
| **sportmatch-gateway** | Resilience4j : circuit breaker par service, 2 nouvelles tentatives sur les GET, réponse 503 propre ; relais de l'e-mail du jeton ; jeton accepté en `?access_token=` pour le WebSocket |

## 2. Nouveaux endpoints (via http://localhost:8080)

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/v1/business/courts?venueId=` | public |
| GET | `/api/v1/business/courts/{id}/availability?date=2030-06-15` | public |
| POST | `/api/v1/business/bookings` `{courtId, startsAt, hours}` | connecté |
| GET | `/api/v1/business/bookings/mine` | connecté |
| POST | `/api/v1/business/bookings/{id}/cancel` | propriétaire |
| GET | `/api/v1/chat/conversations` | connecté |
| GET | `/api/v1/chat/conversations/by-match/{matchId}` | participant |
| GET · POST | `/api/v1/chat/conversations/{id}/messages` | participant |
| WS | `ws://localhost:8080/api/v1/chat/ws?conversationId=…&access_token=…` | participant (réception temps réel) |

Règles de réservation : créneaux à l'heure pile, 1 à 3 h, dans les heures d'ouverture du terrain (heure de Dakar), jamais dans le passé.

## 3. Vérifier à la main

1. `make smoke` : 12 étapes, dont le chat, la réservation, l'e-mail et l'annulation.
2. Ouvrir **Mailpit** (http://localhost:8025) : l'e-mail « SportMatch · Réservation confirmée » adressé à `awa.player@demo.sportmatch.test`.
3. Ouvrir **Kafka UI** (http://localhost:8090) : topics `sportmatch.app.match.v1` et `sportmatch.business.booking.v1`.
4. **Temps réel** : avec un client WebSocket (extension navigateur, `wscat`…), se connecter à l'URL WS ci-dessus avec le jeton de Moussa, puis poster un message en REST avec le jeton d'Awa : il arrive instantanément.
5. **Résilience** : `docker compose -f infra/local/docker-compose.yml stop sportmatch-business`, puis `curl -i http://localhost:8080/api/v1/business/courts` → 503 « Service indisponible » au lieu d'une erreur brute. `start` pour rétablir.

## 4. Reste à faire (lot 2B)

- **sportmatch-events** : tournois (création, inscriptions d'équipes, tableau).
- **PostGIS** : recherche de terrains par distance.
- **Front Next.js** branché sur l'API : connexion Keycloak (OIDC PKCE), catalogue, matchs, réservations, chat temps réel.
- Test automatisé du WebSocket dans la CI.
