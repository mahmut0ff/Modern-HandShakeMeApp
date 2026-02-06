output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.id
}

# Note: lambda_role_arn disabled - requires IAM permissions
# output "lambda_role_arn" {
#   description = "Lambda execution role ARN"
#   value       = aws_iam_role.lambda_role.arn
# }

# Worker outputs
output "rating_calculation_queue_url" {
  description = "Rating calculation SQS queue URL"
  value       = aws_sqs_queue.rating_calculation_queue.url
}

output "rating_calculation_queue_arn" {
  description = "Rating calculation SQS queue ARN"
  value       = aws_sqs_queue.rating_calculation_queue.arn
}

output "recommendation_queue_url" {
  description = "Recommendation SQS queue URL"
  value       = aws_sqs_queue.recommendation_queue.url
}

output "recommendation_queue_arn" {
  description = "Recommendation SQS queue ARN"
  value       = aws_sqs_queue.recommendation_queue.arn
}

# Note: Lambda function outputs disabled - requires IAM permissions to create functions
output "rating_calculator_function_name" {
  description = "Rating calculator Lambda function name (placeholder)"
  value       = "${var.project_name}-rating-calculator-${var.environment}"
}

output "recommendation_function_name" {
  description = "Recommendation Lambda function name (placeholder)"
  value       = "${var.project_name}-recommendation-${var.environment}"
}
