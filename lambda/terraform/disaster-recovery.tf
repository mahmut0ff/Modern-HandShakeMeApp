# =============================================================================
# DISASTER RECOVERY AND BUSINESS CONTINUITY
# =============================================================================

# Cross-Region Backup for DynamoDB
resource "aws_dynamodb_table" "backup_us_west_2" {
  provider = aws.us_west_2
  
  name         = "${local.name_prefix}-backup-us-west-2"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Purpose = "DisasterRecovery"
  })
}

# Automated DynamoDB Backup
resource "aws_dynamodb_backup" "main_backup" {
  table_name = aws_dynamodb_table.main.name
  name       = "${local.name_prefix}-automated-backup-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  lifecycle {
    ignore_changes = [name]
  }
}

# Lambda function for cross-region data replication
resource "aws_lambda_function" "data_replication" {
  filename         = "${path.module}/../dist/data-replication.zip"
  function_name    = "${local.name_prefix}-data-replication"
  role            = aws_iam_role.replication_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/data-replication.zip")
  runtime         = "nodejs20.x"
  timeout         = 300  # 5 minutes
  memory_size     = 1024

  environment {
    variables = {
      SOURCE_TABLE      = aws_dynamodb_table.main.name
      BACKUP_TABLE      = aws_dynamodb_table.backup_us_west_2.name
      BACKUP_REGION     = "us-west-2"
      REPLICATION_MODE  = "INCREMENTAL"
    }
  }

  tags = local.common_tags
}

# EventBridge rule for scheduled backups
resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name                = "${local.name_prefix}-backup-schedule"
  description         = "Trigger backup every 6 hours"
  schedule_expression = "rate(6 hours)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "backup_target" {
  rule      = aws_cloudwatch_event_rule.backup_schedule.name
  target_id = "BackupTarget"
  arn       = aws_lambda_function.data_replication.arn
}

resource "aws_lambda_permission" "allow_eventbridge_backup" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_replication.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.backup_schedule.arn
}

# IAM role for replication Lambda
resource "aws_iam_role" "replication_role" {
  name = "${local.name_prefix}-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "replication_policy" {
  name = "${local.name_prefix}-replication-policy"
  role = aws_iam_role.replication_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.main.arn,
          "${aws_dynamodb_table.main.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:us-west-2:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-backup-us-west-2",
          "arn:aws:dynamodb:us-west-2:${data.aws_caller_identity.current.account_id}:table/${local.name_prefix}-backup-us-west-2/*"
        ]
      }
    ]
  })
}

# =============================================================================
# S3 CROSS-REGION REPLICATION
# =============================================================================

# S3 bucket for backup in different region
resource "aws_s3_bucket" "uploads_backup" {
  provider = aws.us_west_2
  bucket   = "${local.name_prefix}-uploads-backup"

  tags = merge(local.common_tags, {
    Purpose = "DisasterRecovery"
  })
}

resource "aws_s3_bucket_versioning" "uploads_backup" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.uploads_backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads_backup" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.uploads_backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Cross-region replication configuration
resource "aws_s3_bucket_replication_configuration" "uploads_replication" {
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "ReplicateToBackup"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.uploads_backup.arn
      storage_class = "STANDARD_IA"  # Cost optimization
      
      # Encryption in destination
      encryption_configuration {
        replica_kms_key_id = aws_kms_key.s3_backup.arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.uploads]
}

# KMS key for S3 backup encryption
resource "aws_kms_key" "s3_backup" {
  provider                = aws.us_west_2
  description             = "KMS key for S3 backup encryption"
  deletion_window_in_days = 7

  tags = local.common_tags
}

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication" {
  name = "${local.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "s3_replication_policy" {
  name = "${local.name_prefix}-s3-replication-policy"
  role = aws_iam_role.s3_replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.uploads.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.uploads_backup.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.s3_backup.arn
        ]
      }
    ]
  })
}

# =============================================================================
# HEALTH CHECKS AND FAILOVER
# =============================================================================

