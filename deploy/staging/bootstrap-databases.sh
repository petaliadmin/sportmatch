#!/usr/bin/env bash
# Crée sur RDS les bases, rôles et l'extension PostGIS de chaque microservice (idempotent).
# À lancer une fois après "terraform apply", depuis un poste ayant accès au VPC
# (ex. : kubectl run temporaire dans le cluster, voir docs/integration/PHASE-3-STAGING.md).
# Variables : RDS_HOST, MASTER_USER, MASTER_PASSWORD, ENVIRONMENT (staging), AWS_REGION
set -euo pipefail
: "${RDS_HOST:?}" "${MASTER_USER:?}" "${MASTER_PASSWORD:?}"
ENVIRONMENT="${ENVIRONMENT:-staging}"
export PGPASSWORD="$MASTER_PASSWORD" PGSSLMODE=require

for svc in app events business admin notifications chat; do
  secret=$(aws secretsmanager get-secret-value --region "${AWS_REGION:-eu-west-3}" \
    --secret-id "sportmatch/$ENVIRONMENT/db-$svc" --query SecretString --output text)
  user=$(echo "$secret" | jq -r .username); pass=$(echo "$secret" | jq -r .password); db=$(echo "$secret" | jq -r .database)
  echo "→ $db"
  psql -h "$RDS_HOST" -U "$MASTER_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$user') THEN CREATE ROLE $user LOGIN PASSWORD '$pass';
  ELSE ALTER ROLE $user PASSWORD '$pass'; END IF;
END \$\$;
GRANT $user TO $MASTER_USER;
SQL
  psql -h "$RDS_HOST" -U "$MASTER_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1 \
    || psql -h "$RDS_HOST" -U "$MASTER_USER" -d postgres -c "CREATE DATABASE $db OWNER $user"
done
psql -h "$RDS_HOST" -U "$MASTER_USER" -d sportmatch_app -c "CREATE EXTENSION IF NOT EXISTS postgis"
echo "Bases prêtes."
