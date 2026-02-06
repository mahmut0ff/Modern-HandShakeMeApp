# Create DynamoDB Local table for HandShakeMe

$TableName = "handshakeme-local"
$Endpoint = "http://localhost:8000"

Write-Host "`n=== Creating DynamoDB Table ===" -ForegroundColor Cyan

# Check if table exists
$tables = aws dynamodb list-tables --endpoint-url $Endpoint 2>$null | ConvertFrom-Json

if ($tables.TableNames -contains $TableName) {
    Write-Host "Table '$TableName' already exists" -ForegroundColor Yellow
    exit 0
}

# Create JSON file for GSI (GSI1, GSI2, GSI3)
$gsiJson = '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"GSI1PK","KeyType":"HASH"},{"AttributeName":"GSI1SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}},{"IndexName":"GSI2","KeySchema":[{"AttributeName":"GSI2PK","KeyType":"HASH"},{"AttributeName":"GSI2SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}},{"IndexName":"GSI3","KeySchema":[{"AttributeName":"GSI3PK","KeyType":"HASH"},{"AttributeName":"GSI3SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}}]'

$gsiFile = "$env:TEMP\dynamodb-gsi.json"
[System.IO.File]::WriteAllText($gsiFile, $gsiJson)

# Create table
aws dynamodb create-table `
    --table-name $TableName `
    --attribute-definitions `
        AttributeName=PK,AttributeType=S `
        AttributeName=SK,AttributeType=S `
        AttributeName=GSI1PK,AttributeType=S `
        AttributeName=GSI1SK,AttributeType=S `
        AttributeName=GSI2PK,AttributeType=S `
        AttributeName=GSI2SK,AttributeType=S `
        AttributeName=GSI3PK,AttributeType=S `
        AttributeName=GSI3SK,AttributeType=S `
    --key-schema `
        AttributeName=PK,KeyType=HASH `
        AttributeName=SK,KeyType=RANGE `
    --global-secondary-indexes file://$gsiFile `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
    --endpoint-url $Endpoint

Remove-Item $gsiFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nTable '$TableName' created with GSI1, GSI2, GSI3!" -ForegroundColor Green
} else {
    Write-Host "`nFailed to create table" -ForegroundColor Red
}
