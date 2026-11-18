# Phase 6 — Fonctionnalités produit du pilote (web + mobile)

> Données fictives, aucun paiement ni réservation réelle.

## Ce qui est livré

| Fonction | Backend | Web | Mobile |
|---|---|---|---|
| **Recherche filtrée** : statut, sport, niveau, plage de dates | `GET /api/v1/matches?status&sport&level&from&to` | Filtres | Puces + sélecteur de dates |
| **Mes matchs** (organisés ou rejoints, à venir d'abord) | `GET /api/v1/matches/mine` (jeton exigé) | Onglet « Mes matchs » | Segment « Mes matchs » |
| **Quitter un match** (la place se libère, l'organisateur est prévenu) | `POST /matches/{id}/leave` → `match.player-left` | Bouton Quitter | Détail du match |
| **Matchs récurrents** (jusqu'à 8 semaines) | `repeatWeeks` à la création, `seriesId` commun, une seule notification | Champ Répétition | Champ Répétition |
| **Joueurs du match** | `GET /matches/{id}/participants` (nom affiché) | Fenêtre Joueurs | Page Détail |
| **Feuille de présence → fiabilité** | `POST /matches/{id}/attendance` (organisateur, après le coup d'envoi) | ✓ / ✗ par joueur | ✓ / ✗ par joueur |
| **Profil joueur** | `GET/PUT /api/v1/me/profile`, `GET /api/v1/players/{id}` | Onglet Profil | Carte profil + édition |
| **Partage** | Lien `…/?match=<id>#live` qui ouvre le match | Partage natif ou WhatsApp, lien copié | Lien copié dans le presse-papiers |
| **Notifications lues / non lues** | `unread-count`, `{id}/read`, `read-all` | Pastille sur l'onglet, tout marquer lu | Pastille sur Profil, tout marquer lu |
| **Annulation / modération** (phase 5) | — | — | Bouton Annuler (organisateur ou admin) |

**Fiabilité** = présences ÷ présences renseignées. Elle reste « Nouveau joueur » tant qu'aucun organisateur n'a rempli de feuille de présence.

Migration `sportmatch-app` 004 : noms affichés, `series_id`, `attended`, table `player_profile`.

## Tests

- Unitaires : règles (quitter, présence, fiabilité), notifications (départ, série notifiée une fois), client mobile (filtres, profil, participants), rôles mobiles.
- Intégration (Testcontainers) : série, filtres, quitter, mes matchs, présence, fiabilité, profil.
- Bout en bout : `infra/local/smoke-test.sh` passe à **17 étapes**.

## Variables

- Mobile : `--dart-define=WEB_URL=https://…` pour l'adresse des liens partagés (par défaut `http://localhost:3080`).

## Hors périmètre (pour plus tard)

- Notifications push (Firebase Cloud Messaging) : il faut créer un projet Firebase.
- Traduction en wolof.
- Migration Flutter `material.dart` → `material_ui` (dépréciation du SDK 3.50, simple avertissement).
