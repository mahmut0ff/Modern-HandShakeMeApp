# =============================================================================
# ADVANCED LAMBDA CONFIGURATION FOR ENTERPRISE SCALE
# NOTE: IAM roles disabled - requires IAM permissions to create
# =============================================================================

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
# DEAD LETTER QUEUE AND ERROR HANDLING
# =============================================================================

resource "aws_sqs_queue" "dlq" {
  name                      = "${local.name_prefix}-dlq"
  message_retention_seconds = 1209600  # 14 days
  kms_master_key_id         = "alias/aws/sqs"
  tags                      = local.common_tags
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
  name              = "/aws/lambda/${local.name_prefix}-enterprise"
  retention_in_days = 30
  tags              = local.common_tags
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# =============================================================================
# IAM ROLES - DISABLED (requires IAM permissions)
# =============================================================================
# Uncomment when you have IAM:CreateRole permissions:
# - aws_iam_role.lambda_enterprise_role
# - aws_iam_role_policy.lambda_enterprise_policy
# - aws_iam_role_policy_attachment.lambda_enterprise_vpc
# - aws_iam_role_policy_attachment.lambda_insights
# - aws_kms_key.logs
# - aws_kms_alias.logs
