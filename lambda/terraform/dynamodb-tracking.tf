# DynamoDB Tables for Location Tracking

# Location Tracking Sessions Table
resource "aws_dynamodb_table" "location_tracking" {
  name           = "${var.environment}-location-tracking"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  attribute {
    name = "gsi2pk"
    type = "S"
  }

  attribute {
    name = "gsi2sk"
    type = "S"
  }

  # GSI1: Query by master and status
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
  }

  # GSI2: Query by booking/project
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "gsi2pk"
    range_key       = "gsi2sk"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.environment}-location-tracking"
    Environment = var.environment
    Service     = "tracking"
  }
}

# Location Updates Table
resource "aws_dynamodb_table" "location_updates" {
  name           = "${var.environment}-location-updates"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  # GSI1: Query by update ID
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.environment}-location-updates"
    Environment = var.environment
    Service     = "tracking"
  }
}

# Tracking Events Table
resource "aws_dynamodb_table" "tracking_events" {
  name           = "${var.environment}-tracking-events"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  # GSI1: Query by event ID and type
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
    write_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? 5 : null
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.environment}-tracking-events"
    Environment = var.environment
    Service     = "tracking"
  }
}

# Geocoding Cache Table
resource "aws_dynamodb_table" "geocoding_cache" {
  name           = "${var.environment}-geocoding-cache"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.environment}-geocoding-cache"
    Environment = var.environment
    Service     = "tracking"
  }
}

# Maps Usage Table
resource "aws_dynamodb_table" "maps_usage" {
  name           = "${var.environment}-maps-usage"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  # GSI1: Query by action and date
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
  }

  tags = {
    Name        = "${var.environment}-maps-usage"
    Environment = var.environment
    Service     = "tracking"
  }
}
