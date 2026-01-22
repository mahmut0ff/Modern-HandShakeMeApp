# Phase 2: Critical Features API Routes
# File uploads, Search, Statistics, Favorites, Payment Methods

# ============================================
# FILE UPLOADS (5 routes)
# ============================================

# POST /users/me/avatar
resource "aws_apigatewayv2_route" "upload_avatar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /users/me/avatar"
  target    = "integrations/${aws_apigatewayv2_integration.upload_avatar.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "upload_avatar" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.upload_avatar.invoke_arn
  payload_format_version = "2.0"
}

# DELETE /users/me/avatar
resource "aws_apigatewayv2_route" "delete_avatar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /users/me/avatar"
  target    = "integrations/${aws_apigatewayv2_integration.delete_avatar.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "delete_avatar" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.delete_avatar.invoke_arn
  payload_format_version = "2.0"
}

# POST /orders/{id}/files
resource "aws_apigatewayv2_route" "upload_order_file" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /orders/{id}/files"
  target    = "integrations/${aws_apigatewayv2_integration.upload_order_file.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "upload_order_file" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.upload_order_file.invoke_arn
  payload_format_version = "2.0"
}

# GET /orders/{id}/files
resource "aws_apigatewayv2_route" "get_order_files" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /orders/{id}/files"
  target    = "integrations/${aws_apigatewayv2_integration.get_order_files.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "get_order_files" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_order_files.invoke_arn
  payload_format_version = "2.0"
}

# POST /chat/rooms/{id}/send-image
resource "aws_apigatewayv2_route" "send_chat_image" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /chat/rooms/{id}/send-image"
  target    = "integrations/${aws_apigatewayv2_integration.send_chat_image.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "send_chat_image" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.send_chat_image.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# SEARCH (3 routes)
# ============================================

# GET /services/search
resource "aws_apigatewayv2_route" "search_services" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /services/search"
  target    = "integrations/${aws_apigatewayv2_integration.search_services.id}"
}

resource "aws_apigatewayv2_integration" "search_services" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.search_services.invoke_arn
  payload_format_version = "2.0"
}

# GET /masters (search)
resource "aws_apigatewayv2_route" "search_masters" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /masters"
  target    = "integrations/${aws_apigatewayv2_integration.search_masters.id}"
}

resource "aws_apigatewayv2_integration" "search_masters" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.search_masters.invoke_arn
  payload_format_version = "2.0"
}

# GET /orders/search
resource "aws_apigatewayv2_route" "search_orders" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /orders/search"
  target    = "integrations/${aws_apigatewayv2_integration.search_orders.id}"
}

resource "aws_apigatewayv2_integration" "search_orders" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.search_orders.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# STATISTICS (3 routes)
# ============================================

# GET /masters/me/stats
resource "aws_apigatewayv2_route" "get_master_stats" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /masters/me/stats"
  target    = "integrations/${aws_apigatewayv2_integration.get_master_stats.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "get_master_stats" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_master_stats.invoke_arn
  payload_format_version = "2.0"
}

# GET /wallet/stats
resource "aws_apigatewayv2_route" "get_wallet_stats" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /wallet/stats"
  target    = "integrations/${aws_apigatewayv2_integration.get_wallet_stats.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "get_wallet_stats" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_wallet_stats.invoke_arn
  payload_format_version = "2.0"
}

# GET /masters/{id}/review-stats
resource "aws_apigatewayv2_route" "get_review_stats" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /masters/{id}/review-stats"
  target    = "integrations/${aws_apigatewayv2_integration.get_review_stats.id}"
}

resource "aws_apigatewayv2_integration" "get_review_stats" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.get_review_stats.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# FAVORITES (2 routes)
# ============================================

# POST /orders/{id}/favorite
resource "aws_apigatewayv2_route" "add_to_favorites" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /orders/{id}/favorite"
  target    = "integrations/${aws_apigatewayv2_integration.add_to_favorites.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "add_to_favorites" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.add_to_favorites.invoke_arn
  payload_format_version = "2.0"
}

# DELETE /orders/{id}/favorite
resource "aws_apigatewayv2_route" "remove_from_favorites" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /orders/{id}/favorite"
  target    = "integrations/${aws_apigatewayv2_integration.remove_from_favorites.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "remove_from_favorites" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.remove_from_favorites.invoke_arn
  payload_format_version = "2.0"
}

# ============================================
# PAYMENT METHODS (2 routes)
# ============================================

# POST /wallet/payment-methods
resource "aws_apigatewayv2_route" "create_payment_method" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /wallet/payment-methods"
  target    = "integrations/${aws_apigatewayv2_integration.create_payment_method.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "create_payment_method" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.create_payment_method.invoke_arn
  payload_format_version = "2.0"
}

# POST /wallet/send-payment
resource "aws_apigatewayv2_route" "send_payment" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /wallet/send-payment"
  target    = "integrations/${aws_apigatewayv2_integration.send_payment.id}"
  authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt.id
}

resource "aws_apigatewayv2_integration" "send_payment" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.send_payment.invoke_arn
  payload_format_version = "2.0"
}
