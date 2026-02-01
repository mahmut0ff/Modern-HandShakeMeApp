# Users Lambda Functions

# Get Current User (Me)
resource "aws_lambda_function" "get_current_user" {
  filename         = "${path.module}/../build/me.zip"
  function_name    = "${var.environment}-get-current-user"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/users/me.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/me.zip")
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
    Name        = "${var.environment}-get-current-user"
    Environment = var.environment
    Service     = "users"
  }
}

resource "aws_cloudwatch_log_group" "get_current_user" {
  name              = "/aws/lambda/${aws_lambda_function.get_current_user.function_name}"
  retention_in_days = 14
}

# Update Current User
resource "aws_lambda_function" "update_current_user" {
  filename         = "${path.module}/../build/update-me.zip"
  function_name    = "${var.environment}-update-current-user"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/users/update-me.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/update-me.zip")
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
    Name        = "${var.environment}-update-current-user"
    Environment = var.environment
    Service     = "users"
  }
}

resource "aws_cloudwatch_log_group" "update_current_user" {
  name              = "/aws/lambda/${aws_lambda_function.update_current_user.function_name}"
  retention_in_days = 14
}

# Upload Avatar
resource "aws_lambda_function" "upload_avatar" {
  filename         = "${path.module}/../build/upload-avatar.zip"
  function_name    = "${var.environment}-upload-avatar"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/users/upload-avatar.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/upload-avatar.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE  = aws_dynamodb_table.main.name
      ENVIRONMENT     = var.environment
      JWT_SECRET      = var.jwt_secret
      S3_BUCKET_NAME  = aws_s3_bucket.uploads.id
      AWS_REGION      = var.aws_region
    }
  }

  tags = {
    Name        = "${var.environment}-upload-avatar"
    Environment = var.environment
    Service     = "users"
  }
}

resource "aws_cloudwatch_log_group" "upload_avatar" {
  name              = "/aws/lambda/${aws_lambda_function.upload_avatar.function_name}"
  retention_in_days = 14
}

# Delete Avatar
resource "aws_lambda_function" "delete_avatar" {
  filename         = "${path.module}/../build/delete-avatar.zip"
  function_name    = "${var.environment}-delete-avatar"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/users/delete-avatar.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/delete-avatar.zip")
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE  = aws_dynamodb_table.main.name
      ENVIRONMENT     = var.environment
      JWT_SECRET      = var.jwt_secret
      S3_BUCKET_NAME  = aws_s3_bucket.uploads.id
      AWS_REGION      = var.aws_region
    }
  }

  tags = {
    Name        = "${var.environment}-delete-avatar"
    Environment = var.environment
    Service     = "users"
  }
}

resource "aws_cloudwatch_log_group" "delete_avatar" {
  name              = "/aws/lambda/${aws_lambda_function.delete_avatar.function_name}"
  retention_in_days = 14
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "get_current_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_current_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "update_current_user" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_current_user.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "upload_avatar" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_avatar.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete_avatar" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_avatar.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
