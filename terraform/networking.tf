# PeoplePerson Networking and Domain Configuration

# Domain mapping for frontend
resource "google_cloud_run_domain_mapping" "frontend" {
  location = var.region
  name     = var.domain
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.peopleperson_frontend.name
  }

  depends_on = [google_cloud_run_v2_service.peopleperson_frontend]
}

# Domain mapping for API
resource "google_cloud_run_domain_mapping" "api" {
  location = var.region
  name     = "${var.api_subdomain}.${var.domain}"
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.peopleperson_api.name
  }

  depends_on = [google_cloud_run_v2_service.peopleperson_api]
}

# Output the required DNS records
output "dns_records_required" {
  description = "DNS records that need to be configured for domain mappings"
  value = {
    "${var.domain}" = {
      type  = "CNAME"
      value = "ghs.googlehosted.com"
      note  = "Google Cloud Run managed hosting service"
    }
    "${var.api_subdomain}.${var.domain}" = {
      type  = "CNAME"
      value = "ghs.googlehosted.com"
      note  = "Google Cloud Run managed hosting service"
    }
  }
}

# Output domain mapping status
output "domain_mapping_status" {
  description = "Status of domain mappings (check after applying)"
  value = {
    frontend_domain = google_cloud_run_domain_mapping.frontend.name
    api_domain     = google_cloud_run_domain_mapping.api.name
  }
}