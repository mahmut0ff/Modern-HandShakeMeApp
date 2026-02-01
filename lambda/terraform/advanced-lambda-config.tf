# =============================================================================
# ADVANCED LAMBDA CONFIGURATION FOR ENTERPRISE SCALE
# =============================================================================

# Lambda Layer with optimized dependencies
resource "aws_lambda_layer_version" "enterprise_layer" {
  filename         = "${path.module}/../dist/enterprise-layer.zip"
  layer_name       = "${local.name_prefix}-enterprise-layer"
  source_code_hash = filebase64sha256("${path.module}/../dist/enterprise-layer.zip")
  
  compatible_runtimes = ["nodejs20.x"]
  description         = "Enterprise layer with optimized dependencies"
}

# VPC Configuration for Lambda (if needed for ElastiCache access)
resource "aws_vpc" "lambda_vpc" {
  count = var.enable_vpc ? 1 : 0
  
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-vpc"
  })
}

resource "aws_subnet" "lambda_private" {
  count = var.enable_vpc ? 2 : 0
  
  vpc_id            = aws_vpc.lambda_vpc[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-private-${count.index + 1}"
  })
}

resource "aws_internet_gateway" "lambda_igw" {
  count = var.enable_vpc ? 1 : 0
  
  vpc_id = aws_vpc.lambda_vpc[0].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-igw"
  })
}

resource "aws_nat_gateway" "lambda_nat" {
  count = var.enable_vpc ? 2 : 0
  
  allocation_id = aws_eip.lambda_nat[count.index].id
  subnet_id     = aws_subnet.lambda_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.lambda_igw]
}

resource "aws_eip" "lambda_nat" {
  count = var.enable_vpc ? 2 : 0
  
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-nat-eip-${count.index + 1}"
  })
}

resource "aws_subnet" "lambda_public" {
  count = var.enable_vpc ? 2 : 0
  
  vpc_id                  = aws_vpc.lambda_vpc[0].id
  cidr_block              = "10.0.${count.index + 10}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-public-${count.index + 1}"
  })
}

# Security Group for Lambda functions
resource "aws_security_group" "lambda_sg" {
  count = var.enable_vpc ? 1 : 0
  
  name_prefix = "${local.name_prefix}-lambda-"
  vpc_id      = aws_vpc.lambda_vpc[0].id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.lambda_vpc[0].cidr_block]
  }

  tags = local.common_tags
}

# =============================================================================
# OPTIMIZED LAMBDA FUNCTIONS WITH ENTERPRISE FEATURES
# =============================================================================

# Critical Auth Function with Maximum Performance
resource "aws_lambda_function" "auth_login_enterprise" {
  filename         = "${path.module}/../dist/auth-login-enterprise.zip"
  function_name    = "${local.name_prefix}-auth-login-enterprise"
  role            = aws_iam_role.lambda_enterprise_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/auth-login-enterprise.zip")
  runtime         = "nodejs20.x"
  
  # Maximum performance settings
  timeout                        = 3
  memory_size                   = 3008  # Maximum memory
  reserved_concurrent_executions = 500   # High concurrency
  
  # VPC configuration for ElastiCache access
  dynamic "vpc_config" {
    for_each = var.enable_vpc ? [1] : []
    content {
      subnet_ids         = aws_subnet.lambda_private[*].id
      security_group_ids = [aws_security_group.lambda_sg[0].id]
    }
  }

  # Layers for optimized dependencies
  layers = [
    aws_lambda_layer_version.enterprise_layer.arn,
    "arn:aws:lambda:${var.aws_region}:580247275435:layer:LambdaInsightsExtension:38"  # CloudWatch Insights
  ]

  environment {
    variables = {
      NODE_ENV                = var.environment
      DYNAMODB_TABLE_NAME     = aws_dynamodb_table.main.name
      REDIS_PRIMARY_ENDPOINT  = aws_elasticache_replication_group.redis_primary.primary_endpoint
      REDIS_AUTH_TOKEN        = var.redis_auth_token
      ENABLE_CACHING          = "true"
      CACHE_TTL_SHORT         = "300"    # 5 minutes
      CACHE_TTL_MEDIUM        = "3600"   # 1 hour
      CACHE_TTL_LONG          = "86400"  # 1 day
      LOG_LEVEL               = "INFO"
      ENABLE_XRAY             = "true"
      ENABLE_METRICS          = "true"
    }
  }

  # X-Ray tracing
  tracing_config {
    mode = "Active"
  }

  # Dead letter queue
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.lambda_enterprise_vpc,
    aws_cloudwatch_log_group.lambda_enterprise_logs
  ]
}

# Provisioned Concurrency for critical functions
resource "aws_lambda_provisioned_concurrency_config" "auth_login" {
  function_name                     = aws_lambda_function.auth_login_enterprise.function_name
  provisioned_concurrent_executions = 100  # Always warm instances
  qualifier                        = "$LATEST"
}

# Lambda Alias for blue-green deployments
resource "aws_lambda_alias" "auth_login_live" {
  name             = "live"
  description      = "Live version of auth login function"
  function_name    = aws_lambda_function.auth_login_enterprise.function_name
  function_version = "$LATEST"

  routing_config {
    additional_version_weights = {
      "1" = 0.1  # 10% traffic to new version for canary deployment
    }
  }
}

# =============================================================================
# ENTERPRISE IAM ROLES AND POLICIES
# =============================================================================

resource "aws_iam_role" "lambda_enterprise_role" {
  name = "${local.name_prefix}-lambda-enterprise-role"

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

# Enhanced Lambda policy with all necessary permissions
resource "aws_iam_role_policy" "lambda_enterprise_policy" {
  name = "${local.name_prefix}-lambda-enterprise-policy"
  role = aws_iam_role.lambda_enterprise_role.id

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
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem",
          "dynamodb:DescribeTable",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.main.arn,
          "${aws_dynamodb_table.main.arn}/index/*",
          "${aws_dynamodb_table.main.arn}/stream/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:PutObjectAcl"
        ]
        Resource = "arn:aws:s3:::${local.name_prefix}-uploads/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:DescribeReplicationGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.dlq.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.dynamodb.arn
      }
    ]
  })
}

# VPC permissions for Lambda
resource "aws_iam_role_policy_attachment" "lambda_enterprise_vpc" {
  role       = aws_iam_role.lambda_enterprise_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# CloudWatch Insights permissions
resource "aws_iam_role_policy_attachment" "lambda_insights" {
  role       = aws_iam_role.lambda_enterprise_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
}

# =============================================================================
# DEAD LETTER QUEUE AND ERROR HANDLING
# =============================================================================

resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name_prefix}-dlq"
  message_retention_seconds = 1209600  # 14 days
  
  # Encryption
  kms_master_key_id = "alias/aws/sqs"
  
  tags = local.common_tags
}

resource "aws_sqs_queue" "dlq_redrive" {
  name = "${local.name_prefix}-dlq-redrive"
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = local.common_tags
}

# =============================================================================
# ENHANCED LOGGING
# =============================================================================

resource "aws_cloudwatch_log_group" "lambda_enterprise_logs" {
  name              = "/aws/lambda/${local.name_prefix}-auth-login-enterprise"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn
  
  tags = local.common_tags
}

resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${local.name_prefix}-logs"
  target_key_id = aws_kms_key.logs.key_id
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Provider for us-east-1 (required for Lambda@Edge)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}