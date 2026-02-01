# Critical Production Monitoring for HandShakeMe
# This file contains essential monitoring that MUST be deployed

# SNS Topic for Critical Alerts
resource "aws_sns_topic" "critical_alerts" {
  name = "handshake-critical-alerts-${var.environment}"
  
  tags = {
    Environment = var.environment
    Project     = "HandShakeMe"
    Purpose     = "Critical Alerts"
  }
}

# SNS Topic Subscription (replace with real email)
resource "aws_sns_topic_subscription" "critical_alerts_email" {
  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email # Define this in variables
}

# CloudWatch Alarms for Lambda Functions

# High Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_high_error_rate" {
  for_each = toset([
    "instant-booking-kg",
    "telegram-login",
    "create-order",
    "get-orders",
    "send-sms-kg"
  ])

  alarm_name          = "lambda-${each.key}-high-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors ${each.key} lambda error rate"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    FunctionName = "handshake-${each.key}-${var.environment}"
  }

  tags = {
    Environment = var.environment
    Function    = each.key
  }
}

# High Duration Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_high_duration" {
  for_each = toset([
    "instant-booking-kg",
    "telegram-login",
    "create-order"
  ])

  alarm_name          = "lambda-${each.key}-high-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000" # 10 seconds
  alarm_description   = "This metric monitors ${each.key} lambda duration"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    FunctionName = "handshake-${each.key}-${var.environment}"
  }

  tags = {
    Environment = var.environment
    Function    = each.key
  }
}

# DynamoDB Throttling Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttling" {
  alarm_name          = "dynamodb-throttling-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors DynamoDB throttling"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  tags = {
    Environment = var.environment
  }
}

# API Gateway 5xx Errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "api-gateway-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    ApiName = aws_apigatewayv2_api.main.name
  }

  tags = {
    Environment = var.environment
  }
}

# API Gateway High Latency
resource "aws_cloudwatch_metric_alarm" "api_gateway_high_latency" {
  alarm_name          = "api-gateway-high-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000" # 5 seconds
  alarm_description   = "This metric monitors API Gateway latency"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    ApiName = aws_apigatewayv2_api.main.name
  }

  tags = {
    Environment = var.environment
  }
}

# Custom Metrics for Business Logic

# Low Booking Success Rate
resource "aws_cloudwatch_metric_alarm" "low_booking_success_rate" {
  alarm_name          = "low-booking-success-rate-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "BookingSuccessRate"
  namespace           = "HandShakeMe/Business"
  period              = "900" # 15 minutes
  statistic           = "Average"
  threshold           = "80" # 80%
  alarm_description   = "This metric monitors booking success rate"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Type        = "Business"
  }
}

# High SMS Failure Rate
resource "aws_cloudwatch_metric_alarm" "high_sms_failure_rate" {
  alarm_name          = "high-sms-failure-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SMSFailureRate"
  namespace           = "HandShakeMe/SMS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10" # 10%
  alarm_description   = "This metric monitors SMS failure rate"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Type        = "SMS"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "HandShakeMe-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "handshake-instant-booking-kg-${var.environment}"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Instant Booking Lambda Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.main.name],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "UserErrors", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", aws_apigatewayv2_api.main.name],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."],
            [".", "IntegrationLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 18
        width  = 24
        height = 6

        properties = {
          query   = "SOURCE '/aws/lambda/handshake-instant-booking-kg-${var.environment}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20"
          region  = var.aws_region
          title   = "Recent Errors"
        }
      }
    ]
  })
}

# Log Groups with Retention
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "instant-booking-kg",
    "telegram-login",
    "create-order",
    "send-sms-kg"
  ])

  name              = "/aws/lambda/handshake-${each.key}-${var.environment}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Environment = var.environment
    Function    = each.key
  }
}

# Variables for monitoring
variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
  default     = "alerts@handshakeme.kg"
}

# Outputs
output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}