# Location Tracking Lambda Functions

# Real-time Location Handler
resource "aws_lambda_function" "real_time_location" {
  filename         = "${path.module}/../build/real-time-location.zip"
  function_name    = "${var.environment}-real-time-location"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/tracking/real-time-location.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/real-time-location.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE           = aws_dynamodb_table.main.name
      LOCATION_TRACKING_TABLE  = "${var.environment}-location-tracking"
      LOCATION_UPDATES_TABLE   = "${var.environment}-location-updates"
      TRACKING_EVENTS_TABLE    = "${var.environment}-tracking-events"
      ENVIRONMENT              = var.environment
      JWT_SECRET               = var.jwt_secret
      WEBSOCKET_ENDPOINT       = aws_apigatewayv2_stage.websocket.invoke_url
      FRONTEND_URL             = var.frontend_url
    }
  }

  tags = {
    Name        = "${var.environment}-real-time-location"
    Environment = var.environment
    Service     = "tracking"
  }
}

resource "aws_cloudwatch_log_group" "real_time_location" {
  name              = "/aws/lambda/${aws_lambda_function.real_time_location.function_name}"
  retention_in_days = 14
}

# Get Active Sessions
resource "aws_lambda_function" "get_active_sessions" {
  filename         = "${path.module}/../build/get-active-sessions.zip"
  function_name    = "${var.environment}-get-active-sessions"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/tracking/get-active-sessions.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-active-sessions.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE          = aws_dynamodb_table.main.name
      LOCATION_TRACKING_TABLE = "${var.environment}-location-tracking"
      ENVIRONMENT             = var.environment
      JWT_SECRET              = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-active-sessions"
    Environment = var.environment
    Service     = "tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_active_sessions" {
  name              = "/aws/lambda/${aws_lambda_function.get_active_sessions.function_name}"
  retention_in_days = 14
}

# Get Tracking Events
resource "aws_lambda_function" "get_tracking_events" {
  filename         = "${path.module}/../build/get-tracking-events.zip"
  function_name    = "${var.environment}-get-tracking-events"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/tracking/get-tracking-events.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-tracking-events.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE          = aws_dynamodb_table.main.name
      LOCATION_TRACKING_TABLE = "${var.environment}-location-tracking"
      TRACKING_EVENTS_TABLE   = "${var.environment}-tracking-events"
      ENVIRONMENT             = var.environment
      JWT_SECRET              = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-tracking-events"
    Environment = var.environment
    Service     = "tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_tracking_events" {
  name              = "/aws/lambda/${aws_lambda_function.get_tracking_events.function_name}"
  retention_in_days = 14
}

# Get Tracking Statistics
resource "aws_lambda_function" "get_tracking_statistics" {
  filename         = "${path.module}/../build/get-tracking-statistics.zip"
  function_name    = "${var.environment}-get-tracking-statistics"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/tracking/get-tracking-statistics.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-tracking-statistics.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE          = aws_dynamodb_table.main.name
      LOCATION_TRACKING_TABLE = "${var.environment}-location-tracking"
      ENVIRONMENT             = var.environment
      JWT_SECRET              = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-tracking-statistics"
    Environment = var.environment
    Service     = "tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_tracking_statistics" {
  name              = "/aws/lambda/${aws_lambda_function.get_tracking_statistics.function_name}"
  retention_in_days = 14
}

# Share Tracking Link
resource "aws_lambda_function" "share_tracking_link" {
  filename         = "${path.module}/../build/share-tracking-link.zip"
  function_name    = "${var.environment}-share-tracking-link"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/tracking/share-tracking-link.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/share-tracking-link.zip")
  runtime         = "nodejs18.x"
  timeout         = 15
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE          = aws_dynamodb_table.main.name
      LOCATION_TRACKING_TABLE = "${var.environment}-location-tracking"
      ENVIRONMENT             = var.environment
      JWT_SECRET              = var.jwt_secret
      FRONTEND_URL            = var.frontend_url
    }
  }

  tags = {
    Name        = "${var.environment}-share-tracking-link"
    Environment = var.environment
    Service     = "tracking"
  }
}

resource "aws_cloudwatch_log_group" "share_tracking_link" {
  name              = "/aws/lambda/${aws_lambda_function.share_tracking_link.function_name}"
  retention_in_days = 14
}

# Get Shared Tracking
resource "aws_lambda_function" "get_shared_tracking" {
  filename         = "${path.module}/../build/get-shared-tracking.zip"
  function_name    = "${var.environment}-get-shared-tracking"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/tracking/get-shared-tracking.handler"
  source_code_hash = filebase64sha256("${path.module}/../build/get-shared-tracking.zip")
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256

  environment {
    variables = {
      DYNAMODB_TABLE          = aws_dynamodb_table.main.name
      LOCATION_TRACKING_TABLE = "${var.environment}-location-tracking"
      LOCATION_UPDATES_TABLE  = "${var.environment}-location-updates"
      ENVIRONMENT             = var.environment
      JWT_SECRET              = var.jwt_secret
    }
  }

  tags = {
    Name        = "${var.environment}-get-shared-tracking"
    Environment = var.environment
    Service     = "tracking"
  }
}

resource "aws_cloudwatch_log_group" "get_shared_tracking" {
  name              = "/aws/lambda/${aws_lambda_function.get_shared_tracking.function_name}"
  retention_in_days = 14
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "real_time_location" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.real_time_location.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_active_sessions" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_active_sessions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_tracking_events" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_tracking_events.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_tracking_statistics" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_tracking_statistics.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "share_tracking_link" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.share_tracking_link.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_shared_tracking" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_shared_tracking.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
