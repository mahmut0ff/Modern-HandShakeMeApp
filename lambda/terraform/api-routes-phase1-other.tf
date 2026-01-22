# Other Module API Routes

# GET /orders/my
resource "aws_apigatewayv2_integration" "orders_my" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.orders_my.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "orders_my" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /orders/my"
  target    = "integrations/${aws_apigatewayv2_integration.orders_my.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "orders_my" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orders_my.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /chat/rooms
resource "aws_apigatewayv2_integration" "chat_rooms_list" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.chat_rooms_list.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "chat_rooms_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /chat/rooms"
  target    = "integrations/${aws_apigatewayv2_integration.chat_rooms_list.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "chat_rooms_list" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_rooms_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /chat/rooms/{id}
resource "aws_apigatewayv2_integration" "chat_room_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.chat_room_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "chat_room_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /chat/rooms/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.chat_room_get.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "chat_room_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat_room_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /notifications/unread-count
resource "aws_apigatewayv2_integration" "notifications_unread_count" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.notifications_unread_count.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "notifications_unread_count" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /notifications/unread-count"
  target    = "integrations/${aws_apigatewayv2_integration.notifications_unread_count.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "notifications_unread_count" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notifications_unread_count.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# PATCH /applications/{id}
resource "aws_apigatewayv2_integration" "applications_update" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.applications_update.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "applications_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /applications/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.applications_update.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "applications_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.applications_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# DELETE /applications/{id}
resource "aws_apigatewayv2_integration" "applications_delete" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.applications_delete.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "applications_delete" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /applications/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.applications_delete.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "applications_delete" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.applications_delete.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# POST /projects/{id}/cancel
resource "aws_apigatewayv2_integration" "projects_cancel" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.projects_cancel.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "projects_cancel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /projects/{id}/cancel"
  target    = "integrations/${aws_apigatewayv2_integration.projects_cancel.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "projects_cancel" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.projects_cancel.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /service-categories
resource "aws_apigatewayv2_integration" "service_categories_list" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.service_categories_list.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "service_categories_list" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /service-categories"
  target    = "integrations/${aws_apigatewayv2_integration.service_categories_list.id}"
}

resource "aws_lambda_permission" "service_categories_list" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.service_categories_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# PATCH /reviews/{id}
resource "aws_apigatewayv2_integration" "reviews_update" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.reviews_update.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "reviews_update" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /reviews/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.reviews_update.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "reviews_update" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reviews_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# GET /wallet/payment-methods
resource "aws_apigatewayv2_integration" "wallet_payment_methods_get" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.wallet_payment_methods_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "wallet_payment_methods_get" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /wallet/payment-methods"
  target    = "integrations/${aws_apigatewayv2_integration.wallet_payment_methods_get.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_lambda_permission" "wallet_payment_methods_get" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.wallet_payment_methods_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
