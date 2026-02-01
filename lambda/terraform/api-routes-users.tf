# Users API Routes

# GET /users/me - Get current user
resource "aws_apigatewayv2_route" "get_current_user" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /users/me"
  target    = "integrations/${aws_apigatewayv2_integration.get_current_user.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "get_current_user" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.get_current_user.invoke_arn
  payload_format_version = "2.0"
}

# PATCH /users/me - Update current user
resource "aws_apigatewayv2_route" "update_current_user" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /users/me"
  target    = "integrations/${aws_apigatewayv2_integration.update_current_user.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "update_current_user" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.update_current_user.invoke_arn
  payload_format_version = "2.0"
}

# POST /users/me/avatar - Upload avatar
resource "aws_apigatewayv2_route" "upload_avatar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /users/me/avatar"
  target    = "integrations/${aws_apigatewayv2_integration.upload_avatar.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "upload_avatar" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.upload_avatar.invoke_arn
  payload_format_version = "2.0"
}

# DELETE /users/me/avatar - Delete avatar
resource "aws_apigatewayv2_route" "delete_avatar" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /users/me/avatar"
  target    = "integrations/${aws_apigatewayv2_integration.delete_avatar.id}"
  
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.lambda.id
}

resource "aws_apigatewayv2_integration" "delete_avatar" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  
  integration_uri        = aws_lambda_function.delete_avatar.invoke_arn
  payload_format_version = "2.0"
}
