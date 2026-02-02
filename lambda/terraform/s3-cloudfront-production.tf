# Production S3 and CloudFront Configuration for HandShakeMe
# Optimized for performance, security, and cost efficiency

# S3 Buckets for different content types
locals {
  s3_buckets = {
    avatars = {
      name_suffix = "avatars"
      purpose     = "User profile avatars"
      public_read = false
      lifecycle_rules = [
        {
          id              = "avatar_lifecycle"
          status          = "Enabled"
          expiration_days = null
          transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            },
            {
              days          = 90
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    
    orders = {
      name_suffix = "orders"
      purpose     = "Order attachments and files"
      public_read = false
      lifecycle_rules = [
        {
          id              = "orders_lifecycle"
          status          = "Enabled"
          expiration_days = null
          transitions = [
            {
              days          = 60
              storage_class = "STANDARD_IA"
            },
            {
              days          = 180
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    
    chat = {
      name_suffix = "chat"
      purpose     = "Chat images and files"
      public_read = false
      lifecycle_rules = [
        {
          id              = "chat_lifecycle"
          status          = "Enabled"
          expiration_days = 365  # Delete chat files after 1 year
          transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            },
            {
              days          = 90
              storage_class = "GLACIER"
            }
          ]
        }
      ]
    }
    
    static = {
      name_suffix = "static"
      purpose     = "Static assets (CSS, JS, images)"
      public_read = true
      lifecycle_rules = [
        {
          id              = "static_lifecycle"
          status          = "Enabled"
          expiration_days = null
          transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            }
          ]
        }
      ]
    }
  }
}

# S3 Buckets
resource "aws_s3_bucket" "buckets" {
  for_each = local.s3_buckets
  
  bucket = "${var.s3_bucket_prefix}-${each.value.name_suffix}"
  
  tags = merge(var.tags, {
    Name    = "${var.s3_bucket_prefix}-${each.value.name_suffix}"
    Purpose = each.value.purpose
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "buckets" {
  for_each = local.s3_buckets
  
  bucket = aws_s3_bucket.buckets[each.key].id
  versioning_configuration {
    status = var.s3_enable_versioning ? "Enabled" : "Disabled"
  }
}

# S3 Bucket Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = local.s3_buckets
  
  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = local.s3_buckets
  
  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = !each.value.public_read
  block_public_policy     = !each.value.public_read
  ignore_public_acls      = !each.value.public_read
  restrict_public_buckets = !each.value.public_read
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "buckets" {
  for_each = { for k, v in local.s3_buckets : k => v if var.s3_lifecycle_enabled }
  
  bucket = aws_s3_bucket.buckets[each.key].id

  dynamic "rule" {
    for_each = each.value.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.status

      filter {
        prefix = ""
      }

      dynamic "transition" {
        for_each = rule.value.transitions
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [rule.value.expiration_days] : []
        content {
          days = expiration.value
        }
      }

      # Clean up incomplete multipart uploads
      abort_incomplete_multipart_upload {
        days_after_initiation = 7
      }

      # Clean up old versions
      noncurrent_version_expiration {
        noncurrent_days = 90
      }
    }
  }
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name    = "${var.project_name}-s3-key-${var.environment}"
    Purpose = "S3 Encryption"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.project_name}-s3-${var.environment}"
  target_key_id = aws_kms_key.s3.key_id
}

# S3 Bucket Policy for static assets (public read)
resource "aws_s3_bucket_policy" "static_public_read" {
  bucket = aws_s3_bucket.buckets["static"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.buckets["static"].arn}/*"
      }
    ]
  })
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.project_name}-s3-oac-${var.environment}"
  description                       = "OAC for S3 buckets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  comment             = "HandShakeMe CDN for ${var.environment}"
  default_root_object = "index.html"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"  # Use only North America and Europe
  
  # Origins for different S3 buckets
  dynamic "origin" {
    for_each = local.s3_buckets
    content {
      domain_name              = aws_s3_bucket.buckets[origin.key].bucket_regional_domain_name
      origin_id                = "S3-${origin.key}"
      origin_access_control_id = aws_cloudfront_origin_access_control.s3.id

      s3_origin_config {
        origin_access_identity = ""
      }
    }
  }

  # Default cache behavior (for static assets)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-static"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 31536000 # 1 year
  }

  # Cache behavior for avatars
  ordered_cache_behavior {
    path_pattern           = "/avatars/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-avatars"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400    # 1 day
    max_ttl     = 31536000 # 1 year
  }

  # Cache behavior for order files (shorter cache)
  ordered_cache_behavior {
    path_pattern           = "/orders/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-orders"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true  # May need query parameters for signed URLs
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600     # 1 hour
    max_ttl     = 86400    # 1 day
  }

  # Cache behavior for chat files (very short cache)
  ordered_cache_behavior {
    path_pattern           = "/chat/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-chat"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 300      # 5 minutes
    max_ttl     = 3600     # 1 hour
  }

  # Geographic restrictions (optional)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate - use CloudFront default if no valid ACM certificate provided
  viewer_certificate {
    cloudfront_default_certificate = var.ssl_certificate_arn == "" || var.ssl_certificate_arn == "ssl-arn" ? true : false
    acm_certificate_arn            = var.ssl_certificate_arn != "" && var.ssl_certificate_arn != "ssl-arn" ? var.ssl_certificate_arn : null
    ssl_support_method             = var.ssl_certificate_arn != "" && var.ssl_certificate_arn != "ssl-arn" ? "sni-only" : null
    minimum_protocol_version       = var.ssl_certificate_arn != "" && var.ssl_certificate_arn != "ssl-arn" ? "TLSv1.2_2021" : "TLSv1"
  }

  # Custom domain - only if valid SSL certificate is provided
  aliases = var.ssl_certificate_arn != "" && var.ssl_certificate_arn != "ssl-arn" ? [var.cdn_domain] : []

  # Logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-cdn-${var.environment}"
  })
}

# S3 Bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.s3_bucket_prefix}-cloudfront-logs"

  tags = merge(var.tags, {
    Name    = "${var.s3_bucket_prefix}-cloudfront-logs"
    Purpose = "CloudFront Access Logs"
  })
}

# CloudFront logs bucket lifecycle
resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "cloudfront_logs_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90  # Delete logs after 90 days
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Route 53 Record for CDN Domain - only if zone_id is provided
resource "aws_route53_record" "cdn" {
  count   = var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.cdn_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# S3 Bucket Notifications - disabled until Lambda function is deployed
# resource "aws_s3_bucket_notification" "file_processing" {
#   bucket = aws_s3_bucket.buckets["orders"].id
#
#   lambda_function {
#     lambda_function_arn = aws_lambda_function.functions["process-uploaded-file"].arn
#     events              = ["s3:ObjectCreated:*"]
#     filter_prefix       = "uploads/"
#     filter_suffix       = ""
#   }
#
#   depends_on = [aws_lambda_permission.s3_invoke]
# }

# Lambda permission for S3 to invoke file processing - disabled until Lambda function is deployed
# resource "aws_lambda_permission" "s3_invoke" {
#   statement_id  = "AllowExecutionFromS3Bucket"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.functions["process-uploaded-file"].function_name
#   principal     = "s3.amazonaws.com"
#   source_arn    = aws_s3_bucket.buckets["orders"].arn
# }

# Outputs
output "s3_bucket_names" {
  description = "Names of S3 buckets"
  value = {
    for k, v in aws_s3_bucket.buckets : k => v.bucket
  }
}

output "s3_bucket_arns" {
  description = "ARNs of S3 buckets"
  value = {
    for k, v in aws_s3_bucket.buckets : k => v.arn
  }
}

output "cloudfront_distribution_id" {
  description = "ID of CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "Domain name of CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cdn_url" {
  description = "CDN URL"
  value       = "https://${var.cdn_domain}"
}

# Create individual bucket outputs for easy reference
output "avatars_bucket" {
  description = "Avatars S3 bucket name"
  value       = aws_s3_bucket.buckets["avatars"].bucket
}

output "orders_bucket" {
  description = "Orders S3 bucket name"  
  value       = aws_s3_bucket.buckets["orders"].bucket
}

output "chat_bucket" {
  description = "Chat S3 bucket name"
  value       = aws_s3_bucket.buckets["chat"].bucket
}

output "static_bucket" {
  description = "Static assets S3 bucket name"
  value       = aws_s3_bucket.buckets["static"].bucket
}