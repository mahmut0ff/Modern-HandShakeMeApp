# =============================================================================
# DISASTER RECOVERY AND BUSINESS CONTINUITY
# NOTE: IAM roles and some resources disabled - requires IAM permissions
# =============================================================================

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

# =============================================================================
# HEALTH CHECKS
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
  insufficient_data_health_status = "Unhealthy"

  tags = local.common_tags
}

# =============================================================================
# DISASTER RECOVERY NOTIFICATIONS
# =============================================================================

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
  alarm_actions       = [aws_sns_topic.disaster_recovery.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary_region.id
  }

  tags = local.common_tags
}

# =============================================================================
# DISABLED RESOURCES (requires IAM permissions)
# =============================================================================
# Uncomment when you have IAM:CreateRole permissions:
# - aws_dynamodb_table.backup_us_west_2
# - aws_backup_plan.main_backup
# - aws_backup_vault.main
# - aws_backup_selection.main
# - aws_iam_role.backup_role
# - aws_iam_role.replication_role
# - aws_iam_role.disaster_recovery_role
# - aws_kms_key.s3_backup
# - aws_route53_health_check.secondary_region
