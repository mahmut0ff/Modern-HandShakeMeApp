# Terraform Variables for HandShakeMe Production

# Basic Configuration
variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "handshakeme"
}

variable "app_version" {
  description = "Application version"
  type        = string
  default     = "1.0.0"
}

# Domain Configuration
variable "domain_name" {
  description = "Main domain name"
  type        = string
  default     = "handshakeme.com"
}

variable "api_domain" {
  description = "API subdomain"
  type        = string
  default     = "api.handshakeme.com"
}

variable "ws_domain" {
  description = "WebSocket subdomain"
  type        = string
  default     = "ws.handshakeme.com"
}

variable "cdn_domain" {
  description = "CDN subdomain"
  type        = string
  default     = "cdn.handshakeme.com"
}

variable "ssl_certificate_arn" {
  description = "SSL certificate ARN from ACM"
  type        = string
  default     = ""
}

# Database Configuration
variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
  
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "Billing mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "dynamodb_point_in_time_recovery" {
  description = "Enable DynamoDB point-in-time recovery"
  type        = bool
  default     = true
}

variable "dynamodb_deletion_protection" {
  description = "Enable DynamoDB deletion protection"
  type        = bool
  default     = true
}

# S3 Configuration
variable "s3_bucket_prefix" {
  description = "S3 bucket prefix"
  type        = string
}

variable "s3_enable_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "s3_enable_encryption" {
  description = "Enable S3 encryption"
  type        = bool
  default     = true
}

variable "s3_lifecycle_enabled" {
  description = "Enable S3 lifecycle policies"
  type        = bool
  default     = true
}

# Lambda Configuration
variable "lambda_memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 512
  
  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "Lambda memory size must be between 128 and 10240 MB."
  }
}

variable "lambda_timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
  
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds."
  }
}

variable "lambda_reserved_concurrency" {
  description = "Lambda reserved concurrency"
  type        = number
  default     = 100
}

variable "lambda_environment_variables" {
  description = "Lambda environment variables"
  type        = map(string)
  default     = {}
}

# API Gateway Configuration
variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 10000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_enable_caching" {
  description = "Enable API Gateway caching"
  type        = bool
  default     = true
}

variable "api_cache_ttl" {
  description = "API Gateway cache TTL in seconds"
  type        = number
  default     = 300
}

# Monitoring Configuration
variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
}

# Security Configuration
variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_shield" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for WAF"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 30
}

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup"
  type        = bool
  default     = false
}

# Auto Scaling Configuration
variable "enable_auto_scaling" {
  description = "Enable DynamoDB auto scaling"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Minimum capacity for auto scaling"
  type        = number
  default     = 5
}

variable "max_capacity" {
  description = "Maximum capacity for auto scaling"
  type        = number
  default     = 1000
}

variable "target_utilization" {
  description = "Target utilization percentage for auto scaling"
  type        = number
  default     = 70
  
  validation {
    condition     = var.target_utilization >= 20 && var.target_utilization <= 90
    error_message = "Target utilization must be between 20 and 90 percent."
  }
}

# Tags
variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Project     = "HandShakeMe"
  }
}


# Additional Variables for Lambda Functions

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
  default     = ""
}

variable "telegram_bot_token" {
  description = "Telegram bot token for authentication"
  type        = string
  sensitive   = true
  default     = ""
}

variable "frontend_url" {
  description = "Frontend application URL"
  type        = string
  default     = "https://app.handshakeme.com"
}

variable "enable_vpc" {
  description = "Enable VPC for Lambda functions"
  type        = bool
  default     = false
}

variable "enable_redis" {
  description = "Enable Redis/ElastiCache"
  type        = bool
  default     = false
}

variable "redis_host" {
  description = "Redis host address"
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Redis port"
  type        = string
  default     = "6379"
}

variable "replica_region" {
  description = "Replica region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "disaster_recovery_email" {
  description = "Email for disaster recovery notifications"
  type        = string
  default     = ""
}

variable "enable_global_tables" {
  description = "Enable DynamoDB global tables for multi-region replication"
  type        = bool
  default     = false
}

variable "redis_auth_token" {
  description = "Redis authentication token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}
