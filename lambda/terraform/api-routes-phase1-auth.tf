# Auth & User API Routes - TELEGRAM ONLY

# REMOVED: POST /auth/login (phone-based)
# REMOVED: POST /auth/register (phone-based)

# GET /auth/telegram/code - Generate Telegram auth code
resource "aws_apigatewayv2_integration" "auth_telegram_code" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_telegram_code.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_telegram_code" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /auth/telegram/code"
  target    = "integrations/${aws_apigatewayv2_integration.auth_telegram_code.id}"
}

resource "aws_lambda_permission" "auth_telegram_code" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_telegram_code.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /auth/telegram/check - Check Telegram auth status
resource "aws_apigatewayv2_integration" "auth_telegram_check" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_telegram_check.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_telegram_check" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /auth/telegram/check"
  target    = "integrations/${aws_apigatewayv2_integration.auth_telegram_check.id}"
}

resource "aws_lambda_permission" "auth_telegram_check" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_telegram_check.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /auth/telegram/complete - Complete Telegram registration
resource "aws_apigatewayv2_integration" "auth_telegram_complete" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_telegram_register.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_telegram_complete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/telegram/complete"
  target    = "integrations/${aws_apigatewayv2_integration.auth_telegram_complete.id}"
}

resource "aws_lambda_permission" "auth_telegram_complete" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_telegram_register.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /auth/refresh
resource "aws_apigatewayv2_integration" "auth_refresh" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_refresh.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_refresh" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/refresh"
  target    = "integrations/${aws_apigatewayv2_integration.auth_refresh.id}"
}

resource "aws_lambda_permission" "auth_refresh" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_refresh.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /auth/logout
resource "aws_apigatewayv2_integration" "auth_logout" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_logout.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_logout" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/logout"
  target    = "integrations/${aws_apigatewayv2_integration.auth_logout.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "auth_logout" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_logout.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /users/me
resource "aws_apigatewayv2_integration" "users_me_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.users_me_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "users_me_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /users/me"
  target    = "integrations/${aws_apigatewayv2_integration.users_me_get.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "users_me_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users_me_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# PATCH /users/me
resource "aws_apigatewayv2_integration" "users_me_update" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.users_me_update.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "users_me_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /users/me"
  target    = "integrations/${aws_apigatewayv2_integration.users_me_update.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "users_me_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users_me_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
