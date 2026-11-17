#!/usr/bin/env bash
# Test de bout en bout (e2e) de la phase 1, joué en local et dans la CI.
# Parcours : catalogue public → connexion Keycloak → création de match → inscription d'un 2e joueur
#            → notification via Kafka → chat du match → réservation de créneau (démo) + e-mail → annulation.
set -euo pipefail

GATEWAY="${GATEWAY:-http://localhost:8080}"
KEYCLOAK="${KEYCLOAK:-http://localhost:8180}"
MAILPIT="${MAILPIT:-http://localhost:8025}"
TOKEN_URL="$KEYCLOAK/realms/sportmatch/protocol/openid-connect/token"

step() { printf '\n\033[1;32m▶ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*"; exit 1; }
json_field() { sed -nE "s/.*\"$1\":\"?([^\",}]*)\"?.*/\1/p" | head -1; }

retry() { # retry <tentatives> <pause> <commande...>
  local n=$1 pause=$2; shift 2
  for ((i = 1; i <= n; i++)); do "$@" && return 0; sleep "$pause"; done
  return 1
}

token_for() {
  curl -fsS -X POST "$TOKEN_URL" \
    -d grant_type=password -d client_id=sportmatch-web \
    -d username="$1" -d password=demo1234 | json_field access_token
}

step "1. Gateway prête"
retry 60 5 curl -fsS "$GATEWAY/actuator/health/readiness" > /dev/null || fail "La gateway ne répond pas"

step "2. Catalogue public des terrains (sans jeton)"
VENUES=$(curl -fsS "$GATEWAY/api/v1/venues?sport=football")
echo "$VENUES" | grep -q "Arena Almadies Five" || fail "Terrains de démo absents : $VENUES"
VENUE_ID=$(echo "$VENUES" | json_field id)
echo "Terrain choisi : $VENUE_ID"

step "3. Écriture refusée sans jeton (401)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$GATEWAY/api/v1/matches" -H 'Content-Type: application/json' -d '{}')
[ "$CODE" = "401" ] || fail "Attendu 401, reçu $CODE"

step "4. Connexion Keycloak d'Awa (organisatrice) et de Moussa"
retry 30 5 curl -fsS "$KEYCLOAK/realms/sportmatch/.well-known/openid-configuration" > /dev/null || fail "Keycloak indisponible"
AWA=$(token_for awa.player); MOUSSA=$(token_for moussa.player)
[ -n "$AWA" ] && [ -n "$MOUSSA" ] || fail "Jetons non obtenus"

step "5. Awa crée un match de 2 joueurs"
MATCH=$(curl -fsS -X POST "$GATEWAY/api/v1/matches" \
  -H "Authorization: Bearer $AWA" -H 'Content-Type: application/json' \
  -d "{\"venueId\":\"$VENUE_ID\",\"sport\":\"FOOTBALL\",\"startsAt\":\"2030-06-15T18:00:00Z\",\"durationMinutes\":90,\"maxPlayers\":2,\"level\":\"INTERMEDIATE\"}")
MATCH_ID=$(echo "$MATCH" | json_field id)
[ -n "$MATCH_ID" ] || fail "Création échouée : $MATCH"
echo "Match créé : $MATCH_ID"

step "6. Moussa rejoint le match → statut FULL"
JOINED=$(curl -fsS -X POST "$GATEWAY/api/v1/matches/$MATCH_ID/join" -H "Authorization: Bearer $MOUSSA")
echo "$JOINED" | grep -q '"status":"FULL"' || fail "Inscription inattendue : $JOINED"

step "7. Notification reçue par Awa via Kafka (outbox → topic → sportmatch-notifications)"
has_notification() { curl -fsS "$GATEWAY/api/v1/notifications" -H "Authorization: Bearer $AWA" | grep -q "a rejoint"; }
retry 30 2 has_notification || fail "Aucune notification reçue"

