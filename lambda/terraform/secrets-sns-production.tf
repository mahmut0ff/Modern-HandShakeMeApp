# Production Secrets and SNS Configuration for HandShakeMe
# Secure management of sensitive data and notifications

# AWS Secrets Manager for sensitive configuration
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project_name}-jwt-secret-${var.environment}"
  description             = "JWT secret for token signing"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.secrets.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-jwt-secret-${var.environment}"
    Purpose = "JWT Authentication"
  })
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    secret = "CHANGE_ME_IN_PRODUCTION_TO_STRONG_SECRET"
    algorithm = "HS256"
    expiration = "1h"
    refresh_expiration = "7d"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Telegram Bot Configuration
resource "aws_secretsmanager_secret" "telegram_bot" {
  name                    = "${var.project_name}-telegram-bot-${var.environment}"
  description             = "Telegram bot configuration"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.secrets.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-telegram-bot-${var.environment}"
    Purpose = "Telegram Integration"
  })
}

resource "aws_secretsmanager_secret_version" "telegram_bot" {
  secret_id = aws_secretsmanager_secret.telegram_bot.id
  secret_string = jsonencode({
    token = "CHANGE_ME_IN_PRODUCTION"
    username = "handshakeme_kg_bot"
    webhook_url = "https://${var.api_domain}/webhooks/telegram"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Database Configuration
resource "aws_secretsmanager_secret" "database" {
  name                    = "${var.project_name}-database-${var.environment}"
  description             = "Database connection configuration"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.secrets.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-database-${var.environment}"
    Purpose = "Database Connection"
  })
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    host = "CHANGE_ME_IN_PRODUCTION"
    port = 5432
    database = "handshakeme_prod"
    username = "handshakeme"
    password = "CHANGE_ME_IN_PRODUCTION"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Payment Gateway Secrets
resource "aws_secretsmanager_secret" "payment_gateway" {
  name                    = "${var.project_name}-payment-gateway-${var.environment}"
  description             = "Payment gateway configuration"
  recovery_window_in_days = 7
  kms_key_id             = aws_kms_key.secrets.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-payment-gateway-${var.environment}"
    Purpose = "Payment Processing"
  })
}

resource "aws_secretsmanager_secret_version" "payment_gateway" {
  secret_id = aws_secretsmanager_secret.payment_gateway.id
  secret_string = jsonencode({
    stripe = {
      secret_key = "CHANGE_ME_IN_PRODUCTION"
      webhook_secret = "CHANGE_ME_IN_PRODUCTION"
      publishable_key = "CHANGE_ME_IN_PRODUCTION"
    }
    kyrgyzstan = {
      optima_bank = {
        api_key = "CHANGE_ME_IN_PRODUCTION"
        merchant_id = "CHANGE_ME_IN_PRODUCTION"
      }
      demir_bank = {
        api_key = "CHANGE_ME_IN_PRODUCTION"
        merchant_id = "CHANGE_ME_IN_PRODUCTION"
      }
    }
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# KMS Key for Secrets Manager
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Functions"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_execution_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-secrets-key-${var.environment}"
    Purpose = "Secrets Encryption"
  })
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project_name}-secrets-${var.environment}"
  target_key_id = aws_kms_key.secrets.key_id
}

# SNS Topics for Notifications
resource "aws_sns_topic" "sms_notifications" {
  name         = "${var.project_name}-sms-notifications-${var.environment}"
  display_name = "HandShakeMe SMS Notifications"
  
  # Encryption
  kms_master_key_id = aws_kms_key.sns.arn
  
  # Delivery policy for retries
  delivery_policy = jsonencode({
    "http" = {
      "defaultHealthyRetryPolicy" = {
        "minDelayTarget"     = 20
        "maxDelayTarget"     = 20
        "numRetries"         = 3
        "numMaxDelayRetries" = 0
        "numMinDelayRetries" = 0
        "numNoDelayRetries"  = 0
        "backoffFunction"    = "linear"
      }
      "disableSubscriptionOverrides" = false
    }
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-sms-notifications-${var.environment}"
    Purpose = "SMS Notifications"
  })
}

