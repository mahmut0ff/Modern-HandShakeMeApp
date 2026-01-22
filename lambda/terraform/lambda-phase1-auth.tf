# Auth & User Management Lambda Functions

resource "aws_lambda_function" "auth_login" {
  filename      = "${path.module}/../dist/auth-login.zip"
  function_name = "${local.name_prefix}-auth-login"
  role          = aws_iam_role.lambda_role.arn
  handler       = "login-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION     = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "auth_register" {
  filename      = "${path.module}/../dist/auth-register.zip"
  function_name = "${local.name_prefix}-auth-register"
  role          = aws_iam_role.lambda_role.arn
  handler       = "register-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION     = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "auth_refresh" {
  filename      = "${path.module}/../dist/auth-refresh.zip"
  function_name = "${local.name_prefix}-auth-refresh"
  role          = aws_iam_role.lambda_role.arn
  handler       = "refresh-token-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION     = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "auth_logout" {
  filename      = "${path.module}/../dist/auth-logout.zip"
  function_name = "${local.name_prefix}-auth-logout"
  role          = aws_iam_role.lambda_role.arn
  handler       = "logout-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      AWS_REGION     = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "users_me_get" {
  filename      = "${path.module}/../dist/users-me-get.zip"
  function_name = "${local.name_prefix}-users-me-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-current-user-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION     = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "users_me_update" {
  filename      = "${path.module}/../dist/users-me-update.zip"
  function_name = "${local.name_prefix}-users-me-update"
  role          = aws_iam_role.lambda_role.arn
  handler       = "update-current-user-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      JWT_SECRET_ARN = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION     = var.aws_region
    }
  }
  tags = local.common_tags
}
