# =============================================================================
# AWS Secrets Manager
# =============================================================================

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${local.name_prefix}-jwt-secret"
  description = "JWT secret for token signing"

  tags = {
    Name = "${local.name_prefix}-jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    JWT_SECRET = random_password.jwt_secret.result
  })
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# IAM policy for Lambda to read secrets
resource "aws_iam_role_policy" "lambda_secrets" {
  name = "${local.name_prefix}-lambda-secrets-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.jwt_secret.arn
      }
    ]
  })
}

# Data source to read JWT secret value
data "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id  = aws_secretsmanager_secret.jwt_secret.id
  depends_on = [aws_secretsmanager_secret_version.jwt_secret]
}
