# PeoplePerson Infrastructure Configuration
# Main Terraform configuration for production deployment

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

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
  ])
  
  service            = each.value
  disable_on_destroy = false
}

# Service Account for Cloud Run services
resource "google_service_account" "cloud_run_sa" {
  account_id   = "peopleperson-cloud-run"
  display_name = "PeoplePerson Cloud Run Service Account"
  description  = "Service account for PeoplePerson Cloud Run services"
}

# IAM roles for the service account
resource "google_project_iam_member" "cloud_run_sa_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Note: The Terraform state bucket 'peopleperson-terraform-state' is created manually
# to avoid circular dependency issues. It should NOT be managed by Terraform itself.
# 
# To create manually:
# gsutil mb gs://peopleperson-terraform-state
# gsutil versioning set on gs://peopleperson-terraform-state