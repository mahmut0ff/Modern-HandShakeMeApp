# =============================================================================
# ADVANCED AUTO-SCALING FOR 100,000+ RPS
# NOTE: IAM roles disabled - requires IAM permissions to create
# =============================================================================

# =============================================================================
# LOAD BALANCING AND TRAFFIC DISTRIBUTION
# =============================================================================

# Application Load Balancer for Lambda functions (if using VPC)
resource "aws_lb" "lambda_alb" {
  count              = var.enable_vpc ? 1 : 0
  name               = "${local.name_prefix}-lambda-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.lambda_public[*].id

  enable_deletion_protection = false

  tags = local.common_tags
}

resource "aws_security_group" "alb" {
  count       = var.enable_vpc ? 1 : 0
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = aws_vpc.lambda_vpc[0].id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

# Target group for Lambda functions
resource "aws_lb_target_group" "lambda_tg" {
  count       = var.enable_vpc ? 1 : 0
  name        = "${local.name_prefix}-lambda-tg"
  target_type = "lambda"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

# ALB listener
resource "aws_lb_listener" "lambda_listener" {
  count             = var.enable_vpc && var.ssl_certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.lambda_alb[0].arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.lambda_tg[0].arn
  }
}

# =============================================================================
# ADVANCED MONITORING FOR SCALING DECISIONS
# =============================================================================

# Custom CloudWatch metrics for scaling decisions
resource "aws_cloudwatch_log_metric_filter" "error_rate" {
  name           = "${local.name_prefix}-error-rate"
  log_group_name = aws_cloudwatch_log_group.lambda_enterprise_logs.name
  pattern        = "[timestamp, request_id, ERROR]"

  metric_transformation {
    name      = "ErrorRate"
    namespace = "HandShakeMe/Lambda"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "response_time" {
  name           = "${local.name_prefix}-response-time"
  log_group_name = aws_cloudwatch_log_group.lambda_enterprise_logs.name
  pattern        = "[timestamp, request_id, METRIC, response_time]"

  metric_transformation {
    name      = "ResponseTime"
    namespace = "HandShakeMe/Lambda"
    value     = "$response_time"
  }
}

# SNS topic for scaling notifications
resource "aws_sns_topic" "scaling_notifications" {
  name = "${local.name_prefix}-scaling-notifications"
  tags = local.common_tags
}

# =============================================================================
# IAM ROLES - DISABLED (requires IAM permissions)
# =============================================================================
# Uncomment when you have IAM:CreateRole permissions:
# - aws_iam_role.predictive_scaling_role
# - aws_iam_role.circuit_breaker_role
# - aws_iam_role.emergency_scaling_role
