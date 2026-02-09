# Setup Local DynamoDB

## Quick Start

```bash
cd lambda
npm run setup:dynamodb
```

## Prerequisites

### 1. Install DynamoDB Local

**Option A: Using Docker (Recommended)**
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

**Option B: Download JAR**
1. Download from: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html
2. Extract and run:
```bash
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

### 2. Install AWS CLI (Optional)

For manual table management:
```bash
# Windows (using Chocolatey)
choco install awscli

# Mac
brew install awscli

# Linux
pip install awscli
```

## Setup Methods

### Method 1: NPM Script (Easiest)

```bash
cd lambda
npm run setup:dynamodb
```

### Method 2: Node.js Script

```bash
cd lambda
node scripts/setup-dynamodb.js
```

### Method 3: Shell Script

**Windows:**
```bash
cd lambda
scripts\setup-local-dynamodb.bat
```

**Linux/Mac:**
```bash
cd lambda
bash scripts/setup-local-dynamodb.sh
```

### Method 4: AWS CLI (Manual)

```bash
cd lambda

# Delete existing table (if exists)
aws dynamodb delete-table \
    --table-name handshakeme-local \
    --endpoint-url http://localhost:8000 \
    --region us-east-1

# Create table
aws dynamodb create-table \
    --cli-input-json file://create-table.json \
    --endpoint-url http://localhost:8000 \
    --region us-east-1
```

## Verify Setup

### Check if table exists:
```bash
aws dynamodb list-tables \
    --endpoint-url http://localhost:8000 \
    --region us-east-1
```

### Describe table:
```bash
aws dynamodb describe-table \
    --table-name handshakeme-local \
    --endpoint-url http://localhost:8000 \
    --region us-east-1
```

## Troubleshooting

### Error: "Cannot do operations on a non-existent table"

**Solution:** Run setup script
```bash
npm run setup:dynamodb
```

### Error: "Connection refused"

**Problem:** DynamoDB Local is not running

**Solution:** Start DynamoDB Local
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

### Error: "Table already exists"

**Solution:** Delete and recreate
```bash
aws dynamodb delete-table \
    --table-name handshakeme-local \
    --endpoint-url http://localhost:8000 \
    --region us-east-1

npm run setup:dynamodb
```

## Table Structure

The table includes:
- **Primary Key:** PK (Hash), SK (Range)
- **GSI1:** For user-based queries
- **GSI2:** For status-based queries
- **GSI3:** For client-based queries
- **Billing Mode:** PAY_PER_REQUEST (on-demand)

## Environment Variables

Make sure `.env` has:
```env
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=handshakeme-local
AWS_REGION=us-east-1
```

## Next Steps

After setup:
1. Start your application: `npm start`
2. Run tests: `npm test`
3. Check logs for successful connection

## Production Setup

For production, use AWS DynamoDB:
1. Remove `DYNAMODB_ENDPOINT` from environment
2. Set proper AWS credentials
3. Use production table name
4. Enable backups and point-in-time recovery
