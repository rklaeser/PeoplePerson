# PeoplePerson Terraform Variables

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
  default     = "production"
  
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

# Database Variables
variable "db_user" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Domain Configuration
variable "domain" {
  description = "Domain name for PeoplePerson (without subdomains)"
  type        = string
  default     = "peopleperson.klazr.com"
}

variable "api_subdomain" {
  description = "Subdomain for API service"
  type        = string
  default     = "api"
}

# Twilio Variables
variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio Phone Number"
  type        = string
  sensitive   = true
}