# PeoplePerson Environment-Specific Outputs

output "api_url" {
  description = "URL of the API service"
  value       = google_cloud_run_v2_service.peopleperson_api.uri
}

output "frontend_url" {
  description = "URL of the frontend service"
  value       = google_cloud_run_v2_service.peopleperson_frontend.uri
}