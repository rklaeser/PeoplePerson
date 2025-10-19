# PeoplePerson Environment-Specific Terraform Variables

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "peopleperson-app"
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "image_tag" {
  description = "Docker image tag for deployments"
  type        = string
  default     = "latest"
}

# Domain Configuration
variable "domain" {
  description = "Domain name for PeoplePerson (without subdomains)"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for API service"
  type        = string
  default     = "api"
}
