# Auth & User API Routes

# POST /auth/login
resource "aws_apigatewayv2_integration" "auth_login" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_login.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.auth_login.id}"
}

resource "aws_lambda_permission" "auth_login" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_login.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /auth/register
resource "aws_apigatewayv2_integration" "auth_register" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.auth_register.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "auth_register" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/register"
  target    = "integrations/${aws_apigatewayv2_integration.auth_register.id}"
}

resource "aws_lambda_permission" "auth_register" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_register.function_name
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
