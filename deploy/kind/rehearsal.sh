#!/usr/bin/env bash
# Répétition générale du déploiement Kubernetes sur un cluster kind (CI ou poste local) :
# mêmes charts Helm qu'en staging, dépendances de dev à la place des services managés AWS.
# Prérequis : docker, kind, kubectl, helm. Arrêter l'environnement Docker Compose avant (mêmes ports).
set -euo pipefail
cd "$(dirname "$0")/../.."

CLUSTER="${CLUSTER:-sportmatch}"
NS=sportmatch
SERVICES=(gateway app events business admin notifications chat web)

step() { printf '\n\033[1;34m■ %s\033[0m\n' "$*"; }

step "Cluster kind « $CLUSTER »"
kind get clusters 2>/dev/null | grep -qx "$CLUSTER" || kind create cluster --name "$CLUSTER" --wait 180s
kubectl cluster-info --context "kind-$CLUSTER" > /dev/null

step "Construction des images (même Dockerfile que la CI et le local)"
docker compose -f infra/local/docker-compose.yml build

step "Chargement des images dans le cluster"
for s in "${SERVICES[@]}"; do
  kind load docker-image "sportmatch/sportmatch-$s:local" --name "$CLUSTER"
done

step "Dépendances de développement (PostgreSQL+PostGIS, Kafka, Redis, Keycloak, Mailpit)"
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f - > /dev/null
helm upgrade --install deps deploy/helm/sportmatch-deps -n "$NS" --wait --timeout 10m

step "Microservices SportMatch (chart de staging, valeurs kind)"
helm upgrade --install sportmatch deploy/helm/sportmatch -n "$NS" \
  -f deploy/helm/sportmatch/values-kind.yaml --wait --timeout 15m
kubectl -n "$NS" get pods -o wide

step "Redirections de ports (mêmes adresses que l'environnement Docker Compose)"
pkill -f "kubectl -n $NS port-forward" 2>/dev/null || true
for pf in "svc/sportmatch-gateway 8080:8080" "svc/keycloak 8180:8080" "svc/mailpit 8025:8025" "svc/sportmatch-web 3080:80"; do
  # shellcheck disable=SC2086
  log="/tmp/pf-$(echo "${pf%% *}" | tr '/' '-').log"
  nohup kubectl -n "$NS" port-forward $pf > "$log" 2>&1 &
done
for i in $(seq 1 20); do curl -fsS -o /dev/null http://localhost:8080/actuator/health/readiness && break; sleep 1; done
echo "Gateway http://localhost:8080 · Keycloak http://localhost:8180 · Web http://localhost:3080/#live"
echo "Test : bash infra/local/smoke-test.sh   ·   Nettoyage : kind delete cluster --name $CLUSTER"
