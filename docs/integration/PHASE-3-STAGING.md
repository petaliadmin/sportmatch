# Phase 3 — Plateforme : Kubernetes, Terraform AWS et livraison continue

> Suite de la [phase 2B](PHASE-2B.md). Objectif : déployer la bêta sur un environnement de **staging AWS**
> (EKS, RDS, ElastiCache, Kafka) alimenté automatiquement par la branche `develop`.

## 1. Ce qui est livré

| Élément | Emplacement | Validé par la CI |
|---|---|---|
| Chart Helm des 7 microservices et du front | `deploy/helm/sportmatch` | `helm lint` + rendu staging + **déploiement réel sur kind** |
| Chart des dépendances de dev (PostGIS, Kafka, Redis, Keycloak, Mailpit) | `deploy/helm/sportmatch-deps` | déploiement réel sur kind |
| Répétition générale Kubernetes | `deploy/kind/rehearsal.sh` (`make kind`) | **test de bout en bout complet (14 étapes) sur Kubernetes** |
| Infrastructure AWS staging | `infra/terraform/envs/staging` | `terraform fmt` + `terraform validate` |
| Amorçage des bases RDS, secrets, Kafka Strimzi | `deploy/staging/` | syntaxe YAML / bash |
| Livraison continue | `.github/workflows/deploy-staging.yml` | inactive tant que les variables ne sont pas posées |

Ce que contient le chart : sondes `startup` / `readiness` / `liveness` sur Actuator, mises à jour progressives sans
interruption (`maxUnavailable: 0`), arrêt propre, HPA (2 à 4 pods), PodDisruptionBudget, Ingress ALB, ServiceMonitor
Prometheus, identifiants de base lus depuis des Secrets Kubernetes, aucun conteneur en root.

## 2. Répéter le déploiement Kubernetes sur son poste (gratuit)

Prérequis : Docker, [kind](https://kind.sigs.k8s.io), kubectl, Helm. Arrêter d'abord l'environnement Docker Compose (mêmes ports).

```bash
make down          # libère les ports
make kind          # cluster kind + images + dépendances + microservices + redirections de ports
make smoke         # même test de bout en bout qu'en Docker Compose
make kind-down     # supprime le cluster
```

## 3. Mise en service du staging AWS (pas à pas)

> Coût estimé : 220 à 520 $/mois selon les options (voir l'estimation budgétaire). Démarrer avec des
> crédits AWS Activate de préférence. **Rien n'est créé sur AWS tant que l'étape 3.2 n'est pas lancée.**

### 3.1 Prérequis (une fois)

- Compte AWS, AWS CLI, Terraform ≥ 1.6, kubectl, Helm, jq.
- Un nom de domaine et un certificat ACM en `eu-west-3` pour `staging.<domaine>`, `api.staging.<domaine>`, `auth.staging.<domaine>`.
- Bucket S3 versionné + table DynamoDB pour l'état Terraform, puis décommenter le bloc `backend "s3"` de `versions.tf`.

### 3.2 Infrastructure (≈ 20 min)

```bash
cd infra/terraform/envs/staging
# réglages de l'environnement : main.tf (kafka_mode, tailles…)
terraform init
terraform plan -out staging.plan               # relire le plan avant d'appliquer
terraform apply staging.plan
terraform output                               # endpoints à reporter plus bas
$(terraform output -raw kubeconfig_command)    # configure kubectl
```

### 3.3 Outillage du cluster

```bash
# Load Balancer Controller (Ingress → ALB)
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller -n kube-system \
  --set clusterName=sportmatch-staging \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$(terraform output -raw lb_controller_role_arn)

# External Secrets (Secrets Manager → Secrets Kubernetes)
helm repo add external-secrets https://charts.external-secrets.io
helm upgrade --install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$(terraform output -raw external_secrets_role_arn)

# Kafka (si kafka_mode = strimzi)
helm repo add strimzi https://strimzi.io/charts/
helm upgrade --install strimzi strimzi/strimzi-kafka-operator -n kafka --create-namespace
kubectl apply -f deploy/staging/kafka-strimzi.yaml

# Observabilité (Prometheus, Grafana, alertes)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

Keycloak de staging : opérateur Keycloak ou chart de la communauté, base sur la même instance RDS
(base `keycloak` dédiée), exposé sur `auth.staging.<domaine>` ; importer `infra/local/keycloak/realm-sportmatch.json`
**sans les comptes de démonstration** et avec les URL de staging.

### 3.4 Bases de données (une fois)

Les rôles et bases applicatives sont créés depuis l'intérieur du VPC :

```bash
kubectl create namespace sportmatch
kubectl apply -f deploy/staging/external-secrets.yaml
# Mot de passe maître : Secrets Manager, ARN dans "terraform output rds_master_secret_arn"
kubectl run db-bootstrap -n sportmatch --rm -it --image=postgres:16-alpine -- sh
#   puis, dans le pod : installer aws-cli et jq, exporter RDS_HOST / MASTER_USER / MASTER_PASSWORD,
#   et exécuter le contenu de deploy/staging/bootstrap-databases.sh
```

### 3.5 Livraison continue depuis GitHub

1. Créer un rôle IAM « GitHub OIDC » (fédération `token.actions.githubusercontent.com`, restreint au dépôt
   `petaliadmin/sportmatch` et à l'environnement `staging`) avec accès EKS (`aws eks update-kubeconfig` + entrée d'accès au cluster).
2. Dans **Settings → Secrets and variables → Actions** :

| Type | Nom | Valeur |
|---|---|---|
| Secret | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | compte Docker Hub (jeton d'accès) |
| Variable | `DOCKERHUB_NAMESPACE` | `petaliadmin` |
| Variable | `AWS_DEPLOY_ROLE_ARN` | ARN du rôle OIDC |
| Variable | `STAGING_RDS_ENDPOINT` | `terraform output rds_endpoint` |
| Variable | `STAGING_REDIS_ENDPOINT` | `terraform output redis_endpoint` |
| Variable | `STAGING_API_URL` | `https://api.staging.<domaine>` |
| Variable | `STAGING_KEYCLOAK_URL` | `https://auth.staging.<domaine>` |
| Variable | `STAGING_ENABLED` | `true` (en dernier) |

3. Renseigner dans `values-staging.yaml` le domaine, l'ARN du certificat ACM et l'URL Keycloak.
4. À chaque push sur `develop` : `backend-ci` vert → images publiées (tag = SHA du commit) →
   `helm upgrade --atomic` (retour arrière automatique si un pod ne devient pas prêt) → vérification de santé.

### 3.6 Maîtriser les coûts

- Hors heures ouvrées : `aws eks update-nodegroup-config --scaling-config minSize=0,desiredSize=0 …` et arrêt de RDS (`aws rds stop-db-instance`).
- Fin de période de test : `terraform destroy` (le staging est entièrement reproductible).

## 4. Critères de sortie de la phase 3

- [x] Charts Helm validés et déployés avec succès sur Kubernetes (kind) en CI
- [x] Test de bout en bout complet vert sur Kubernetes
- [x] Terraform staging validé (`fmt`, `validate`)
- [ ] `terraform apply` exécuté sur le compte AWS (décision budgétaire)
- [ ] Premier déploiement automatique de `develop` sur le staging
- [ ] Tableaux de bord Grafana et alertes de base (pods en erreur, latence p95, DLQ Kafka non vide)

## 5. Suite : phase 4 — production bêta

Branche `production` → environnement de production (RDS Multi-AZ, 3 NAT, nœuds à la demande, sauvegardes testées),
promotion **par digest** des images validées en staging, tests de charge, application Flutter en test fermé.
