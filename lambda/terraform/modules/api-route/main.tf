variable "api_id" {
  type = string
}

variable "route_key" {
  type = string
}

variable "lambda_function" {
  type = any
}

variable "name_prefix" {
  type = string
}

variable "require_auth" {
  type    = bool
  default = false
}

variable "authorizer_id" {
  type    = string
  default = ""
}

resource "aws_apigatewayv2_integration" "this" {
  api_id                 = var.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_function.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "this" {
  api_id             = var.api_id
  route_key          = var.route_key
  target             = "integrations/${aws_apigatewayv2_integration.this.id}"
  authorization_type = var.require_auth ? "JWT" : "NONE"
  authorizer_id      = var.require_auth ? var.authorizer_id : null
}

resource "aws_lambda_permission" "this" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_id}/*/*"
}
