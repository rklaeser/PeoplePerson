# PeoplePerson Cloud Run Services

# Cloud Run API Service
resource "google_cloud_run_v2_service" "peopleperson_api" {
  name     = "peopleperson-api-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_sa.email
    
    annotations = {
      "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.peopleperson_db.connection_name
    }
    
    containers {
      image = "gcr.io/${var.project_id}/peopleperson-api:${var.image_tag}"
      
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      
      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.project_id
      }
      
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.environment == "production" ? google_secret_manager_secret.database_url_production.secret_id : google_secret_manager_secret.database_url_staging.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "TWILIO_ACCOUNT_SID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.twilio_account_sid.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "TWILIO_AUTH_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.twilio_auth_token.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "TWILIO_PHONE_NUMBER"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.twilio_phone_number.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 8080
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 5
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds       = 3
        period_seconds        = 10
      }
    }

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret.database_url_production,
    google_secret_manager_secret.database_url_staging,
  ]
}

# Cloud Run Frontend Service
resource "google_cloud_run_v2_service" "peopleperson_frontend" {
  name     = "peopleperson-frontend-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    service_account = google_service_account.cloud_run_sa.email
    
    containers {
      image = "gcr.io/${var.project_id}/peopleperson-frontend:${var.image_tag}"
      
      env {
        name  = "NODE_ENV"
        value = var.environment
      }
      
      env {
        name  = "VITE_API_URL"
        value = google_cloud_run_v2_service.peopleperson_api.uri
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      ports {
        container_port = 8080
      }
    }

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 10 : 3
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.required_apis]
}

# IAM Policy to allow public access to services
resource "google_cloud_run_service_iam_member" "api_public_access" {
  service  = google_cloud_run_v2_service.peopleperson_api.name
  location = google_cloud_run_v2_service.peopleperson_api.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public_access" {
  service  = google_cloud_run_v2_service.peopleperson_frontend.name
  location = google_cloud_run_v2_service.peopleperson_frontend.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}