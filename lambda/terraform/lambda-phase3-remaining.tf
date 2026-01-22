# Remaining Critical Lambda Functions

# Orders
resource "aws_lambda_function" "orders_list" {
  filename      = "${path.module}/../dist/orders-list.zip"
  function_name = "${local.name_prefix}-orders-list"
  role          = aws_iam_role.lambda_role.arn
  handler       = "list-orders-dynamodb.handler"
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

resource "aws_lambda_function" "orders_create" {
  filename      = "${path.module}/../dist/orders-create.zip"
  function_name = "${local.name_prefix}-orders-create"
  role          = aws_iam_role.lambda_role.arn
  handler       = "create-order-dynamodb.handler"
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

resource "aws_lambda_function" "orders_get" {
  filename      = "${path.module}/../dist/orders-get.zip"
  function_name = "${local.name_prefix}-orders-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-order-dynamodb.handler"
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

resource "aws_lambda_function" "orders_update" {
  filename      = "${path.module}/../dist/orders-update.zip"
  function_name = "${local.name_prefix}-orders-update"
  role          = aws_iam_role.lambda_role.arn
  handler       = "update-order-dynamodb.handler"
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

# Applications
resource "aws_lambda_function" "applications_create" {
  filename      = "${path.module}/../dist/applications-create.zip"
  function_name = "${local.name_prefix}-applications-create"
  role          = aws_iam_role.lambda_role.arn
  handler       = "create-application-dynamodb.handler"
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

resource "aws_lambda_function" "applications_my" {
  filename      = "${path.module}/../dist/applications-my.zip"
  function_name = "${local.name_prefix}-applications-my"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-my-applications-dynamodb.handler"
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

resource "aws_lambda_function" "applications_respond" {
  filename      = "${path.module}/../dist/applications-respond.zip"
  function_name = "${local.name_prefix}-applications-respond"
  role          = aws_iam_role.lambda_role.arn
  handler       = "respond-to-application-dynamodb.handler"
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
