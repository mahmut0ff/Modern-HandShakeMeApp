# Deployment Scripts

## Prerequisites

- Node.js 20+
- Terraform 1.6+
- AWS CLI configured with credentials
- `jq` (for JSON parsing)

## Deploy

Deploy the entire application (backend + frontend):

```bash
./scripts/deploy.sh
```

### Options

```bash
# Deploy to production with auto-approve
./scripts/deploy.sh -e prod -y

# Deploy only backend
./scripts/deploy.sh --backend-only

# Deploy only frontend (requires existing backend)
./scripts/deploy.sh --frontend-only

# Specify AWS region
./scripts/deploy.sh -r us-west-2
```

### Environment Variables

You can also set these environment variables:

```bash
export ENVIRONMENT=prod
export AWS_REGION=us-west-2
export AUTO_APPROVE=true
./scripts/deploy.sh
```

## Destroy

Tear down all resources:

```bash
./scripts/destroy.sh
```

With auto-approve:

```bash
AUTO_APPROVE=true ./scripts/destroy.sh
```

## What Gets Deployed

### Backend
- DynamoDB table (single-table design)
- Cognito User Pool (passwordless phone auth)
- API Gateway HTTP API
- Lambda functions (19 handlers)
- CloudWatch Log Groups
- IAM roles and policies

### Frontend
- AWS Amplify Hosting (automatic HTTPS, global CDN)
- Built React app with Vite

### Terraform State
- S3 bucket for remote state (`handshake-terraform-state-{account_id}`)
- Versioning enabled for state protection
- Server-side encryption enabled
- Separate state files per environment (`dev/terraform.tfstate`, `prod/terraform.tfstate`)

## Outputs

After deployment, outputs are saved to `terraform-outputs.json`:

```json
{
  "api_url": "https://xxx.execute-api.us-east-1.amazonaws.com/dev",
  "cognito_user_pool_id": "us-east-1_xxx",
  "cognito_client_id": "xxx",
  "dynamodb_table_name": "handshake-dev-table",
  "aws_region": "us-east-1",
  "environment": "dev"
}
```

## Cost Estimate

For low traffic (~1000 users/month):

| Service | Monthly Cost |
|---------|-------------|
| DynamoDB (on-demand) | ~$1-5 |
| Lambda | ~$0 (free tier) |
| API Gateway | ~$1-3 |
| Cognito | ~$0 (free tier) |
| Amplify Hosting | ~$0 (free tier: 5GB/month) |
| SNS (SMS) | ~$0.01/SMS |
| **Total** | **~$5-10/month** |
