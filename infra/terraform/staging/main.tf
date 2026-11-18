data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name = "sportmatch-${var.environment}"
  azs  = slice(data.aws_availability_zones.available.names, 0, 2)
}

# ---------------------------------------------------------------- Réseau
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.13"

  name = local.name
  cidr = var.vpc_cidr
  azs  = local.azs

  private_subnets  = [for i, _ in local.azs : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnets   = [for i, _ in local.azs : cidrsubnet(var.vpc_cidr, 8, 48 + i)]
  database_subnets = [for i, _ in local.azs : cidrsubnet(var.vpc_cidr, 8, 64 + i)]

  enable_nat_gateway           = true
  single_nat_gateway           = true # staging : une seule NAT (~37 $/mois) ; production : une par AZ
  enable_dns_hostnames         = true
  create_database_subnet_group = true

  public_subnet_tags  = { "kubernetes.io/role/elb" = 1 }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = 1 }
}

# Endpoint S3 de type gateway : gratuit, évite de faire transiter le trafic S3 par la NAT.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
}

# ---------------------------------------------------------------- Kubernetes (EKS)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.31"

  cluster_name    = local.name
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true
  enable_irsa                              = true

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  cluster_addons = {
    coredns                = {}
    kube-proxy             = {}
    vpc-cni                = {}
    eks-pod-identity-agent = {}
    aws-ebs-csi-driver     = { service_account_role_arn = module.ebs_csi_irsa.iam_role_arn }
  }

  eks_managed_node_groups = {
    general = {
      instance_types = var.node_instance_types
      capacity_type  = var.node_capacity_type
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      desired_size   = var.node_min_size
      labels         = { workload = "general" }
    }
  }
}

module "ebs_csi_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.48"

  role_name             = "${local.name}-ebs-csi"
  attach_ebs_csi_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:ebs-csi-controller-sa"]
    }
  }
}

# Rôle IRSA de l'AWS Load Balancer Controller (ALB pour l'Ingress)
module "lb_controller_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.48"

  role_name                              = "${local.name}-lb-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
}

# Rôle IRSA d'External Secrets Operator (synchronise Secrets Manager → Secrets Kubernetes)
module "external_secrets_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.48"

  role_name                             = "${local.name}-external-secrets"
  attach_external_secrets_policy        = true
  external_secrets_secrets_manager_arns = ["arn:aws:secretsmanager:${var.region}:*:secret:sportmatch/${var.environment}/*"]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["external-secrets:external-secrets"]
    }
  }
}

# ---------------------------------------------------------------- PostgreSQL 16 (RDS) + PostGIS
resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "PostgreSQL accessible uniquement depuis les noeuds EKS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.10"

  identifier = local.name

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = var.rds_instance_class

  allocated_storage     = 50
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = "sportmatch"
  username = "sportmatch_admin"
  port     = 5432

  # Mot de passe maître géré par RDS dans Secrets Manager (rotation automatique)
  manage_master_user_password = true

  multi_az               = var.rds_multi_az
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  deletion_protection     = false # staging ; true en production
  skip_final_snapshot     = true

  performance_insights_enabled = true
}

# Identifiants applicatifs (une base par service), stockés dans Secrets Manager.
# Les bases, rôles et l'extension PostGIS sont créés par le job d'amorçage décrit dans le guide de phase 3.
resource "random_password" "db" {
  for_each = toset(var.services_with_database)
  length   = 32
  special  = false
}

resource "aws_secretsmanager_secret" "db" {
  for_each                = toset(var.services_with_database)
  name                    = "sportmatch/${var.environment}/db-${each.key}"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "db" {
  for_each  = toset(var.services_with_database)
  secret_id = aws_secretsmanager_secret.db[each.key].id
  secret_string = jsonencode({
    username = "sm_${each.key}"
    password = random_password.db[each.key].result
    database = "sportmatch_${each.key}"
  })
}

# ---------------------------------------------------------------- Redis (ElastiCache) pour le chat
resource "aws_security_group" "redis" {
  name        = "${local.name}-redis"
  description = "Redis accessible uniquement depuis les noeuds EKS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name}-redis"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id         = "${local.name}-redis"
  engine             = "redis"
  engine_version     = "7.1"
  node_type          = "cache.t4g.micro"
  num_cache_nodes    = 1
  port               = 6379
  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
}

# ---------------------------------------------------------------- Kafka managé (option)
resource "aws_security_group" "msk" {
  count       = var.kafka_mode == "msk" ? 1 : 0
  name        = "${local.name}-msk"
  description = "Kafka accessible uniquement depuis les noeuds EKS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 9092
    to_port         = 9098
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

resource "aws_msk_cluster" "kafka" {
  count                  = var.kafka_mode == "msk" ? 1 : 0
  cluster_name           = local.name
  kafka_version          = "3.6.0"
  number_of_broker_nodes = length(local.azs)

  broker_node_group_info {
    instance_type   = "kafka.t3.small"
    client_subnets  = module.vpc.private_subnets
    security_groups = [aws_security_group.msk[0].id]

    storage_info {
      ebs_storage_info {
        volume_size = 20
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS_PLAINTEXT"
    }
  }
}

# ---------------------------------------------------------------- Médias (photos de terrains)
resource "aws_s3_bucket" "media" {
  bucket_prefix = "${local.name}-media-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
