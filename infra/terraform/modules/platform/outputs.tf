output "cluster_name" {
  value = module.eks.cluster_name
}

output "kubeconfig_command" {
  description = "Commande pour configurer kubectl"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${module.eks.cluster_name}"
}

output "rds_endpoint" {
  description = "À reporter dans values-staging.yaml (commonEnv.DB_HOST)"
  value       = module.rds.db_instance_address
}

output "rds_master_secret_arn" {
  value = module.rds.db_instance_master_user_secret_arn
}

output "redis_endpoint" {
  description = "À reporter dans values-staging.yaml (services.chat.env.REDIS_HOST)"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "kafka_bootstrap" {
  description = "Bootstrap MSK si kafka_mode = msk, sinon Strimzi dans le cluster"
  value       = var.kafka_mode == "msk" ? aws_msk_cluster.kafka[0].bootstrap_brokers : "sportmatch-kafka-kafka-bootstrap.kafka:9092"
}

output "lb_controller_role_arn" {
  value = module.lb_controller_irsa.iam_role_arn
}

output "external_secrets_role_arn" {
  value = module.external_secrets_irsa.iam_role_arn
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}
