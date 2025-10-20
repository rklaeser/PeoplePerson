# PeoplePerson Shared Infrastructure Variables

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

# AI/ML Variables
variable "gemini_api_key" {
  description = "Google Gemini API Key for AI features"
  type        = string
  sensitive   = true
}
