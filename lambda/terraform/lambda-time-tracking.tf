# Time Tracking Lambda Functions

# Manage Time Sessions
resource "aws_lambda_function" "manage_time_sessions" {
  filename         = "${path.module}/../build/manage-time-sessions.zip"
  function_name    = "${var.environment}-manage-time-sessions"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/manage-time-sessions.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/manage-time-sessions.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE     = aws_dynamodb_table.main.name
      ENVIRONMENT        = var.environment
      JWT_SECRET         = var.jwt_secret
      WEBSOCKET_ENDPOINT = aws_apigatewayv2_stage.websocket.invoke_url
    }
  }

  tags = {
    Name        = "${var.environment}-manage-time-sessions"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "manage_time_sessions" {
  name              = "/aws/lambda/${aws_lambda_function.manage_time_sessions.function_name}"
  retention_in_days = 14
}

# Get Active Session
resource "aws_lambda_function" "get_active_session" {
  filename         = "${path.module}/../build/get-active-session.zip"
  function_name    = "${var.environment}-get-active-session"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/get-active-session.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-active-session.zip")
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
    Name        = "${var.environment}-get-active-session"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_active_session" {
  name              = "/aws/lambda/${aws_lambda_function.get_active_session.function_name}"
  retention_in_days = 14
}

# Get Sessions
resource "aws_lambda_function" "get_sessions" {
  filename         = "${path.module}/../build/get-sessions.zip"
  function_name    = "${var.environment}-get-sessions"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/get-sessions.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-sessions.zip")
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-sessions"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_sessions" {
  name              = "/aws/lambda/${aws_lambda_function.get_sessions.function_name}"
  retention_in_days = 14
}

# Get Session Entries
resource "aws_lambda_function" "get_session_entries" {
  filename         = "${path.module}/../build/get-session-entries.zip"
  function_name    = "${var.environment}-get-session-entries"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/get-session-entries.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-session-entries.zip")
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
    Name        = "${var.environment}-get-session-entries"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_session_entries" {
  name              = "/aws/lambda/${aws_lambda_function.get_session_entries.function_name}"
  retention_in_days = 14
}

# Get Statistics
resource "aws_lambda_function" "get_time_tracking_statistics" {
  filename         = "${path.module}/../build/get-statistics.zip"
  function_name    = "${var.environment}-get-time-tracking-statistics"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/get-statistics.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-statistics.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-time-tracking-statistics"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_time_tracking_statistics" {
  name              = "/aws/lambda/${aws_lambda_function.get_time_tracking_statistics.function_name}"
  retention_in_days = 14
}

# Export Data
resource "aws_lambda_function" "export_time_tracking_data" {
  filename         = "${path.module}/../build/export-data.zip"
  function_name    = "${var.environment}-export-time-tracking-data"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/export-data.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/export-data.zip")
  runtime         = "nodejs18.x"
  timeout         = 60
  memory_size     = 1024

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      ENVIRONMENT    = var.environment
      JWT_SECRET     = var.jwt_secret
      S3_BUCKET      = aws_s3_bucket.uploads.id
    }
  }

  tags = {
    Name        = "${var.environment}-export-time-tracking-data"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "export_time_tracking_data" {
  name              = "/aws/lambda/${aws_lambda_function.export_time_tracking_data.function_name}"
  retention_in_days = 14
}

# Manage Templates
resource "aws_lambda_function" "manage_time_tracking_templates" {
  filename         = "${path.module}/../build/manage-templates.zip"
  function_name    = "${var.environment}-manage-time-tracking-templates"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/time-tracking/manage-templates.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/manage-templates.zip")
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
    Name        = "${var.environment}-manage-time-tracking-templates"
    Environment = var.environment
    Service     = "time-tracking"
  }
}

resource "aws_cloudwatch_log_group" "manage_time_tracking_templates" {
  name              = "/aws/lambda/${aws_lambda_function.manage_time_tracking_templates.function_name}"
  retention_in_days = 14
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "manage_time_sessions" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.manage_time_sessions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_active_session" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_active_session.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_sessions" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_sessions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_session_entries" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_session_entries.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_time_tracking_statistics" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_time_tracking_statistics.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "export_time_tracking_data" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.export_time_tracking_data.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "manage_time_tracking_templates" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.manage_time_tracking_templates.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
