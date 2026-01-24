# Disputes Module Lambda Functions
# Complete dispute management system with 11 handlers

# ============================================
# DISPUTES CRUD (3 functions)
# ============================================

# Create Dispute
resource "aws_lambda_function" "create_dispute" {
  filename         = "${path.module}/../dist/disputes-create.zip"
  function_name    = "${var.project_name}-create-dispute-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/create-dispute.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-create.zip")
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

resource "aws_lambda_permission" "create_dispute" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_dispute.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Get Disputes (List)
resource "aws_lambda_function" "get_disputes" {
  filename         = "${path.module}/../dist/disputes-get-list.zip"
  function_name    = "${var.project_name}-get-disputes-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/get-disputes-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-get-list.zip")
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

resource "aws_lambda_permission" "get_disputes" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_disputes.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Get Dispute (Single)
resource "aws_lambda_function" "get_dispute" {
  filename         = "${path.module}/../dist/disputes-get-single.zip"
  function_name    = "${var.project_name}-get-dispute-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/get-dispute-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-get-single.zip")
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

resource "aws_lambda_permission" "get_dispute" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_dispute.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# DISPUTE STATUS MANAGEMENT (4 functions)
# ============================================

# Update Dispute Status
resource "aws_lambda_function" "update_dispute_status" {
  filename         = "${path.module}/../dist/disputes-update-status.zip"
  function_name    = "${var.project_name}-update-dispute-status-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/update-dispute-status.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-update-status.zip")
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

resource "aws_lambda_permission" "update_dispute_status" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_dispute_status.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Close Dispute
resource "aws_lambda_function" "close_dispute" {
  filename         = "${path.module}/../dist/disputes-close.zip"
  function_name    = "${var.project_name}-close-dispute-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/close-dispute-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-close.zip")
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

resource "aws_lambda_permission" "close_dispute" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.close_dispute.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Escalate Dispute
resource "aws_lambda_function" "escalate_dispute" {
  filename         = "${path.module}/../dist/disputes-escalate.zip"
  function_name    = "${var.project_name}-escalate-dispute-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/escalate-dispute-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-escalate.zip")
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

resource "aws_lambda_permission" "escalate_dispute" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.escalate_dispute.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Request Mediation
resource "aws_lambda_function" "request_mediation" {
  filename         = "${path.module}/../dist/disputes-mediation.zip"
  function_name    = "${var.project_name}-request-mediation-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/request-mediation-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-mediation.zip")
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

resource "aws_lambda_permission" "request_mediation" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.request_mediation.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# DISPUTE MESSAGES (2 functions)
# ============================================

# Get Dispute Messages
resource "aws_lambda_function" "get_dispute_messages" {
  filename         = "${path.module}/../dist/disputes-messages-get.zip"
  function_name    = "${var.project_name}-get-dispute-messages-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/get-dispute-messages-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-messages-get.zip")
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

resource "aws_lambda_permission" "get_dispute_messages" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_dispute_messages.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Send Dispute Message
resource "aws_lambda_function" "send_dispute_message" {
  filename         = "${path.module}/../dist/disputes-messages-send.zip"
  function_name    = "${var.project_name}-send-dispute-message-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/send-dispute-message-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-messages-send.zip")
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

resource "aws_lambda_permission" "send_dispute_message" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_dispute_message.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# DISPUTE EVIDENCE (1 function)
# ============================================

# Add Evidence
resource "aws_lambda_function" "add_evidence" {
  filename         = "${path.module}/../dist/disputes-evidence-add.zip"
  function_name    = "${var.project_name}-add-evidence-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/add-evidence.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-evidence-add.zip")
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

resource "aws_lambda_permission" "add_evidence" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add_evidence.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ============================================
# DISPUTE RESOLUTION (1 function)
# ============================================

# Accept Resolution
resource "aws_lambda_function" "accept_resolution" {
  filename         = "${path.module}/../dist/disputes-resolution-accept.zip"
  function_name    = "${var.project_name}-accept-resolution-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "core/disputes/accept-resolution-dynamodb.handler"
  source_code_hash = filebase64sha256("${path.module}/../dist/disputes-resolution-accept.zip")
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

resource "aws_lambda_permission" "accept_resolution" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.accept_resolution.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
