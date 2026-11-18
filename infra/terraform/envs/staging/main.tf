# Staging : economique (1 NAT, Spot, RDS et Redis mono-AZ, Kafka dans le cluster).
module "platform" {
  source = "../../modules/platform"

  region      = var.region
  environment = "staging"
  vpc_cidr    = "10.20.0.0/16"

  az_count           = 2
  single_nat_gateway = true

  node_capacity_type = "SPOT"
  node_min_size      = 2
  node_max_size      = 4

  rds_instance_class        = "db.t4g.medium"
  rds_multi_az              = false
  rds_deletion_protection   = false
  rds_backup_retention_days = 7

  redis_nodes = 1
  kafka_mode  = "strimzi"
}
