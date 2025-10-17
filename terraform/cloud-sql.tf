# PeoplePerson Cloud SQL Database

# Cloud SQL Instance
resource "google_sql_database_instance" "peopleperson_db" {
  name             = "peopleperson-db"
  database_version = "POSTGRES_15"
  region           = var.region
  project          = var.project_id

  settings {
    tier              = var.environment == "production" ? "db-g1-small" : "db-f1-micro"
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_size         = var.environment == "production" ? 20 : 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = var.region
      point_in_time_recovery_enabled = var.environment == "production"
      transaction_log_retention_days = var.environment == "production" ? 7 : 1
      
      backup_retention_settings {
        retained_backups = var.environment == "production" ? 30 : 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = true
      private_network = null
      require_ssl     = false

      authorized_networks {
        name  = "allow-all-for-dev"
        value = "0.0.0.0/0"
      }
    }

    database_flags {
      name  = "max_connections"
      value = var.environment == "production" ? "100" : "25"
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

  deletion_protection = var.environment == "production"
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