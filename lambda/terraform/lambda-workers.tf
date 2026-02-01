# Workers Lambda Functions and SQS Queues

# SQS Queue for Rating Calculation
resource "aws_sqs_queue" "rating_calculation_queue" {
  name                       = "${var.project_name}-rating-calculation-${var.environment}"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 300 # 5 minutes

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.rating_calculation_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "${var.project_name}-rating-calculation-${var.environment}"
    Environment = var.environment
  }
}

# Dead Letter Queue for Rating Calculation
resource "aws_sqs_queue" "rating_calculation_dlq" {
  name                      = "${var.project_name}-rating-calculation-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "${var.project_name}-rating-calculation-dlq-${var.environment}"
    Environment = var.environment
  }
}

# SQS Queue for Recommendations
resource "aws_sqs_queue" "recommendation_queue" {
  name                       = "${var.project_name}-recommendation-${var.environment}"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 300 # 5 minutes

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.recommendation_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "${var.project_name}-recommendation-${var.environment}"
    Environment = var.environment
  }
}

# Dead Letter Queue for Recommendations
resource "aws_sqs_queue" "recommendation_dlq" {
  name                      = "${var.project_name}-recommendation-dlq-${var.environment}"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "${var.project_name}-recommendation-dlq-${var.environment}"
    Environment = var.environment
  }
}

# IAM Role for Worker Lambdas
resource "aws_iam_role" "worker_lambda_role" {
  name = "${var.project_name}-worker-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-worker-lambda-role-${var.environment}"
    Environment = var.environment
  }
}

# IAM Policy for Worker Lambdas
resource "aws_iam_role_policy" "worker_lambda_policy" {
  name = "${var.project_name}-worker-lambda-policy-${var.environment}"
  role = aws_iam_role.worker_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.main.arn,
          "${aws_dynamodb_table.main.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.rating_calculation_queue.arn,
          aws_sqs_queue.recommendation_queue.arn
        ]
      }
    ]
  })
}

# Attach basic execution role
resource "aws_iam_role_policy_attachment" "worker_lambda_basic" {
  role       = aws_iam_role.worker_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Rating Calculator Lambda Function
resource "aws_lambda_function" "rating_calculator" {
  filename         = "${path.module}/../build/rating-calculator.zip"
  function_name    = "${var.project_name}-rating-calculator-${var.environment}"
  role            = aws_iam_role.worker_lambda_role.arn
  handler         = "core/workers/rating-calculator.handler"
  source_code_hash = fileexists("${path.module}/../build/rating-calculator.zip") ? filebase64sha256("${path.module}/../build/rating-calculator.zip") : null
  runtime         = "nodejs18.x"
  timeout         = 300 # 5 minutes
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      REDIS_HOST     = var.redis_host
      REDIS_PORT     = var.redis_port
      NODE_ENV       = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-rating-calculator-${var.environment}"
    Environment = var.environment
  }
}

# SQS Event Source Mapping for Rating Calculator
resource "aws_lambda_event_source_mapping" "rating_calculator_sqs" {
  event_source_arn = aws_sqs_queue.rating_calculation_queue.arn
  function_name    = aws_lambda_function.rating_calculator.arn
  batch_size       = 10
  enabled          = true
}

# Recommendation Lambda Function
resource "aws_lambda_function" "recommendation" {
  filename         = "${path.module}/../build/recommendation.zip"
  function_name    = "${var.project_name}-recommendation-${var.environment}"
  role            = aws_iam_role.worker_lambda_role.arn
  handler         = "core/workers/recommendation.handler"
  source_code_hash = fileexists("${path.module}/../build/recommendation.zip") ? filebase64sha256("${path.module}/../build/recommendation.zip") : null
  runtime         = "nodejs18.x"
  timeout         = 300 # 5 minutes
  memory_size     = 512

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.main.name
      REDIS_HOST     = var.redis_host
      REDIS_PORT     = var.redis_port
      NODE_ENV       = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-recommendation-${var.environment}"
    Environment = var.environment
  }
}

# SQS Event Source Mapping for Recommendation
resource "aws_lambda_event_source_mapping" "recommendation_sqs" {
  event_source_arn = aws_sqs_queue.recommendation_queue.arn
  function_name    = aws_lambda_function.recommendation.arn
  batch_size       = 10
  enabled          = true
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "rating_calculator" {
  name              = "/aws/lambda/${aws_lambda_function.rating_calculator.function_name}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-rating-calculator-logs-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "recommendation" {
  name              = "/aws/lambda/${aws_lambda_function.recommendation.function_name}"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-recommendation-logs-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch Alarms for DLQ
resource "aws_cloudwatch_metric_alarm" "rating_calculation_dlq_alarm" {
  alarm_name          = "${var.project_name}-rating-calculation-dlq-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in rating calculation DLQ"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.rating_calculation_dlq.name
  }

  tags = {
    Name        = "${var.project_name}-rating-calculation-dlq-alarm-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "recommendation_dlq_alarm" {
  alarm_name          = "${var.project_name}-recommendation-dlq-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when messages appear in recommendation DLQ"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.recommendation_dlq.name
  }

  tags = {
    Name        = "${var.project_name}-recommendation-dlq-alarm-${var.environment}"
    Environment = var.environment
  }
}
