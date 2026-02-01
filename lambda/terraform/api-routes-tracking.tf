# Location Tracking API Routes

# POST /tracking/real-time-location
resource "aws_apigatewayv2_integration" "real_time_location" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.real_time_location.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "real_time_location" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /tracking/real-time-location"
  target    = "integrations/${aws_apigatewayv2_integration.real_time_location.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /tracking/active-sessions
resource "aws_apigatewayv2_integration" "get_active_sessions" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_active_sessions.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_active_sessions" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /tracking/active-sessions"
  target    = "integrations/${aws_apigatewayv2_integration.get_active_sessions.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /tracking/events
resource "aws_apigatewayv2_integration" "get_tracking_events" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_tracking_events.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_tracking_events" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /tracking/events"
  target    = "integrations/${aws_apigatewayv2_integration.get_tracking_events.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /tracking/statistics
resource "aws_apigatewayv2_integration" "get_tracking_statistics" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_tracking_statistics.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_tracking_statistics" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /tracking/statistics"
  target    = "integrations/${aws_apigatewayv2_integration.get_tracking_statistics.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# POST /tracking/share-link
resource "aws_apigatewayv2_integration" "share_tracking_link" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.share_tracking_link.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "share_tracking_link" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /tracking/share-link"
  target    = "integrations/${aws_apigatewayv2_integration.share_tracking_link.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}

# GET /tracking/shared
resource "aws_apigatewayv2_integration" "get_shared_tracking" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_shared_tracking.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_shared_tracking" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /tracking/shared"
  target    = "integrations/${aws_apigatewayv2_integration.get_shared_tracking.id}"
  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.lambda_authorizer.id
}
