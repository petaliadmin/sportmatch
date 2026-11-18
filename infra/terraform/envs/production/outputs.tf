output "cluster_name" {
  value = module.platform.cluster_name
}

output "kubeconfig_command" {
  value = module.platform.kubeconfig_command
}

output "rds_endpoint" {
  value = module.platform.rds_endpoint
}

output "rds_master_secret_arn" {
  value = module.platform.rds_master_secret_arn
}

output "redis_endpoint" {
  value = module.platform.redis_endpoint
}

output "kafka_bootstrap" {
  value = module.platform.kafka_bootstrap
}

output "lb_controller_role_arn" {
  value = module.platform.lb_controller_role_arn
}

output "external_secrets_role_arn" {
  value = module.platform.external_secrets_role_arn
}

output "media_bucket" {
  value = module.platform.media_bucket
}
