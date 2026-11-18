# Production : haute disponibilite sur 3 AZ (NAT par AZ, RDS Multi-AZ, Redis replique, MSK).
module "platform" {
  source = "../../modules/platform"

  region      = var.region
  environment = "production"
  vpc_cidr    = "10.30.0.0/16"

  az_count           = 3
  single_nat_gateway = false

  node_instance_types = ["m6i.large", "m5.large"]
  node_capacity_type  = "ON_DEMAND"
  node_min_size       = 3
  node_max_size       = 8

  rds_instance_class        = "db.m6g.large"
  rds_multi_az              = true
  rds_deletion_protection   = true
  rds_backup_retention_days = 14
  rds_allocated_storage     = 100

  redis_node_type = "cache.t4g.small"
  redis_nodes     = 2
  kafka_mode      = "msk"
}
