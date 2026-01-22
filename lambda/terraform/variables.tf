variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "handshake"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "admin_user_ids" {
  description = "Comma-separated list of admin user IDs (Cognito sub)"
  type        = string
  default     = ""
}
