# Start DynamoDB Local using Docker

$containerName = "dynamodb-local"

# Check if container exists
$existing = docker ps -a --filter "name=$containerName" --format "{{.Names}}" 2>$null

if ($existing -eq $containerName) {
    # Container exists, check if running
    $running = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null
    
    if ($running -eq $containerName) {
        Write-Host "DynamoDB Local is already running" -ForegroundColor Green
    } else {
        Write-Host "Starting existing DynamoDB Local container..." -ForegroundColor Yellow
        docker start $containerName
        Write-Host "DynamoDB Local started" -ForegroundColor Green
    }
} else {
    Write-Host "Creating and starting DynamoDB Local container..." -ForegroundColor Yellow
    docker run -d -p 8000:8000 --name $containerName amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory
    Write-Host "DynamoDB Local started" -ForegroundColor Green
}

Write-Host "`nDynamoDB Local: http://localhost:8000" -ForegroundColor Cyan
