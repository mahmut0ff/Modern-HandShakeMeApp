# Other Module Lambda Functions

resource "aws_lambda_function" "orders_my" {
  filename      = "${path.module}/../dist/orders-my.zip"
  function_name = "${local.name_prefix}-orders-my"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-my-orders-dynamodb.handler"
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

resource "aws_lambda_function" "chat_rooms_list" {
  filename      = "${path.module}/../dist/chat-rooms-list.zip"
  function_name = "${local.name_prefix}-chat-rooms-list"
  role          = aws_iam_role.lambda_role.arn
  handler       = "list-rooms-dynamodb.handler"
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

resource "aws_lambda_function" "chat_room_get" {
  filename      = "${path.module}/../dist/chat-room-get.zip"
  function_name = "${local.name_prefix}-chat-room-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-room-dynamodb.handler"
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

resource "aws_lambda_function" "notifications_unread_count" {
  filename      = "${path.module}/../dist/notifications-unread-count.zip"
  function_name = "${local.name_prefix}-notifications-unread-count"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-unread-count-dynamodb.handler"
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

resource "aws_lambda_function" "applications_update" {
  filename      = "${path.module}/../dist/applications-update.zip"
  function_name = "${local.name_prefix}-applications-update"
  role          = aws_iam_role.lambda_role.arn
  handler       = "update-application-dynamodb.handler"
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

resource "aws_lambda_function" "applications_delete" {
  filename      = "${path.module}/../dist/applications-delete.zip"
  function_name = "${local.name_prefix}-applications-delete"
  role          = aws_iam_role.lambda_role.arn
  handler       = "delete-application-dynamodb.handler"
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

resource "aws_lambda_function" "projects_cancel" {
  filename      = "${path.module}/../dist/projects-cancel.zip"
  function_name = "${local.name_prefix}-projects-cancel"
  role          = aws_iam_role.lambda_role.arn
  handler       = "cancel-project-dynamodb.handler"
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

resource "aws_lambda_function" "service_categories_list" {
  filename      = "${path.module}/../dist/service-categories-list.zip"
  function_name = "${local.name_prefix}-service-categories-list"
  role          = aws_iam_role.lambda_role.arn
  handler       = "list-service-categories-dynamodb.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  environment {
    variables = {
      AWS_REGION = var.aws_region
    }
  }
  tags = local.common_tags
}

resource "aws_lambda_function" "reviews_update" {
  filename      = "${path.module}/../dist/reviews-update.zip"
  function_name = "${local.name_prefix}-reviews-update"
  role          = aws_iam_role.lambda_role.arn
  handler       = "update-review-dynamodb.handler"
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

resource "aws_lambda_function" "wallet_payment_methods_get" {
  filename      = "${path.module}/../dist/wallet-payment-methods-get.zip"
  function_name = "${local.name_prefix}-wallet-payment-methods-get"
  role          = aws_iam_role.lambda_role.arn
  handler       = "get-payment-methods-dynamodb.handler"
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
