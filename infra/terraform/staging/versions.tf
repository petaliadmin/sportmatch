terraform {
  required_version = ">= 1.6"

  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.80" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }

  # État distant partagé (à créer une fois : bucket S3 versionné + table DynamoDB de verrouillage).
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
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
