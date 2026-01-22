# Remaining Critical API Routes

# POST /orders
resource "aws_apigatewayv2_integration" "orders_create" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.orders_create.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "orders_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /orders"
  target    = "integrations/${aws_apigatewayv2_integration.orders_create.id}"
  authorization_type = "JWT"
}

resource "aws_lambda_permission" "orders_create" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orders_create.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /orders
resource "aws_apigatewayv2_integration" "orders_list" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.orders_list.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "orders_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /orders"
  target    = "integrations/${aws_apigatewayv2_integration.orders_list.id}"
}

resource "aws_lambda_permission" "orders_list" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orders_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /orders/{id}
resource "aws_apigatewayv2_integration" "orders_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.orders_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "orders_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /orders/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.orders_get.id}"
}

resource "aws_lambda_permission" "orders_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orders_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# PUT /orders/{id}
resource "aws_apigatewayv2_integration" "orders_update" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.orders_update.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "orders_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PUT /orders/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.orders_update.id}"
  authorization_type = "JWT"
}

resource "aws_lambda_permission" "orders_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orders_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /applications
resource "aws_apigatewayv2_integration" "applications_create" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.applications_create.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "applications_create" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /applications"
  target    = "integrations/${aws_apigatewayv2_integration.applications_create.id}"
  authorization_type = "JWT"
}

resource "aws_lambda_permission" "applications_create" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.applications_create.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /applications/my
resource "aws_apigatewayv2_integration" "applications_my" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.applications_my.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "applications_my" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /applications/my"
  target    = "integrations/${aws_apigatewayv2_integration.applications_my.id}"
  authorization_type = "JWT"
}

resource "aws_lambda_permission" "applications_my" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.applications_my.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /applications/{id}/respond
resource "aws_apigatewayv2_integration" "applications_respond" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.applications_respond.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "applications_respond" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /applications/{id}/respond"
  target    = "integrations/${aws_apigatewayv2_integration.applications_respond.id}"
  authorization_type = "JWT"
}

resource "aws_lambda_permission" "applications_respond" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.applications_respond.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
