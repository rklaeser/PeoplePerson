# PeoplePerson Cloud Run Services

# Cloud Run API Service
resource "google_cloud_run_v2_service" "peopleperson_api" {
  name     = "peopleperson-api-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    service_account = local.service_account_email

    annotations = {
      "run.googleapis.com/cloudsql-instances" = local.database_connection_name
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
            secret  = var.environment == "production" ? "database-url-production" : "database-url-staging"
            version = "latest"
          }
        }
      }

      env {
        name = "TWILIO_ACCOUNT_SID"
        value_source {
          secret_key_ref {
            secret  = "twilio-account-sid"
            version = "latest"
          }
        }
      }

      env {
        name = "TWILIO_AUTH_TOKEN"
        value_source {
          secret_key_ref {
            secret  = "twilio-auth-token"
            version = "latest"
          }
        }
      }

      env {
        name = "TWILIO_PHONE_NUMBER"
        value_source {
          secret_key_ref {
            secret  = "twilio-phone-number"
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

}

# Cloud Run Frontend Service
resource "google_cloud_run_v2_service" "peopleperson_frontend" {
  name     = "peopleperson-frontend-${var.environment}"
  location = var.region
  project  = var.project_id

  template {
    service_account = local.service_account_email

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