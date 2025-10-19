# PeoplePerson Shared Infrastructure Outputs

output "service_account_email" {
  description = "Email of the Cloud Run service account"
  value       = google_service_account.cloud_run_sa.email
}

output "database_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.peopleperson_db.connection_name
}

output "database_instance_ip" {
  description = "Cloud SQL instance public IP"
  value       = google_sql_database_instance.peopleperson_db.public_ip_address
}

output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}
