# Production Lambda Configuration for HandShakeMe
# Optimized for performance, security, and cost efficiency

# Lambda Layer for shared dependencies
resource "aws_lambda_layer_version" "shared_dependencies" {
  filename         = "../dist/layers/shared-dependencies.zip"
  layer_name       = "${var.project_name}-shared-deps-${var.environment}"
  source_code_hash = filebase64sha256("../dist/layers/shared-dependencies.zip")
  
  compatible_runtimes = ["nodejs20.x"]
  description         = "Shared dependencies for HandShakeMe Lambda functions"
  
  lifecycle {
    create_before_destroy = true
  }
}

# Lambda Layer for Kyrgyzstan-specific utilities
resource "aws_lambda_layer_version" "kyrgyzstan_utils" {
  filename         = "../dist/layers/kyrgyzstan-utils.zip"
  layer_name       = "${var.project_name}-kg-utils-${var.environment}"
  source_code_hash = filebase64sha256("../dist/layers/kyrgyzstan-utils.zip")
  
  compatible_runtimes = ["nodejs20.x"]
  description         = "Kyrgyzstan-specific utilities and configurations"
  
  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

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

  tags = var.tags
}

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_execution_role.id

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
        Resource = "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.main.arn,
          "${aws_dynamodb_table.main.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${aws_s3_bucket.avatars.arn}/*",
          "${aws_s3_bucket.orders.arn}/*",
          "${aws_s3_bucket.chat.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.sms_notifications.arn,
          aws_sns_topic.push_notifications.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.telegram_bot.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.lambda.arn,
          aws_kms_key.dynamodb.arn
        ]
      }
    ]
  })
}

# Attach VPC execution role if needed
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  count      = var.enable_vpc ? 1 : 0
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# KMS Key for Lambda environment variables
resource "aws_kms_key" "lambda" {
  description             = "KMS key for Lambda environment variables encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name    = "${var.project_name}-lambda-key-${var.environment}"
    Purpose = "Lambda Encryption"
  })
}

resource "aws_kms_alias" "lambda" {
  name          = "alias/${var.project_name}-lambda-${var.environment}"
  target_key_id = aws_kms_key.lambda.key_id
}

# Critical Lambda Functions
locals {
  lambda_functions = {
    # Authentication
    "telegram-login" = {
      filename     = "../dist/telegram-login.zip"
      handler      = "telegram-login.handler"
      memory_size  = 256
      timeout      = 10
      reserved_concurrency = 50
    }
    
    # Instant Booking (Kyrgyzstan)
    "instant-booking-kg" = {
      filename     = "../dist/instant-booking-kg.zip"
      handler      = "instant-booking-kg.handler"
      memory_size  = 512
      timeout      = 30
      reserved_concurrency = 100
    }
    
    # SMS Notifications (Kyrgyzstan)
    "sms-notifications-kg" = {
      filename     = "../dist/sms-notifications-kg.zip"
      handler      = "sms-notifications-kg.handler"
      memory_size  = 256
      timeout      = 15
      reserved_concurrency = 200
    }
    
    # Health Check
    "health-check" = {
      filename     = "../dist/health-check.zip"
      handler      = "health-check.handler"
      memory_size  = 128
      timeout      = 5
      reserved_concurrency = 10
    }
    
    # Orders Management
    "create-order" = {
      filename     = "../dist/create-order.zip"
      handler      = "create-order.handler"
      memory_size  = 512
      timeout      = 30
      reserved_concurrency = 100
    }
    
    "get-orders" = {
      filename     = "../dist/get-orders.zip"
      handler      = "get-orders.handler"
      memory_size  = 256
      timeout      = 10
      reserved_concurrency = 200
    }
    
    # User Management
    "get-user-profile" = {
      filename     = "../dist/get-user-profile.zip"
      handler      = "get-user-profile.handler"
      memory_size  = 256
      timeout      = 10
      reserved_concurrency = 100
    }
    
    "update-user-profile" = {
      filename     = "../dist/update-user-profile.zip"
      handler      = "update-user-profile.handler"
      memory_size  = 256
      timeout      = 15
      reserved_concurrency = 50
    }
    
    # File Processing
    "process-uploaded-file" = {
      filename     = "../dist/process-uploaded-file.zip"
      handler      = "process-uploaded-file.handler"
      memory_size  = 512
      timeout      = 60
      reserved_concurrency = 20
    }
  }
}

