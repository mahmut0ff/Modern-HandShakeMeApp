# Disputes Module API Routes
# Complete dispute management system with 11 endpoints

# ============================================
# DISPUTES CRUD (3 routes)
# ============================================

# POST /disputes
resource "aws_apigatewayv2_route" "create_dispute" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes"
  target    = "integrations/${aws_apigatewayv2_integration.create_dispute.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "create_dispute" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.create_dispute.invoke_arn
  payload_format_version = "2.0"
}

# GET /disputes
resource "aws_apigatewayv2_route" "get_disputes" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /disputes"
  target    = "integrations/${aws_apigatewayv2_integration.get_disputes.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "get_disputes" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_disputes.invoke_arn
  payload_format_version = "2.0"
}

# GET /disputes/{id}
resource "aws_apigatewayv2_route" "get_dispute" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /disputes/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.get_dispute.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "get_dispute" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_dispute.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# DISPUTE STATUS MANAGEMENT (4 routes)
# ============================================

# PATCH /disputes/{id}/status
resource "aws_apigatewayv2_route" "update_dispute_status" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /disputes/{id}/status"
  target    = "integrations/${aws_apigatewayv2_integration.update_dispute_status.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "update_dispute_status" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.update_dispute_status.invoke_arn
  payload_format_version = "2.0"
}

# POST /disputes/{id}/close
resource "aws_apigatewayv2_route" "close_dispute" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes/{id}/close"
  target    = "integrations/${aws_apigatewayv2_integration.close_dispute.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "close_dispute" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.close_dispute.invoke_arn
  payload_format_version = "2.0"
}

# POST /disputes/{id}/escalate
resource "aws_apigatewayv2_route" "escalate_dispute" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes/{id}/escalate"
  target    = "integrations/${aws_apigatewayv2_integration.escalate_dispute.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "escalate_dispute" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.escalate_dispute.invoke_arn
  payload_format_version = "2.0"
}

# POST /disputes/{id}/mediate
resource "aws_apigatewayv2_route" "request_mediation" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes/{id}/mediate"
  target    = "integrations/${aws_apigatewayv2_integration.request_mediation.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "request_mediation" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.request_mediation.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# DISPUTE MESSAGES (2 routes)
# ============================================

# GET /disputes/{id}/messages
resource "aws_apigatewayv2_route" "get_dispute_messages" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /disputes/{id}/messages"
  target    = "integrations/${aws_apigatewayv2_integration.get_dispute_messages.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "get_dispute_messages" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_dispute_messages.invoke_arn
  payload_format_version = "2.0"
}

# POST /disputes/{id}/messages
resource "aws_apigatewayv2_route" "send_dispute_message" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes/{id}/messages"
  target    = "integrations/${aws_apigatewayv2_integration.send_dispute_message.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "send_dispute_message" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.send_dispute_message.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# DISPUTE EVIDENCE (1 route)
# ============================================

# POST /disputes/{id}/evidence
resource "aws_apigatewayv2_route" "add_evidence" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes/{id}/evidence"
  target    = "integrations/${aws_apigatewayv2_integration.add_evidence.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "add_evidence" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.add_evidence.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# DISPUTE RESOLUTION (1 route)
# ============================================

# POST /disputes/{id}/accept
resource "aws_apigatewayv2_route" "accept_resolution" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /disputes/{id}/accept"
  target    = "integrations/${aws_apigatewayv2_integration.accept_resolution.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "accept_resolution" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.accept_resolution.invoke_arn
  payload_format_version = "2.0"
}
