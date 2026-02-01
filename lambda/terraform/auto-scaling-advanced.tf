# =============================================================================
# ADVANCED AUTO-SCALING FOR 100,000+ RPS
# =============================================================================

# Application Auto Scaling for Lambda Provisioned Concurrency
resource "aws_appautoscaling_target" "lambda_auth_login" {
  max_capacity       = 1000  # Maximum concurrent executions
  min_capacity       = 50    # Minimum warm instances
  resource_id        = "function:${aws_lambda_function.auth_login_enterprise.function_name}:provisioned"
  scalable_dimension = "lambda:provisioned-concurrency:utilization"
  service_namespace  = "lambda"
}

resource "aws_appautoscaling_policy" "lambda_auth_login_scale_up" {
  name               = "${local.name_prefix}-lambda-auth-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.lambda_auth_login.resource_id
  scalable_dimension = aws_appautoscaling_target.lambda_auth_login.scalable_dimension
  service_namespace  = aws_appautoscaling_target.lambda_auth_login.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "LambdaProvisionedConcurrencyUtilization"
    }
    target_value       = 70.0  # Scale when 70% utilized
    scale_out_cooldown = 60    # 1 minute cooldown for scale out
    scale_in_cooldown  = 300   # 5 minutes cooldown for scale in
  }
}

# Auto Scaling for ElastiCache
resource "aws_appautoscaling_target" "elasticache_redis" {
  count              = var.enable_redis ? 1 : 0
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "replication-group/${aws_elasticache_replication_group.redis_primary.replication_group_id}"
  scalable_dimension = "elasticache:replication-group:NodeGroups"
  service_namespace  = "elasticache"
}

resource "aws_appautoscaling_policy" "elasticache_scale_up" {
  count              = var.enable_redis ? 1 : 0
  name               = "${local.name_prefix}-elasticache-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.elasticache_redis[0].resource_id
  scalable_dimension = aws_appautoscaling_target.elasticache_redis[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.elasticache_redis[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ElastiCachePrimaryEngineCPUUtilization"
    }
    target_value = 70.0
  }
}

# =============================================================================
# PREDICTIVE SCALING BASED ON PATTERNS
# =============================================================================

# Lambda function for predictive scaling
resource "aws_lambda_function" "predictive_scaling" {
  filename         = "${path.module}/../dist/predictive-scaling.zip"
  function_name    = "${local.name_prefix}-predictive-scaling"
  role            = aws_iam_role.predictive_scaling_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/predictive-scaling.zip")
  runtime         = "nodejs20.x"
  timeout         = 300
  memory_size     = 512

  environment {
    variables = {
      LAMBDA_FUNCTION_NAME = aws_lambda_function.auth_login_enterprise.function_name
      REDIS_CLUSTER_ID     = var.enable_redis ? aws_elasticache_replication_group.redis_primary.replication_group_id : ""
      SCALING_THRESHOLD    = "80"
      PREDICTION_WINDOW    = "3600"  # 1 hour prediction window
      ENABLE_PREDICTIONS   = "true"
    }
  }

  tags = local.common_tags
}

# EventBridge rule for predictive scaling (runs every 15 minutes)
resource "aws_cloudwatch_event_rule" "predictive_scaling" {
  name                = "${local.name_prefix}-predictive-scaling"
  description         = "Trigger predictive scaling analysis"
  schedule_expression = "rate(15 minutes)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "predictive_scaling" {
  rule      = aws_cloudwatch_event_rule.predictive_scaling.name
  target_id = "PredictiveScalingTarget"
  arn       = aws_lambda_function.predictive_scaling.arn
}

resource "aws_lambda_permission" "allow_eventbridge_predictive" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.predictive_scaling.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.predictive_scaling.arn
}

