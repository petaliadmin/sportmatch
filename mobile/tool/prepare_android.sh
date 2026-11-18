#!/usr/bin/env bash
# Génère le projet Android (flutter create, idempotent) puis applique la configuration SportMatch :
# identifiant com.sportmatch.app, schéma de redirection OAuth (AppAuth), minSdk 23, permissions,
# HTTP en clair limité à l'émulateur (10.0.2.2) et au poste local.
set -euo pipefail
cd "$(dirname "$0")/.."

flutter create --platforms=android --org com.sportmatch --project-name sportmatch_mobile . > /dev/null
python3 tool/patch_android.py
echo "Projet Android prêt (android/)."
