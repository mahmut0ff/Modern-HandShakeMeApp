@echo off
REM Setup local DynamoDB table for development

echo ================================================
echo Setting up local DynamoDB table
echo ================================================
echo.

REM Check if DynamoDB Local is running
echo Checking if DynamoDB Local is running on port 8000...
curl -s http://localhost:8000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: DynamoDB Local is not running on port 8000
    echo.
    echo Please start DynamoDB Local first:
    echo   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
    echo.
    echo Or using Docker:
    echo   docker run -p 8000:8000 amazon/dynamodb-local
    echo.
    pause
    exit /b 1
)

echo DynamoDB Local is running!
echo.

REM Delete existing table if it exists
echo Deleting existing table (if exists)...
aws dynamodb delete-table ^
    --table-name handshakeme-local ^
    --endpoint-url http://localhost:8000 ^
    --region us-east-1 ^
    >nul 2>&1

timeout /t 2 /nobreak >nul

REM Create new table
echo Creating table: handshakeme-local...
aws dynamodb create-table ^
    --cli-input-json file://create-table.json ^
    --endpoint-url http://localhost:8000 ^
    --region us-east-1

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo SUCCESS: Table created successfully!
    echo ================================================
    echo.
    echo Table name: handshakeme-local
    echo Endpoint: http://localhost:8000
    echo.
    echo You can now run your application.
) else (
    echo.
    echo ERROR: Failed to create table
    echo.
    echo Make sure:
    echo 1. DynamoDB Local is running
    echo 2. AWS CLI is installed
    echo 3. create-table.json exists
)

echo.
pause
