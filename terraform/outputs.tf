# PeoplePerson Terraform Outputs

output "api_url" {
  description = "URL of the deployed API service"
  value       = google_cloud_run_v2_service.peopleperson_api.uri
}

output "frontend_url" {
  description = "URL of the deployed frontend service"
  value       = google_cloud_run_v2_service.peopleperson_frontend.uri
}

output "database_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.peopleperson_db.connection_name
}

output "service_account_email" {
  description = "Email of the Cloud Run service account"
  value       = google_service_account.cloud_run_sa.email
}

output "database_ip" {
  description = "Public IP address of the database"
  value       = google_sql_database_instance.peopleperson_db.public_ip_address
}