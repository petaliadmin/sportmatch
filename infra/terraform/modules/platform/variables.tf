variable "region" {
  description = "Région AWS (Paris par défaut, la plus proche de Dakar parmi les régions européennes)"
  type        = string
  default     = "eu-west-3"
}

variable "environment" {
  description = "staging ou production"
  type        = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "kubernetes_version" {
  description = "Version EKS (garder une version en support standard pour éviter le surcoût du support étendu)"
  type        = string
  default     = "1.33"
}

variable "node_instance_types" {
  description = "Types d'instances du node group (Spot : plusieurs types pour limiter les interruptions)"
  type        = list(string)
  default     = ["t3.large", "t3a.large", "m5.large"]
}

variable "node_capacity_type" {
  description = "SPOT (≈ -65 %) en staging, ON_DEMAND en production"
  type        = string
  default     = "SPOT"
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "rds_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

variable "rds_multi_az" {
  description = "false en staging, true en production"
  type        = bool
  default     = false
}

variable "kafka_mode" {
  description = "strimzi = Kafka dans le cluster (économique, staging) ; msk = Amazon MSK managé"
  type        = string
  default     = "strimzi"

  validation {
    condition     = contains(["strimzi", "msk"], var.kafka_mode)
    error_message = "kafka_mode doit valoir strimzi ou msk."
  }
}

variable "services_with_database" {
  description = "Une base et un utilisateur PostgreSQL par microservice"
  type        = list(string)
  default     = ["app", "events", "business", "admin", "notifications", "chat"]
}

variable "az_count" {
  description = "Nombre de zones de disponibilité (2 en staging, 3 en production)"
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "true : une NAT partagée (staging) ; false : une NAT par AZ (production)"
  type        = bool
  default     = true
}

variable "rds_deletion_protection" {
  type    = bool
  default = false
}

variable "rds_backup_retention_days" {
  type    = number
  default = 7
}

variable "rds_allocated_storage" {
  type    = number
  default = 50
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "redis_nodes" {
  description = "1 en staging ; 2+ en production (réplica + bascule automatique)"
  type        = number
  default     = 1
}

variable "msk_instance_type" {
  type    = string
  default = "kafka.t3.small"
}
