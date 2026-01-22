# =============================================================================
# API Gateway HTTP API
# =============================================================================

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }

  tags = local.common_tags
}

# =============================================================================
# API Gateway Stage
# =============================================================================

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

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
    })
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Log Group for API Gateway
# =============================================================================

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = 7
  tags              = local.common_tags
}

# =============================================================================
# JWT Authorizer - DISABLED (using Lambda authorizer instead)
# =============================================================================

# resource "aws_apigatewayv2_authorizer" "jwt" {
#   api_id           = aws_apigatewayv2_api.main.id
#   authorizer_type  = "JWT"
#   identity_sources = ["$request.header.Authorization"]
#   name             = "${local.name_prefix}-jwt-authorizer"
#
#   jwt_configuration {
#     audience = ["handshake-api"]
#     issuer   = "https://handshake.app"
#   }
# }

