terraform {
  required_version = ">= 1.6"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.80" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # Etat distant (bucket S3 versionne + table DynamoDB de verrouillage, crees une fois).
  # backend "s3" {
  #   bucket         = "sportmatch-terraform-state"
  #   key            = "staging/terraform.tfstate"
  #   region         = "eu-west-3"
  #   dynamodb_table = "sportmatch-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "sportmatch"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

variable "region" {
  type    = string
  default = "eu-west-3"
}
