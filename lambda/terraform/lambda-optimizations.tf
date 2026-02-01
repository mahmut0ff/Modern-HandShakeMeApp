# =============================================================================
# Lambda Performance Optimizations
# =============================================================================

# Lambda function with optimized settings for high load
resource "aws_lambda_function" "optimized_example" {
  # This is an example of how to optimize Lambda functions
  # Apply these settings to your existing functions
  
  function_name = "${local.name_prefix}-optimized-example"
  role         = aws_iam_role.lambda_role.arn
  handler      = "index.handler"
  runtime      = "nodejs20.x"
  
  # Optimized settings for high load
  timeout     = 5   # Reduced from 10-30s for API endpoints
  memory_size = 1024 # Increased for better performance
  
  # Reserved concurrency to prevent one function from consuming all capacity
  reserved_concurrent_executions = 100
  
  # Provisioned concurrency for critical endpoints (costs more but eliminates cold starts)
  # provisioned_concurrency_config {
  #   provisioned_concurrent_executions = 10
  # }
  
  environment {
    variables = {
      NODE_ENV                = var.environment
      DYNAMODB_TABLE_NAME     = aws_dynamodb_table.main.name
      REDIS_ENDPOINT          = var.enable_redis ? aws_elasticache_replication_group.redis[0].primary_endpoint : ""
      ENABLE_CACHING          = var.enable_redis ? "true" : "false"
    }
  }
  
  # Enable X-Ray tracing for performance monitoring
  tracing_config {
    mode = "Active"
  }
  
  tags = local.common_tags
}

# Lambda Layer for shared dependencies (reduces cold start time)
resource "aws_lambda_layer_version" "shared_dependencies" {
  filename         = "${path.module}/../dist/shared-layer.zip"
  layer_name       = "${local.name_prefix}-shared-dependencies"
  source_code_hash = filebase64sha256("${path.module}/../dist/shared-layer.zip")
  
  compatible_runtimes = ["nodejs20.x"]
  description         = "Shared dependencies for Lambda functions"
}

# CloudWatch Log Groups with retention
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "auth-login",
    "auth-register", 
    "orders-list",
    "orders-create",
    "masters-search"
    # Add all your Lambda function names here
  ])
  
  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = 7  # Reduced from default 14 days to save costs
  
  tags = local.common_tags
}

# Lambda function URLs for direct invocation (bypasses API Gateway for some use cases)
resource "aws_lambda_function_url" "direct_access" {
  for_each = var.enable_direct_lambda_access ? toset([
    "orders-list",
    "masters-search"
  ]) : toset([])
  
  function_name      = "${local.name_prefix}-${each.key}"
  authorization_type = "AWS_IAM"
  
  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["date", "keep-alive"]
    expose_headers    = ["date", "keep-alive"]
    max_age          = 86400
  }
  
  depends_on = [aws_lambda_function.optimized_example]
}

# Auto Scaling for Lambda (Provisioned Concurrency)
resource "aws_lambda_provisioned_concurrency_config" "critical_functions" {
  for_each = var.enable_provisioned_concurrency ? toset([
    "auth-login",
    "orders-list", 
    "masters-search"
  ]) : toset([])
  
  function_name                     = "${local.name_prefix}-${each.key}"
  provisioned_concurrent_executions = 5  # Start with 5, can increase based on load
  qualifier                        = "$LATEST"
  
  depends_on = [aws_lambda_function.optimized_example]
}