# PeoplePerson Environment-Specific Infrastructure
# Cloud Run services and domain mappings

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "peopleperson-terraform-state"
    # prefix will be provided via terraform init -backend-config
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Reference shared infrastructure
data "terraform_remote_state" "shared" {
  backend = "gcs"
  config = {
    bucket = "peopleperson-terraform-state"
    prefix = "terraform/state/shared"
  }
}

# Local references to shared outputs
locals {
  service_account_email    = data.terraform_remote_state.shared.outputs.service_account_email
  database_connection_name = data.terraform_remote_state.shared.outputs.database_connection_name
}
