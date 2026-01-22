# Profile API Routes

# GET /masters/{id}
resource "aws_apigatewayv2_integration" "masters_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.masters_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "masters_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /masters/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.masters_get.id}"
}

resource "aws_lambda_permission" "masters_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.masters_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /masters/me
resource "aws_apigatewayv2_integration" "masters_me_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.masters_me_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "masters_me_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /masters/me"
  target    = "integrations/${aws_apigatewayv2_integration.masters_me_get.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "masters_me_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.masters_me_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# PATCH /masters/me
resource "aws_apigatewayv2_integration" "masters_me_update" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.masters_me_update.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "masters_me_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /masters/me"
  target    = "integrations/${aws_apigatewayv2_integration.masters_me_update.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "masters_me_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.masters_me_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /clients/me
resource "aws_apigatewayv2_integration" "clients_me_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.clients_me_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "clients_me_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /clients/me"
  target    = "integrations/${aws_apigatewayv2_integration.clients_me_get.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "clients_me_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.clients_me_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# PATCH /clients/me
resource "aws_apigatewayv2_integration" "clients_me_update" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.clients_me_update.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "clients_me_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /clients/me"
  target    = "integrations/${aws_apigatewayv2_integration.clients_me_update.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "clients_me_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.clients_me_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
