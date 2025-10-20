# PeoplePerson Shared Infrastructure
# Resources shared across all environments

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
    prefix = "terraform/state/shared"
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

# Cloud SQL Instance - Shared across environments
resource "google_sql_database_instance" "peopleperson_db" {
  name             = "peopleperson-db"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier              = "db-g1-small"
    availability_type = "REGIONAL"
    disk_size         = 20
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = true
      private_network = null
      ssl_mode        = "ALLOW_UNENCRYPTED_AND_ENCRYPTED"

      authorized_networks {
        name  = "allow-all-for-dev"
        value = "0.0.0.0/0"
      }
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM
      update_track = "stable"
    }
  }

  deletion_protection = true

  lifecycle {
    prevent_destroy = true
  }
}

# Production Database
resource "google_sql_database" "peopleperson_production" {
  name     = "peopleperson_production"
  instance = google_sql_database_instance.peopleperson_db.name
  project  = var.project_id
}

# Staging Database
resource "google_sql_database" "peopleperson_staging" {
  name     = "peopleperson_staging"
  instance = google_sql_database_instance.peopleperson_db.name
  project  = var.project_id
}

# Database User (same user for both databases)
resource "google_sql_user" "app_user" {
  name     = var.db_user
  instance = google_sql_database_instance.peopleperson_db.name
  password = var.db_password
  project  = var.project_id
}

# Twilio Secrets

resource "google_secret_manager_secret" "twilio_account_sid" {
  secret_id = "twilio-account-sid"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    component = "sms"
    shared    = "true"
  }
}

resource "google_secret_manager_secret" "twilio_auth_token" {
  secret_id = "twilio-auth-token"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    component = "sms"
    shared    = "true"
  }
}

resource "google_secret_manager_secret" "twilio_phone_number" {
  secret_id = "twilio-phone-number"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    component = "sms"
    shared    = "true"
  }
}

resource "google_secret_manager_secret_version" "twilio_account_sid" {
  secret      = google_secret_manager_secret.twilio_account_sid.id
  secret_data = var.twilio_account_sid
}

resource "google_secret_manager_secret_version" "twilio_auth_token" {
  secret      = google_secret_manager_secret.twilio_auth_token.id
  secret_data = var.twilio_auth_token
}

resource "google_secret_manager_secret_version" "twilio_phone_number" {
  secret      = google_secret_manager_secret.twilio_phone_number.id
  secret_data = var.twilio_phone_number
}

# Gemini API Key Secret

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    component = "ai"
    shared    = "true"
  }
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key
}

# Database URL Secrets

resource "google_secret_manager_secret" "database_url_production" {
  secret_id = "database-url-production"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = "production"
    component   = "database"
  }
}

resource "google_secret_manager_secret" "database_url_staging" {
  secret_id = "database-url-staging"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = {
    environment = "staging"
    component   = "database"
  }
}

resource "google_secret_manager_secret_version" "database_url_production" {
  secret      = google_secret_manager_secret.database_url_production.id
  secret_data = "postgresql://${var.db_user}:${var.db_password}@/peopleperson_production?host=/cloudsql/${google_sql_database_instance.peopleperson_db.connection_name}"

  depends_on = [
    google_sql_database_instance.peopleperson_db,
    google_sql_database.peopleperson_production,
  ]
}

resource "google_secret_manager_secret_version" "database_url_staging" {
  secret      = google_secret_manager_secret.database_url_staging.id
  secret_data = "postgresql://${var.db_user}:${var.db_password}@/peopleperson_staging?host=/cloudsql/${google_sql_database_instance.peopleperson_db.connection_name}"

  depends_on = [
    google_sql_database_instance.peopleperson_db,
    google_sql_database.peopleperson_staging,
  ]
}

# IAM bindings for secrets access

resource "google_secret_manager_secret_iam_binding" "database_url_production_access" {
  secret_id = google_secret_manager_secret.database_url_production.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "database_url_staging_access" {
  secret_id = google_secret_manager_secret.database_url_staging.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "twilio_account_sid_access" {
  secret_id = google_secret_manager_secret.twilio_account_sid.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "twilio_auth_token_access" {
  secret_id = google_secret_manager_secret.twilio_auth_token.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "twilio_phone_number_access" {
  secret_id = google_secret_manager_secret.twilio_phone_number.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "gemini_api_key_access" {
  secret_id = google_secret_manager_secret.gemini_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  members = [
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}