# Route 53 health check for primary region
resource "aws_route53_health_check" "primary_region" {
  fqdn                            = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
  port                            = 443
  type                            = "HTTPS"
  resource_path                   = "/health"
  failure_threshold               = "3"
  request_interval                = "30"
  cloudwatch_alarm_region         = var.aws_region
  cloudwatch_alarm_name           = "${local.name_prefix}-primary-health"
  insufficient_data_health_status = "Failure"

  tags = local.common_tags
}

# Route 53 health check for secondary region
resource "aws_route53_health_check" "secondary_region" {
  fqdn                            = "api-backup.${var.domain_name}"
  port                            = 443
  type                            = "HTTPS"
  resource_path                   = "/health"
  failure_threshold               = "3"
  request_interval                = "30"
  cloudwatch_alarm_region         = "us-west-2"
  cloudwatch_alarm_name           = "${local.name_prefix}-secondary-health"
  insufficient_data_health_status = "Failure"

  tags = local.common_tags
}

# Route 53 failover records
resource "aws_route53_record" "api_primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "primary"
  
  failover_routing_policy {
    type = "PRIMARY"
  }

  health_check_id = aws_route53_health_check.primary_region.id

  alias {
    name                   = aws_cloudfront_distribution.api_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.api_distribution.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  set_identifier = "secondary"
  
  failover_routing_policy {
    type = "SECONDARY"
  }

  health_check_id = aws_route53_health_check.secondary_region.id

  alias {
    name                   = "api-backup.${var.domain_name}"
    zone_id                = aws_route53_zone.main.zone_id
    evaluate_target_health = true
  }
}

# =============================================================================
# AUTOMATED RECOVERY PROCEDURES
# =============================================================================

# Lambda function for automated recovery
resource "aws_lambda_function" "disaster_recovery" {
  filename         = "${path.module}/../dist/disaster-recovery.zip"
  function_name    = "${local.name_prefix}-disaster-recovery"
  role            = aws_iam_role.disaster_recovery_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disaster-recovery.zip")
  runtime         = "nodejs20.x"
  timeout         = 900  # 15 minutes
  memory_size     = 1024

  environment {
    variables = {
      PRIMARY_REGION        = var.aws_region
      SECONDARY_REGION      = "us-west-2"
      BACKUP_TABLE         = aws_dynamodb_table.backup_us_west_2.name
      BACKUP_BUCKET        = aws_s3_bucket.uploads_backup.id
      NOTIFICATION_TOPIC   = aws_sns_topic.disaster_recovery.arn
      RECOVERY_MODE        = "AUTOMATED"
    }
  }

  tags = local.common_tags
}

# SNS topic for disaster recovery notifications
resource "aws_sns_topic" "disaster_recovery" {
  name = "${local.name_prefix}-disaster-recovery"
  
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "disaster_recovery_email" {
  count     = var.disaster_recovery_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.disaster_recovery.arn
  protocol  = "email"
  endpoint  = var.disaster_recovery_email
}

# CloudWatch alarm for triggering disaster recovery
resource "aws_cloudwatch_metric_alarm" "primary_region_failure" {
  alarm_name          = "${local.name_prefix}-primary-region-failure"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Primary region health check failure"
  alarm_actions       = [
    aws_sns_topic.disaster_recovery.arn,
    aws_lambda_function.disaster_recovery.arn
  ]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_region.id
  }

  tags = local.common_tags
}

# IAM role for disaster recovery Lambda
resource "aws_iam_role" "disaster_recovery_role" {
  name = "${local.name_prefix}-disaster-recovery-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "disaster_recovery_policy" {
  name = "${local.name_prefix}-disaster-recovery-policy"
  role = aws_iam_role.disaster_recovery_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetHealthCheck",
          "route53:ListResourceRecordSets"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.disaster_recovery.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda permission for CloudWatch alarm
resource "aws_lambda_permission" "allow_cloudwatch_disaster_recovery" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.disaster_recovery.function_name
  principal     = "cloudwatch.amazonaws.com"
  source_arn    = aws_cloudwatch_metric_alarm.primary_region_failure.arn
}