# Wallet Lambda Functions

# Create Payment Method
resource "aws_lambda_function" "create_payment_method" {
  filename         = "${path.module}/../build/create-payment-method-dynamodb.zip"
  function_name    = "${var.environment}-create-payment-method"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/create-payment-method-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/create-payment-method-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-create-payment-method"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "create_payment_method" {
  name              = "/aws/lambda/${aws_lambda_function.create_payment_method.function_name}"
  retention_in_days = 14
}

# Get Payment Methods
resource "aws_lambda_function" "get_payment_methods" {
  filename         = "${path.module}/../build/get-payment-methods-dynamodb.zip"
  function_name    = "${var.environment}-get-payment-methods"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/get-payment-methods-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-payment-methods-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-payment-methods"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "get_payment_methods" {
  name              = "/aws/lambda/${aws_lambda_function.get_payment_methods.function_name}"
  retention_in_days = 14
}

# Deposit
resource "aws_lambda_function" "deposit" {
  filename         = "${path.module}/../build/deposit-dynamodb.zip"
  function_name    = "${var.environment}-deposit"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/deposit-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/deposit-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-deposit"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "deposit" {
  name              = "/aws/lambda/${aws_lambda_function.deposit.function_name}"
  retention_in_days = 14
}

# Withdraw
resource "aws_lambda_function" "withdraw" {
  filename         = "${path.module}/../build/withdraw-dynamodb.zip"
  function_name    = "${var.environment}-withdraw"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/withdraw-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/withdraw-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-withdraw"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "withdraw" {
  name              = "/aws/lambda/${aws_lambda_function.withdraw.function_name}"
  retention_in_days = 14
}

# Get Wallet Balance
resource "aws_lambda_function" "get_wallet" {
  filename         = "${path.module}/../build/get-wallet-dynamodb.zip"
  function_name    = "${var.environment}-get-wallet"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/get-wallet-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-wallet-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-wallet"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "get_wallet" {
  name              = "/aws/lambda/${aws_lambda_function.get_wallet.function_name}"
  retention_in_days = 14
}

# Get Transactions
resource "aws_lambda_function" "get_transactions" {
  filename         = "${path.module}/../build/get-transactions-dynamodb.zip"
  function_name    = "${var.environment}-get-transactions"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/get-transactions-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-transactions-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-transactions"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "get_transactions" {
  name              = "/aws/lambda/${aws_lambda_function.get_transactions.function_name}"
  retention_in_days = 14
}

# Get Wallet Stats
resource "aws_lambda_function" "get_wallet_stats" {
  filename         = "${path.module}/../build/get-wallet-stats-dynamodb.zip"
  function_name    = "${var.environment}-get-wallet-stats"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/get-wallet-stats-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-wallet-stats-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-wallet-stats"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "get_wallet_stats" {
  name              = "/aws/lambda/${aws_lambda_function.get_wallet_stats.function_name}"
  retention_in_days = 14
}

# Send Payment
resource "aws_lambda_function" "send_payment" {
  filename         = "${path.module}/../build/send-payment-dynamodb.zip"
  function_name    = "${var.environment}-send-payment"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/send-payment-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/send-payment-dynamodb.zip")
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-send-payment"
    Environment = var.environment
    Service     = "wallet"
  }
}

resource "aws_cloudwatch_log_group" "send_payment" {
  name              = "/aws/lambda/${aws_lambda_function.send_payment.function_name}"
  retention_in_days = 14
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "create_payment_method" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_payment_method.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_payment_methods" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_payment_methods.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "deposit" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.deposit.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "withdraw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.withdraw.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_wallet" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_wallet.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_transactions" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_transactions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_wallet_stats" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_wallet_stats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "send_payment" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_payment.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