# IAM role for predictive scaling
resource "aws_iam_role" "predictive_scaling_role" {
  name = "${local.name_prefix}-predictive-scaling-role"

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

resource "aws_iam_role_policy" "predictive_scaling_policy" {
  name = "${local.name_prefix}-predictive-scaling-policy"
  role = aws_iam_role.predictive_scaling_role.id

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
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "application-autoscaling:RegisterScalableTarget",
          "application-autoscaling:DeregisterScalableTarget",
          "application-autoscaling:DescribeScalableTargets",
          "application-autoscaling:PutScalingPolicy",
          "application-autoscaling:DescribeScalingPolicies"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:PutProvisionedConcurrencyConfig",
          "lambda:GetProvisionedConcurrencyConfig",
          "lambda:DeleteProvisionedConcurrencyConfig"
        ]
        Resource = aws_lambda_function.auth_login_enterprise.arn
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:ModifyReplicationGroup",
          "elasticache:DescribeReplicationGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# =============================================================================
# CIRCUIT BREAKER PATTERN
# =============================================================================

# Lambda function for circuit breaker
resource "aws_lambda_function" "circuit_breaker" {
  filename         = "${path.module}/../dist/circuit-breaker.zip"
  function_name    = "${local.name_prefix}-circuit-breaker"
  role            = aws_iam_role.circuit_breaker_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/circuit-breaker.zip")
  runtime         = "nodejs20.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      FAILURE_THRESHOLD     = "5"     # Open circuit after 5 failures
      SUCCESS_THRESHOLD     = "3"     # Close circuit after 3 successes
      TIMEOUT_DURATION      = "60000" # 1 minute timeout
      REDIS_ENDPOINT        = var.enable_redis ? aws_elasticache_replication_group.redis_primary.primary_endpoint : ""
      FALLBACK_ENABLED      = "true"
      MONITORING_ENABLED    = "true"
    }
  }

  tags = local.common_tags
}

# IAM role for circuit breaker
resource "aws_iam_role" "circuit_breaker_role" {
  name = "${local.name_prefix}-circuit-breaker-role"

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

resource "aws_iam_role_policy_attachment" "circuit_breaker_basic" {
  role       = aws_iam_role.circuit_breaker_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

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
  count             = var.enable_vpc ? 1 : 0
  load_balancer_arn = aws_lb.lambda_alb[0].arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.lambda_tg[0].arn
  }
}

# Lambda permission for ALB
resource "aws_lambda_permission" "allow_alb" {
  count         = var.enable_vpc ? 1 : 0
  statement_id  = "AllowExecutionFromALB"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_login_enterprise.function_name
  principal     = "elasticloadbalancing.amazonaws.com"
  source_arn    = aws_lb_target_group.lambda_tg[0].arn
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

# Composite alarms for intelligent scaling
resource "aws_cloudwatch_composite_alarm" "high_load_condition" {
  alarm_name        = "${local.name_prefix}-high-load-condition"
  alarm_description = "Composite alarm for high load conditions"

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.lambda_duration.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.lambda_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.dynamodb_throttles.alarm_name})"
  ])

  actions_enabled = true
  alarm_actions = [
    aws_sns_topic.scaling_notifications.arn,
    aws_lambda_function.emergency_scaling.arn
  ]

  tags = local.common_tags
}

# SNS topic for scaling notifications
resource "aws_sns_topic" "scaling_notifications" {
  name = "${local.name_prefix}-scaling-notifications"
  
  tags = local.common_tags
}

# Lambda function for emergency scaling
resource "aws_lambda_function" "emergency_scaling" {
  filename         = "${path.module}/../dist/emergency-scaling.zip"
  function_name    = "${local.name_prefix}-emergency-scaling"
  role            = aws_iam_role.emergency_scaling_role.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/emergency-scaling.zip")
  runtime         = "nodejs20.x"
  timeout         = 60
  memory_size     = 256

  environment {
    variables = {
      EMERGENCY_CONCURRENCY = "2000"  # Emergency concurrency limit
      SCALE_UP_FACTOR      = "2"      # Scale up by 2x
      NOTIFICATION_TOPIC   = aws_sns_topic.scaling_notifications.arn
    }
  }

  tags = local.common_tags
}

# IAM role for emergency scaling
resource "aws_iam_role" "emergency_scaling_role" {
  name = "${local.name_prefix}-emergency-scaling-role"

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

resource "aws_iam_role_policy" "emergency_scaling_policy" {
  name = "${local.name_prefix}-emergency-scaling-policy"
  role = aws_iam_role.emergency_scaling_role.id

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
          "lambda:PutConcurrency",
          "lambda:DeleteConcurrency",
          "lambda:GetFunction",
          "lambda:PutProvisionedConcurrencyConfig"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "application-autoscaling:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.scaling_notifications.arn
      }
    ]
  })
}