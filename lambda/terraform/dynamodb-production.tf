# Production DynamoDB Configuration for HandShakeMe
# Optimized for high availability, performance, and cost efficiency

# Main DynamoDB Table
resource "aws_dynamodb_table" "main" {
  name           = var.dynamodb_table_name
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "PK"
  range_key      = "SK"
  
  # Enable deletion protection in production
  deletion_protection_enabled = var.dynamodb_deletion_protection
  
  # Table class for cost optimization
  table_class = "STANDARD"
  
  attribute {
    name = "PK"
    type = "S"
  }
  
  attribute {
    name = "SK" 
    type = "S"
  }
  
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  
  attribute {
    name = "GSI1SK"
    type = "S"
  }
  
  attribute {
    name = "GSI2PK"
    type = "S"
  }
  
  attribute {
    name = "GSI2SK"
    type = "S"
  }
  
  attribute {
    name = "GSI3PK"
    type = "S"
  }
  
  attribute {
    name = "GSI3SK"
    type = "S"
  }

  # Global Secondary Index 1 - User-based queries
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # Global Secondary Index 2 - Category/Location-based queries
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }
  
  # Global Secondary Index 3 - Time-based queries
  global_secondary_index {
    name            = "GSI3"
    hash_key        = "GSI3PK"
    range_key       = "GSI3SK"
    projection_type = "ALL"
  }

  # Enable Point-in-Time Recovery
  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_id  = aws_kms_key.dynamodb.arn
  }

  # Stream configuration for real-time processing
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = merge(var.tags, {
    Name        = "${var.project_name}-main-table-${var.environment}"
    Purpose     = "Main application data"
    BackupLevel = "Critical"
  })
}

# KMS Key for DynamoDB encryption
resource "aws_kms_key" "dynamodb" {
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name    = "${var.project_name}-dynamodb-key-${var.environment}"
    Purpose = "DynamoDB Encryption"
  })
}

resource "aws_kms_alias" "dynamodb" {
  name          = "alias/${var.project_name}-dynamodb-${var.environment}"
  target_key_id = aws_kms_key.dynamodb.key_id
}

# Auto Scaling for DynamoDB (if using provisioned billing)
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  count              = var.dynamodb_billing_mode == "PROVISIONED" && var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  count              = var.dynamodb_billing_mode == "PROVISIONED" && var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  count              = var.dynamodb_billing_mode == "PROVISIONED" && var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-dynamodb-read-scaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.target_utilization
  }
}

resource "aws_appautoscaling_policy" "dynamodb_table_write_policy" {
  count              = var.dynamodb_billing_mode == "PROVISIONED" && var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-dynamodb-write-scaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_write_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_write_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_write_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.target_utilization
  }
}

# DynamoDB Backup Vault
resource "aws_backup_vault" "dynamodb" {
  name        = "${var.project_name}-dynamodb-backup-${var.environment}"
  kms_key_arn = aws_kms_key.backup.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-backup-vault-${var.environment}"
    Purpose = "DynamoDB Backups"
  })
}

# KMS Key for Backup encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for backup encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name    = "${var.project_name}-backup-key-${var.environment}"
    Purpose = "Backup Encryption"
  })
}

resource "aws_kms_alias" "backup" {
  name          = "alias/${var.project_name}-backup-${var.environment}"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup Plan
resource "aws_backup_plan" "dynamodb" {
  name = "${var.project_name}-dynamodb-backup-${var.environment}"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.dynamodb.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM UTC

    lifecycle {
      cold_storage_after = 30
      delete_after       = var.backup_retention_days
    }

    recovery_point_tags = merge(var.tags, {
      BackupType = "Automated"
    })
  }

  # Weekly backup with longer retention
  rule {
    rule_name         = "weekly_backup"
    target_vault_name = aws_backup_vault.dynamodb.name
    schedule          = "cron(0 5 ? * SUN *)" # Weekly on Sunday at 5 AM UTC

    lifecycle {
      cold_storage_after = 30
      delete_after       = var.backup_retention_days * 4 # Keep weekly backups 4x longer
    }

    recovery_point_tags = merge(var.tags, {
      BackupType = "Weekly"
    })
  }

  tags = var.tags
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "${var.project_name}-backup-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# Backup Selection
resource "aws_backup_selection" "dynamodb" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "${var.project_name}-dynamodb-selection-${var.environment}"
  plan_id      = aws_backup_plan.dynamodb.id

  resources = [
    aws_dynamodb_table.main.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/BackupLevel"
      value = "Critical"
    }
  }
}

# Cross-region backup (optional)
resource "aws_backup_region_settings" "cross_region" {
  count = var.enable_cross_region_backup ? 1 : 0
  
  resource_type_opt_in_preference = {
    "DynamoDB" = true
  }
}

# DynamoDB Contributor Insights (for performance optimization)
resource "aws_dynamodb_contributor_insights" "main" {
  table_name = aws_dynamodb_table.main.name
}

# Outputs
output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main.arn
}

output "dynamodb_stream_arn" {
  description = "ARN of the DynamoDB stream"
  value       = aws_dynamodb_table.main.stream_arn
}

output "backup_vault_name" {
  description = "Name of the backup vault"
  value       = aws_backup_vault.dynamodb.name
}