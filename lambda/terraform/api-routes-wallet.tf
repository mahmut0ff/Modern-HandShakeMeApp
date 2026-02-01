# Wallet API Routes

# POST /wallet/payment-methods - Create payment method
resource "aws_apigatewayv2_route" "create_payment_method" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /wallet/payment-methods"
  target    = "integrations/${aws_apigatewayv2_integration.create_payment_method.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "create_payment_method" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.create_payment_method.invoke_arn
  payload_format_version = "2.0"
}

# GET /wallet/payment-methods - Get payment methods
resource "aws_apigatewayv2_route" "get_payment_methods" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /wallet/payment-methods"
  target    = "integrations/${aws_apigatewayv2_integration.get_payment_methods.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_payment_methods" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_payment_methods.invoke_arn
  payload_format_version = "2.0"
}

# POST /wallet/deposit - Deposit to wallet
resource "aws_apigatewayv2_route" "deposit" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /wallet/deposit"
  target    = "integrations/${aws_apigatewayv2_integration.deposit.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "deposit" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.deposit.invoke_arn
  payload_format_version = "2.0"
}

# POST /wallet/withdraw - Withdraw from wallet
resource "aws_apigatewayv2_route" "withdraw" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /wallet/withdraw"
  target    = "integrations/${aws_apigatewayv2_integration.withdraw.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "withdraw" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.withdraw.invoke_arn
  payload_format_version = "2.0"
}

# GET /wallet - Get wallet balance
resource "aws_apigatewayv2_route" "get_wallet" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /wallet"
  target    = "integrations/${aws_apigatewayv2_integration.get_wallet.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_wallet" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_wallet.invoke_arn
  payload_format_version = "2.0"
}

# GET /wallet/transactions - Get transactions
resource "aws_apigatewayv2_route" "get_transactions" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /wallet/transactions"
  target    = "integrations/${aws_apigatewayv2_integration.get_transactions.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_transactions" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_transactions.invoke_arn
  payload_format_version = "2.0"
}

# GET /wallet/stats - Get wallet statistics
resource "aws_apigatewayv2_route" "get_wallet_stats" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /wallet/stats"
  target    = "integrations/${aws_apigatewayv2_integration.get_wallet_stats.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_wallet_stats" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_wallet_stats.invoke_arn
  payload_format_version = "2.0"
}

# POST /wallet/send-payment - Send payment
resource "aws_apigatewayv2_route" "send_payment" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /wallet/send-payment"
  target    = "integrations/${aws_apigatewayv2_integration.send_payment.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "send_payment" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.send_payment.invoke_arn
  payload_format_version = "2.0"
}
