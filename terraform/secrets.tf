# PeoplePerson Secret Manager Resources

# Production Database URL Secret Container
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

# Staging Database URL Secret Container  
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

# Production Database URL Secret Version
resource "google_secret_manager_secret_version" "database_url_production" {
  secret      = google_secret_manager_secret.database_url_production.id
  secret_data = "postgresql://${var.db_user}:${var.db_password}@/peopleperson_production?host=/cloudsql/${google_sql_database_instance.peopleperson_db.connection_name}"

  depends_on = [
    google_sql_database_instance.peopleperson_db,
    google_sql_database.peopleperson_production,
  ]
}

# Staging Database URL Secret Version
resource "google_secret_manager_secret_version" "database_url_staging" {
  secret      = google_secret_manager_secret.database_url_staging.id
  secret_data = "postgresql://${var.db_user}:${var.db_password}@/peopleperson_staging?host=/cloudsql/${google_sql_database_instance.peopleperson_db.connection_name}"

  depends_on = [
    google_sql_database_instance.peopleperson_db,
    google_sql_database.peopleperson_staging,
  ]
}

# Twilio Secret Versions
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



# Twilio Account SID Secret (shared across environments)
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

# Twilio Auth Token Secret (shared across environments)
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

# Twilio Phone Number Secret (shared across environments)
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