# Lambda Functions
resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  filename         = each.value.filename
  function_name    = "${var.project_name}-${each.key}-${var.environment}"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = each.value.handler
  source_code_hash = filebase64sha256(each.value.filename)
  runtime         = "nodejs20.x"
  
  memory_size                    = each.value.memory_size
  timeout                       = each.value.timeout
  reserved_concurrent_executions = each.value.reserved_concurrency
  
  # Layers
  layers = [
    aws_lambda_layer_version.shared_dependencies.arn,
    aws_lambda_layer_version.kyrgyzstan_utils.arn
  ]
  
  # Environment variables
  environment {
    variables = merge(var.lambda_environment_variables, {
      ENVIRONMENT           = var.environment
      DYNAMODB_TABLE_NAME  = aws_dynamodb_table.main.name
      KMS_KEY_ID           = aws_kms_key.lambda.arn
      JWT_SECRET_ARN       = aws_secretsmanager_secret.jwt_secret.arn
      TELEGRAM_BOT_ARN     = aws_secretsmanager_secret.telegram_bot.arn
      SNS_SMS_TOPIC_ARN    = aws_sns_topic.sms_notifications.arn
      SNS_PUSH_TOPIC_ARN   = aws_sns_topic.push_notifications.arn
      S3_BUCKET_AVATARS    = aws_s3_bucket.avatars.bucket
      S3_BUCKET_ORDERS     = aws_s3_bucket.orders.bucket
      S3_BUCKET_CHAT       = aws_s3_bucket.chat.bucket
    })
  }
  
  # Encryption
  kms_key_arn = aws_kms_key.lambda.arn
  
  # Dead letter queue
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
  
  # Tracing
  tracing_config {
    mode = var.enable_detailed_monitoring ? "Active" : "PassThrough"
  }
  
  # VPC configuration (if needed)
  dynamic "vpc_config" {
    for_each = var.enable_vpc ? [1] : []
    content {
      subnet_ids         = var.lambda_subnet_ids
      security_group_ids = [aws_security_group.lambda[0].id]
    }
  }

  tags = merge(var.tags, {
    Name     = "${var.project_name}-${each.key}-${var.environment}"
    Function = each.key
  })
  
  depends_on = [
    aws_iam_role_policy.lambda_execution_policy,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

# Dead Letter Queue for failed Lambda invocations
resource "aws_sqs_queue" "lambda_dlq" {
  name = "${var.project_name}-lambda-dlq-${var.environment}"
  
  # Message retention
  message_retention_seconds = 1209600 # 14 days
  
  # Encryption
  kms_master_key_id = aws_kms_key.lambda.arn
  
  tags = merge(var.tags, {
    Name    = "${var.project_name}-lambda-dlq-${var.environment}"
    Purpose = "Lambda Dead Letter Queue"
  })
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${var.project_name}-${each.key}-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.lambda.arn

  tags = merge(var.tags, {
    Name     = "${var.project_name}-${each.key}-logs-${var.environment}"
    Function = each.key
  })
}

# Lambda Provisioned Concurrency for critical functions
resource "aws_lambda_provisioned_concurrency_config" "critical_functions" {
  for_each = var.environment == "production" ? toset([
    "instant-booking-kg",
    "telegram-login",
    "health-check"
  ]) : toset([])

  function_name                     = aws_lambda_function.functions[each.key].function_name
  provisioned_concurrent_executions = 5
  qualifier                        = aws_lambda_function.functions[each.key].version
}

# Lambda Aliases for blue-green deployments
resource "aws_lambda_alias" "functions" {
  for_each = local.lambda_functions

  name             = "live"
  description      = "Live alias for ${each.key}"
  function_name    = aws_lambda_function.functions[each.key].function_name
  function_version = aws_lambda_function.functions[each.key].version

  tags = var.tags
}

# Security Group for Lambda (if VPC is enabled)
resource "aws_security_group" "lambda" {
  count = var.enable_vpc ? 1 : 0
  
  name_prefix = "${var.project_name}-lambda-${var.environment}"
  vpc_id      = var.vpc_id
  description = "Security group for Lambda functions"

  # Outbound rules
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS outbound"
  }

  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP outbound"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-sg-${var.environment}"
  })
}

# Variables for VPC (optional)
variable "enable_vpc" {
  description = "Enable VPC for Lambda functions"
  type        = bool
  default     = false
}

variable "vpc_id" {
  description = "VPC ID for Lambda functions"
  type        = string
  default     = ""
}

variable "lambda_subnet_ids" {
  description = "Subnet IDs for Lambda functions"
  type        = list(string)
  default     = []
}

# Outputs
output "lambda_function_arns" {
  description = "ARNs of Lambda functions"
  value = {
    for k, v in aws_lambda_function.functions : k => v.arn
  }
}

output "lambda_function_names" {
  description = "Names of Lambda functions"
  value = {
    for k, v in aws_lambda_function.functions : k => v.function_name
  }
}

output "lambda_layer_arns" {
  description = "ARNs of Lambda layers"
  value = {
    shared_dependencies = aws_lambda_layer_version.shared_dependencies.arn
    kyrgyzstan_utils   = aws_lambda_layer_version.kyrgyzstan_utils.arn
  }
}