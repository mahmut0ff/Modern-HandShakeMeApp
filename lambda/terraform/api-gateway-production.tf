# Production API Gateway Configuration for HandShakeMe
# Optimized for performance, security, and monitoring

# API Gateway HTTP API (v2) - more cost-effective than REST API
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"
  description   = "HandShakeMe API Gateway for ${var.environment}"
  version       = var.app_version

  # CORS configuration
  cors_configuration {
    allow_credentials = true
    allow_headers = [
      "authorization",
      "content-type",
      "x-amz-date",
      "x-amz-security-token",
      "x-amz-user-agent",
      "x-api-key"
    ]
    allow_methods = [
      "GET",
      "POST",
      "PUT",
      "PATCH", 
      "DELETE",
      "OPTIONS"
    ]
    allow_origins = [
      "https://${var.domain_name}",
      "https://app.${var.domain_name}",
      "https://admin.${var.domain_name}"
    ]
    expose_headers = ["x-request-id"]
    max_age        = 86400
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-api-${var.environment}"
  })
}

# Custom Domain for API Gateway
resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = var.api_domain

  domain_name_configuration {
    certificate_arn = var.ssl_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = var.tags
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true
  description = "Main stage for ${var.environment}"

  # Access logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      responseTime   = "$context.responseTime"
      error          = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
      userAgent      = "$context.identity.userAgent"
    })
  }

  # Default route settings
  default_route_settings {
    detailed_metrics_enabled = var.enable_detailed_monitoring
    logging_level           = var.environment == "production" ? "INFO" : "ERROR"
    data_trace_enabled      = var.environment != "production"
    throttling_burst_limit  = var.api_throttle_burst_limit
    throttling_rate_limit   = var.api_throttle_rate_limit
  }

  tags = var.tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.lambda.arn

  tags = merge(var.tags, {
    Name    = "${var.project_name}-api-logs-${var.environment}"
    Purpose = "API Gateway Logs"
  })
}

# JWT Authorizer for protected routes
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-jwt-authorizer-${var.environment}"

  jwt_configuration {
    audience = ["handshakeme-api"]
    issuer   = "https://${var.api_domain}"
  }
}

# Lambda integrations
resource "aws_apigatewayv2_integration" "lambda_integrations" {
  for_each = local.lambda_functions

  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.functions[each.key].invoke_arn
  
  # Timeout configuration
  timeout_milliseconds = each.value.timeout * 1000
  
  # Payload format version for better performance
  payload_format_version = "2.0"
  
  description = "Integration for ${each.key} Lambda function"
}

# API Routes
locals {
  api_routes = {
    # Health Check (public)
    "GET /health" = {
      function_key = "health-check"
      auth_required = false
    }
    "GET /health/simple" = {
      function_key = "health-check"
      auth_required = false
    }
    
    # Authentication (public)
    "POST /auth/telegram/login" = {
      function_key = "telegram-login"
      auth_required = false
    }
    
    # Instant Booking (protected)
    "POST /bookings/instant" = {
      function_key = "instant-booking-kg"
      auth_required = true
    }
    "GET /masters/{masterId}/slots" = {
      function_key = "instant-booking-kg"
      auth_required = true
    }
    
    # Orders (protected)
    "POST /orders" = {
      function_key = "create-order"
      auth_required = true
    }
    "GET /orders" = {
      function_key = "get-orders"
      auth_required = true
    }
    "GET /orders/{orderId}" = {
      function_key = "get-orders"
      auth_required = true
    }
    
    # User Profile (protected)
    "GET /users/me" = {
      function_key = "get-user-profile"
      auth_required = true
    }
    "PATCH /users/me" = {
      function_key = "update-user-profile"
      auth_required = true
    }
    
    # SMS Notifications (internal)
    "POST /internal/sms/send" = {
      function_key = "sms-notifications-kg"
      auth_required = true
    }
  }
}

# Create API Routes
resource "aws_apigatewayv2_route" "routes" {
  for_each = local.api_routes

  api_id    = aws_apigatewayv2_api.main.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integrations[each.value.function_key].id}"
  
  # Add authorization if required
  authorization_type = each.value.auth_required ? "JWT" : "NONE"
  authorizer_id     = each.value.auth_required ? aws_apigatewayv2_authorizer.jwt.id : null
  
  # Route-specific throttling for critical endpoints
  route_response_selection_expression = "$default"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambda_functions

  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# API Gateway Domain Mapping
resource "aws_apigatewayv2_api_mapping" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.api.id
  stage       = aws_apigatewayv2_stage.main.id
}

# Route 53 Record for API Domain
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.api_domain
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Data source for Route 53 zone
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# WAF Web ACL for API Gateway (if enabled)
resource "aws_wafv2_web_acl" "api_gateway" {
  count = var.enable_waf ? 1 : 0
  
  name  = "${var.project_name}-api-waf-${var.environment}"
  scope = "REGIONAL"
  description = "WAF for HandShakeMe API Gateway"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }

    action {
      block {}
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  tags = var.tags

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}APIGatewayWAF"
    sampled_requests_enabled   = true
  }
}

# Associate WAF with API Gateway
resource "aws_wafv2_web_acl_association" "api_gateway" {
  count = var.enable_waf ? 1 : 0
  
  resource_arn = aws_apigatewayv2_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api_gateway[0].arn
}

# API Gateway Usage Plan for rate limiting
resource "aws_api_gateway_usage_plan" "main" {
  name         = "${var.project_name}-usage-plan-${var.environment}"
  description  = "Usage plan for HandShakeMe API"

  api_stages {
    api_id = aws_apigatewayv2_api.main.id
    stage  = aws_apigatewayv2_stage.main.name
  }

  quota_settings {
    limit  = 100000  # 100k requests per month
    period = "MONTH"
  }

  throttle_settings {
    rate_limit  = var.api_throttle_rate_limit
    burst_limit = var.api_throttle_burst_limit
  }

  tags = var.tags
}

# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${var.api_domain}"
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.execution_arn
}