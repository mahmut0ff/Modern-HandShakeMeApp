# Time Tracking API Routes

# POST /time-tracking/manage-time-sessions
resource "aws_apigatewayv2_integration" "manage_time_sessions" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.manage_time_sessions.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "manage_time_sessions" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /time-tracking/manage-time-sessions"
  target    = "integrations/${aws_apigatewayv2_integration.manage_time_sessions.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /time-tracking/active-session
resource "aws_apigatewayv2_integration" "get_active_session" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_active_session.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_active_session" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /time-tracking/active-session"
  target    = "integrations/${aws_apigatewayv2_integration.get_active_session.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /time-tracking/sessions
resource "aws_apigatewayv2_integration" "get_sessions" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_sessions.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_sessions" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /time-tracking/sessions"
  target    = "integrations/${aws_apigatewayv2_integration.get_sessions.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /time-tracking/sessions/{sessionId}/entries
resource "aws_apigatewayv2_integration" "get_session_entries" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_session_entries.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_session_entries" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /time-tracking/sessions/{sessionId}/entries"
  target    = "integrations/${aws_apigatewayv2_integration.get_session_entries.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /time-tracking/statistics
resource "aws_apigatewayv2_integration" "get_time_tracking_statistics" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_time_tracking_statistics.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_time_tracking_statistics" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /time-tracking/statistics"
  target    = "integrations/${aws_apigatewayv2_integration.get_time_tracking_statistics.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# POST /time-tracking/export
resource "aws_apigatewayv2_integration" "export_time_tracking_data" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.export_time_tracking_data.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "export_time_tracking_data" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /time-tracking/export"
  target    = "integrations/${aws_apigatewayv2_integration.export_time_tracking_data.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /time-tracking/templates
resource "aws_apigatewayv2_integration" "get_time_tracking_templates" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.manage_time_tracking_templates.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_time_tracking_templates" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /time-tracking/templates"
  target    = "integrations/${aws_apigatewayv2_integration.get_time_tracking_templates.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# POST /time-tracking/templates
resource "aws_apigatewayv2_integration" "create_time_tracking_template" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.manage_time_tracking_templates.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_time_tracking_template" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /time-tracking/templates"
  target    = "integrations/${aws_apigatewayv2_integration.create_time_tracking_template.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# DELETE /time-tracking/templates/{templateId}
resource "aws_apigatewayv2_integration" "delete_time_tracking_template" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.manage_time_tracking_templates.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "delete_time_tracking_template" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /time-tracking/templates/{templateId}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_time_tracking_template.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}
