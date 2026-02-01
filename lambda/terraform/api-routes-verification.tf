# Verification API Routes

# GET /verification/requirements - Get verification requirements
resource "aws_apigatewayv2_route" "get_verification_requirements" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /verification/requirements"
  target    = "integrations/${aws_apigatewayv2_integration.get_verification_requirements.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_verification_requirements" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_verification_requirements.invoke_arn
  payload_format_version = "2.0"
}

# GET /verification/status - Get verification status
resource "aws_apigatewayv2_route" "get_verification_status" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /verification/status"
  target    = "integrations/${aws_apigatewayv2_integration.get_verification_status.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_verification_status" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_verification_status.invoke_arn
  payload_format_version = "2.0"
}

# POST /verification/documents - Upload verification documents
resource "aws_apigatewayv2_route" "upload_verification_documents" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /verification/documents"
  target    = "integrations/${aws_apigatewayv2_integration.upload_verification_documents.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "upload_verification_documents" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.upload_verification_documents.invoke_arn
  payload_format_version = "2.0"
}

# POST /verification/submit - Submit verification for review
resource "aws_apigatewayv2_route" "submit_verification_review" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /verification/submit"
  target    = "integrations/${aws_apigatewayv2_integration.submit_verification_review.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "submit_verification_review" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.submit_verification_review.invoke_arn
  payload_format_version = "2.0"
}