resource "aws_sns_topic" "push_notifications" {
  name         = "${var.project_name}-push-notifications-${var.environment}"
  display_name = "HandShakeMe Push Notifications"
  
  kms_master_key_id = aws_kms_key.sns.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-push-notifications-${var.environment}"
    Purpose = "Push Notifications"
  })
}

resource "aws_sns_topic" "email_notifications" {
  name         = "${var.project_name}-email-notifications-${var.environment}"
  display_name = "HandShakeMe Email Notifications"
  
  kms_master_key_id = aws_kms_key.sns.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-email-notifications-${var.environment}"
    Purpose = "Email Notifications"
  })
}

# KMS Key for SNS
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow SNS Service"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda Functions"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_execution_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name    = "${var.project_name}-sns-key-${var.environment}"
    Purpose = "SNS Encryption"
  })
}

resource "aws_kms_alias" "sns" {
  name          = "alias/${var.project_name}-sns-${var.environment}"
  target_key_id = aws_kms_key.sns.key_id
}

# SNS Topic Subscriptions for Critical Alerts
resource "aws_sns_topic_subscription" "critical_alerts_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic Subscription for SMS (Kyrgyzstan operators)
resource "aws_sns_topic_subscription" "sms_lambda" {
  topic_arn = aws_sns_topic.sms_notifications.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.functions["sms-notifications-kg"].arn
}

# Lambda permission for SNS to invoke SMS function
resource "aws_lambda_permission" "sns_invoke_sms" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions["sms-notifications-kg"].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.sms_notifications.arn
}

# SQS Dead Letter Queue for failed SNS deliveries
resource "aws_sqs_queue" "sns_dlq" {
  name = "${var.project_name}-sns-dlq-${var.environment}"
  
  # Message retention
  message_retention_seconds = 1209600 # 14 days
  
  # Encryption
  kms_master_key_id = aws_kms_key.sns.arn
  
  tags = merge(var.tags, {
    Name    = "${var.project_name}-sns-dlq-${var.environment}"
    Purpose = "SNS Dead Letter Queue"
  })
}

# SNS Topic Policy for cross-service access
resource "aws_sns_topic_policy" "sms_notifications" {
  arn = aws_sns_topic.sms_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_execution_role.arn
        }
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.sms_notifications.arn
      },
      {
        Sid    = "AllowCloudWatchAlarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.sms_notifications.arn
      }
    ]
  })
}

# CloudWatch Log Groups for SNS
resource "aws_cloudwatch_log_group" "sns_logs" {
  name              = "/aws/sns/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.lambda.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-sns-logs-${var.environment}"
    Purpose = "SNS Logs"
  })
}

# Outputs
output "secrets_arns" {
  description = "ARNs of Secrets Manager secrets"
  value = {
    jwt_secret      = aws_secretsmanager_secret.jwt_secret.arn
    telegram_bot    = aws_secretsmanager_secret.telegram_bot.arn
    database        = aws_secretsmanager_secret.database.arn
    payment_gateway = aws_secretsmanager_secret.payment_gateway.arn
  }
  sensitive = true
}

output "sns_topic_arns" {
  description = "ARNs of SNS topics"
  value = {
    sms_notifications   = aws_sns_topic.sms_notifications.arn
    push_notifications  = aws_sns_topic.push_notifications.arn
    email_notifications = aws_sns_topic.email_notifications.arn
  }
}

output "kms_key_arns" {
  description = "ARNs of KMS keys"
  value = {
    secrets  = aws_kms_key.secrets.arn
    sns      = aws_kms_key.sns.arn
    lambda   = aws_kms_key.lambda.arn
    dynamodb = aws_kms_key.dynamodb.arn
    s3       = aws_kms_key.s3.arn
  }
}