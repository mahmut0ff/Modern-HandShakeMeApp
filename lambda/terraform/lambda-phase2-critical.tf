# Phase 2: Critical Features Lambda Functions
# File uploads, Search, Statistics, Favorites, Payment Methods

# ============================================
# FILE UPLOADS (5 functions)
# ============================================

# Upload Avatar
resource "aws_lambda_function" "upload_avatar" {
  filename         = "${path.module}/../dist/users-avatar-upload.zip"
  function_name    = "${var.project_name}-upload-avatar-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/profiles/upload-avatar-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/users-avatar-upload.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      S3_BUCKET      = aws_s3_bucket.uploads.bucket
    }
  }
}

resource "aws_lambda_permission" "upload_avatar" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_avatar.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Delete Avatar
resource "aws_lambda_function" "delete_avatar" {
  filename         = "${path.module}/../dist/users-avatar-delete.zip"
  function_name    = "${var.project_name}-delete-avatar-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/profiles/delete-avatar-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/users-avatar-delete.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      S3_BUCKET      = aws_s3_bucket.uploads.bucket
    }
  }
}

resource "aws_lambda_permission" "delete_avatar" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_avatar.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Upload Order File
resource "aws_lambda_function" "upload_order_file" {
  filename         = "${path.module}/../dist/orders-files-upload.zip"
  function_name    = "${var.project_name}-upload-order-file-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/orders/upload-order-file-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/orders-files-upload.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      S3_BUCKET      = aws_s3_bucket.uploads.bucket
    }
  }
}

resource "aws_lambda_permission" "upload_order_file" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_order_file.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Get Order Files
resource "aws_lambda_function" "get_order_files" {
  filename         = "${path.module}/../dist/orders-files-get.zip"
  function_name    = "${var.project_name}-get-order-files-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/orders/get-order-files-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/orders-files-get.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "get_order_files" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_order_files.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Send Chat Image
resource "aws_lambda_function" "send_chat_image" {
  filename         = "${path.module}/../dist/chat-send-image.zip"
  function_name    = "${var.project_name}-send-chat-image-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/chat/send-image-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/chat-send-image.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      S3_BUCKET      = aws_s3_bucket.uploads.bucket
    }
  }
}

resource "aws_lambda_permission" "send_chat_image" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_chat_image.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# SEARCH (3 functions)
# ============================================

# Search Services
resource "aws_lambda_function" "search_services" {
  filename         = "${path.module}/../dist/services-search.zip"
  function_name    = "${var.project_name}-search-services-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/services/search-services-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/services-search.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
    }
  }
}

resource "aws_lambda_permission" "search_services" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_services.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Search Masters
resource "aws_lambda_function" "search_masters" {
  filename         = "${path.module}/../dist/masters-search.zip"
  function_name    = "${var.project_name}-search-masters-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/profiles/search-masters-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/masters-search.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
    }
  }
}

resource "aws_lambda_permission" "search_masters" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_masters.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Search Orders
resource "aws_lambda_function" "search_orders" {
  filename         = "${path.module}/../dist/orders-search.zip"
  function_name    = "${var.project_name}-search-orders-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/orders/search-orders-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/orders-search.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
    }
  }
}

resource "aws_lambda_permission" "search_orders" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_orders.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# STATISTICS (3 functions)
# ============================================

# Get Master Stats
resource "aws_lambda_function" "get_master_stats" {
  filename         = "${path.module}/../dist/masters-stats.zip"
  function_name    = "${var.project_name}-get-master-stats-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/profiles/get-master-stats-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/masters-stats.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "get_master_stats" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_master_stats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Get Wallet Stats
resource "aws_lambda_function" "get_wallet_stats" {
  filename         = "${path.module}/../dist/wallet-stats.zip"
  function_name    = "${var.project_name}-get-wallet-stats-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/get-wallet-stats-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/wallet-stats.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "get_wallet_stats" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_wallet_stats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Get Review Stats
resource "aws_lambda_function" "get_review_stats" {
  filename         = "${path.module}/../dist/reviews-stats.zip"
  function_name    = "${var.project_name}-get-review-stats-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/reviews/get-review-stats-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/reviews-stats.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
    }
  }
}

resource "aws_lambda_permission" "get_review_stats" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_review_stats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# FAVORITES (2 functions)
# ============================================

# Add to Favorites
resource "aws_lambda_function" "add_to_favorites" {
  filename         = "${path.module}/../dist/orders-favorite-add.zip"
  function_name    = "${var.project_name}-add-to-favorites-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/orders/add-to-favorites-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/orders-favorite-add.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "add_to_favorites" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add_to_favorites.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Remove from Favorites
resource "aws_lambda_function" "remove_from_favorites" {
  filename         = "${path.module}/../dist/orders-favorite-remove.zip"
  function_name    = "${var.project_name}-remove-from-favorites-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/orders/remove-from-favorites-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/orders-favorite-remove.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "remove_from_favorites" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.remove_from_favorites.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# PAYMENT METHODS (2 functions)
# ============================================

# Create Payment Method
resource "aws_lambda_function" "create_payment_method" {
  filename         = "${path.module}/../dist/wallet-payment-methods-create.zip"
  function_name    = "${var.project_name}-create-payment-method-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/create-payment-method-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/wallet-payment-methods-create.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "create_payment_method" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_payment_method.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Send Payment
resource "aws_lambda_function" "send_payment" {
  filename         = "${path.module}/../dist/wallet-send-payment.zip"
  function_name    = "${var.project_name}-send-payment-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/wallet/send-payment-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/wallet-send-payment.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
    }
  }
}

resource "aws_lambda_permission" "send_payment" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_payment.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
