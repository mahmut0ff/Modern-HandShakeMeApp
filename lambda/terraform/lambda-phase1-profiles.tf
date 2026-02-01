# Profile Lambda Functions

resource "aws_lambda_function" "masters_get" {
  filename      = "${path.module}/../dist/masters-get.zip"
  function_name = "${local.name_prefix}-masters-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-master-profile-dynamodb.handler"
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

resource "aws_lambda_function" "masters_me_get" {
  filename      = "${path.module}/../dist/masters-me-get.zip"
  function_name = "${local.name_prefix}-masters-me-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-my-master-profile-dynamodb.handler"
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

resource "aws_lambda_function" "masters_me_update" {
  filename      = "${path.module}/../dist/masters-me-update.zip"
  function_name = "${local.name_prefix}-masters-me-update"
  role          = aws_iam_role.lambda_role.arn
  handler       = "update-master-profile-dynamodb.handler"
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

resource "aws_lambda_function" "clients_me_get" {
  filename      = "${path.module}/../dist/clients-me-get.zip"
  function_name = "${local.name_prefix}-clients-me-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-my-client-profile-dynamodb.handler"
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

resource "aws_lambda_function" "clients_me_update" {
  filename      = "${path.module}/../dist/clients-me-update.zip"
  function_name = "${local.name_prefix}-clients-me-update"
  role          = aws_iam_role.lambda_role.arn
  handler       = "update-client-profile-dynamodb.handler"
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

# Dashboard Stats Lambda Functions

resource "aws_lambda_function" "clients_dashboard_stats" {
  filename      = "${path.module}/../dist/clients-dashboard-stats.zip"
  function_name = "${local.name_prefix}-clients-dashboard-stats"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-client-dashboard-stats.handler"
  runtime       = "nodejs20.x"
  timeout       = 15
  memory_size   = 512

  environment {
    variables = {
      ORDERS_TABLE       = aws_dynamodb_table.main.name
      MASTERS_TABLE      = aws_dynamodb_table.main.name
      JWT_SECRET_ARN     = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION         = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "masters_dashboard_stats" {
  filename      = "${path.module}/../dist/masters-dashboard-stats.zip"
  function_name = "${local.name_prefix}-masters-dashboard-stats"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-master-dashboard-stats.handler"
  runtime       = "nodejs20.x"
  timeout       = 15
  memory_size   = 512

  environment {
    variables = {
      ORDERS_TABLE       = aws_dynamodb_table.main.name
      APPLICATIONS_TABLE = aws_dynamodb_table.main.name
      MASTERS_TABLE      = aws_dynamodb_table.main.name
      CHAT_ROOMS_TABLE   = aws_dynamodb_table.main.name
      JWT_SECRET_ARN     = aws_secretsmanager_secret.jwt_secret.arn
      AWS_REGION         = var.aws_region
    }
  }
  tags = local.common_tags
}