step "8. Chat du match : conversation créée via Kafka, message de Moussa lu par Awa"
conversation_id() { curl -fsS "$GATEWAY/api/v1/chat/conversations/by-match/$MATCH_ID" -H "Authorization: Bearer $1" | json_field conversationId; }
has_conversation() { [ -n "$(conversation_id "$MOUSSA" 2>/dev/null)" ]; }
retry 30 2 has_conversation || fail "Conversation du match non créée"
CONV=$(conversation_id "$MOUSSA")
TEXT="On se retrouve 15 min avant ? #$RANDOM"
curl -fsS -X POST "$GATEWAY/api/v1/chat/conversations/$CONV/messages" \
  -H "Authorization: Bearer $MOUSSA" -H 'Content-Type: application/json' -d "{\"body\":\"$TEXT\"}" > /dev/null
curl -fsS "$GATEWAY/api/v1/chat/conversations/$CONV/messages" -H "Authorization: Bearer $AWA" | grep -qF "$TEXT" || fail "Message absent"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$GATEWAY/api/v1/chat/conversations/$CONV/messages" -H "Authorization: Bearer $(token_for fatou.orga)")
[ "$CODE" = "403" ] || fail "Un non-participant lit le chat (code $CODE)"
echo "  ✓ conversation $CONV, message reçu, accès refusé aux non-participants"

step "9. Réservation de démonstration d'un créneau (sans paiement)"
COURT=c0a7c1e0-0001-4b00-9000-000000000002
curl -fsS "$GATEWAY/api/v1/business/courts" | grep -q "$COURT" || fail "Terrains réservables absents"
SLOT=$(printf '2031-%02d-%02dT%02d:00:00Z' $((RANDOM % 12 + 1)) $((RANDOM % 28 + 1)) $((RANDOM % 14 + 8)))
BOOKING=$(curl -fsS -X POST "$GATEWAY/api/v1/business/bookings" -H "Authorization: Bearer $AWA" \
  -H 'Content-Type: application/json' -d "{\"courtId\":\"$COURT\",\"startsAt\":\"$SLOT\",\"hours\":1}")
BOOKING_ID=$(echo "$BOOKING" | sed -nE 's/^\{"id":"([^"]+)".*/\1/p')
[ -n "$BOOKING_ID" ] || fail "Réservation échouée : $BOOKING"
echo "  ✓ créneau $SLOT réservé ($BOOKING_ID)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$GATEWAY/api/v1/business/bookings" -H "Authorization: Bearer $MOUSSA" \
  -H 'Content-Type: application/json' -d "{\"courtId\":\"$COURT\",\"startsAt\":\"$SLOT\",\"hours\":1}")
[ "$CODE" = "409" ] || fail "Double réservation non bloquée (code $CODE)"
echo "  ✓ double réservation refusée (409)"

step "10. Confirmation : notification in-app + e-mail (Mailpit)"
booking_notified() { curl -fsS "$GATEWAY/api/v1/notifications" -H "Authorization: Bearer $AWA" | grep -q "aucun paiement"; }
retry 30 2 booking_notified || fail "Notification de réservation absente"
mail_received() { curl -fsS "$MAILPIT/api/v1/messages" | grep -q "awa.player@demo.sportmatch.test"; }
retry 30 2 mail_received || fail "E-mail de confirmation absent de Mailpit"
echo "  ✓ notification et e-mail reçus"

step "11. Annulation (le créneau est libéré)"
curl -fsS -X POST "$GATEWAY/api/v1/business/bookings/$BOOKING_ID/cancel" -H "Authorization: Bearer $AWA" | grep -q '"status":"CANCELLED"' \
  || fail "Annulation échouée"

step "12. Services amorcés joignables via la gateway"
for svc in events admin; do
  curl -fsS "$GATEWAY/api/v1/$svc/status" -H "Authorization: Bearer $AWA" | grep -q "sportmatch-$svc" || fail "$svc injoignable"
  echo "  ✓ sportmatch-$svc"
done

printf '\n\033[1;32m✅ Phase 2A validée : matchs, notifications, chat et réservations fonctionnent de bout en bout.\033[0m\n'
