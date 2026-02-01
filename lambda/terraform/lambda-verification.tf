# Verification Lambda Functions

# Get Verification Requirements
resource "aws_lambda_function" "get_verification_requirements" {
  filename         = "${path.module}/../build/get-requirements.zip"
  function_name    = "${var.environment}-get-verification-requirements"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/verification/get-requirements.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-requirements.zip")
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
    Name        = "${var.environment}-get-verification-requirements"
    Environment = var.environment
    Service     = "verification"
  }
}

resource "aws_cloudwatch_log_group" "get_verification_requirements" {
  name              = "/aws/lambda/${aws_lambda_function.get_verification_requirements.function_name}"
  retention_in_days = 14
}

# Get Verification Status
resource "aws_lambda_function" "get_verification_status" {
  filename         = "${path.module}/../build/get-status.zip"
  function_name    = "${var.environment}-get-verification-status"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/verification/get-status.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-status.zip")
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
    Name        = "${var.environment}-get-verification-status"
    Environment = var.environment
    Service     = "verification"
  }
}

resource "aws_cloudwatch_log_group" "get_verification_status" {
  name              = "/aws/lambda/${aws_lambda_function.get_verification_status.function_name}"
  retention_in_days = 14
}

# Upload Verification Documents
resource "aws_lambda_function" "upload_verification_documents" {
  filename         = "${path.module}/../build/upload-documents.zip"
  function_name    = "${var.environment}-upload-verification-documents"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/verification/upload-documents.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/upload-documents.zip")
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
    Name        = "${var.environment}-upload-verification-documents"
    Environment = var.environment
    Service     = "verification"
  }
}

resource "aws_cloudwatch_log_group" "upload_verification_documents" {
  name              = "/aws/lambda/${aws_lambda_function.upload_verification_documents.function_name}"
  retention_in_days = 14
}

# Submit Verification for Review
resource "aws_lambda_function" "submit_verification_review" {
  filename         = "${path.module}/../build/submit-for-review.zip"
  function_name    = "${var.environment}-submit-verification-review"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/verification/submit-for-review.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/submit-for-review.zip")
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
    Name        = "${var.environment}-submit-verification-review"
    Environment = var.environment
    Service     = "verification"
  }
}

resource "aws_cloudwatch_log_group" "submit_verification_review" {
  name              = "/aws/lambda/${aws_lambda_function.submit_verification_review.function_name}"
  retention_in_days = 14
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "get_verification_requirements" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_verification_requirements.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_verification_status" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_verification_status.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "upload_verification_documents" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_verification_documents.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "submit_verification_review" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_verification_review.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
