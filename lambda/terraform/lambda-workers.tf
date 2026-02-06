# Worker Lambda Functions
# NOTE: Disabled - requires IAM permissions to create roles

# SQS Queues for async processing
resource "aws_sqs_queue" "recommendation_queue" {
  name                       = "${var.project_name}-recommendation-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 10

  tags = {
    Name        = "${var.project_name}-recommendation-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sqs_queue" "recommendation_dlq" {
  name                      = "${var.project_name}-recommendation-dlq-${var.environment}"
  message_retention_seconds = 1209600

  tags = {
    Name        = "${var.project_name}-recommendation-dlq-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sqs_queue" "rating_calculation_queue" {
  name                       = "${var.project_name}-rating-calculation-${var.environment}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 10

  tags = {
    Name        = "${var.project_name}-rating-calculation-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sqs_queue" "rating_calculation_dlq" {
  name                      = "${var.project_name}-rating-calculation-dlq-${var.environment}"
  message_retention_seconds = 1209600

  tags = {
    Name        = "${var.project_name}-rating-calculation-dlq-${var.environment}"
    Environment = var.environment
  }
}

# Outputs
# Note: outputs moved to outputs.tf to avoid duplicates

# =============================================================================
# DISABLED RESOURCES (requires IAM permissions)
# =============================================================================
# Uncomment when you have IAM:CreateRole permissions:
# - aws_iam_role.worker_lambda_role
# - aws_iam_role_policy.worker_lambda_policy
# - aws_lambda_function.recommendation_worker
# - aws_lambda_function.rating_calculator
# - aws_lambda_event_source_mapping resources
