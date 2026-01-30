# AWS Lambda + EventBridge Setup Guide

## Overview

This setup uses AWS EventBridge to trigger a Lambda function daily, which calls your API to run follow-up reminders.

## Architecture

```
EventBridge Rule (daily schedule)
    ↓
Lambda Function (followupHandler)
    ↓
Your API Endpoint (/api/cron/followup)
    ↓
Follow-up Service (sends emails)
```

---

## Step 1: Configure Environment Variables

Add to your `.env` file:

```bash
# Generate a secure token: openssl rand -hex 32
CRON_SECRET_TOKEN=your-secure-random-token-here
SESSION_SECRET=your-session-secret-here
```

---

## Step 2: Deploy Lambda Function

### Option A: Using AWS Console

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `followup-reminder-trigger`
5. Runtime: `Node.js 20.x`
6. Click "Create function"
7. Copy contents of `lambda/followupHandler.js` to the code editor
8. Configure environment variables:
   - `API_URL`: `https://your-domain.com` (your app URL)
   - `API_SECRET_TOKEN`: Same value as `CRON_SECRET_TOKEN` in your .env
9. Click "Deploy"

### Option B: Using AWS CLI

```bash
# Package the Lambda function
cd lambda
zip -r followupHandler.zip followupHandler.js

# Create Lambda function
aws lambda create-function \
  --function-name followup-reminder-trigger \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler followupHandler.handler \
  --zip-file fileb://followupHandler.zip \
  --timeout 30 \
  --environment Variables="{API_URL=https://your-domain.com,API_SECRET_TOKEN=your-token-here}"
```

---

## Step 3: Create EventBridge Rule

### Using AWS Console

1. Go to Amazon EventBridge Console
2. Click "Rules" → "Create rule"
3. Name: `daily-followup-reminder`
4. Description: `Triggers follow-up reminders daily at 9 AM UTC`
5. Rule type: `Schedule`
6. Schedule pattern: `Cron expression`
7. Cron expression: `0 9 * * ? *` (9 AM UTC daily)
   - Or use `0 14 * * ? *` for 9 AM EST (2 PM UTC)
8. Target: `AWS Lambda function`
9. Function: `followup-reminder-trigger`
10. Click "Create"

### Using AWS CLI

```bash
# Create EventBridge rule
aws events put-rule \
  --name daily-followup-reminder \
  --description "Triggers follow-up reminders daily at 9 AM UTC" \
  --schedule-expression "cron(0 9 * * ? *)"

# Add Lambda as target
aws events put-targets \
  --rule daily-followup-reminder \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:followup-reminder-trigger"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name followup-reminder-trigger \
  --statement-id AllowEventBridgeInvoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/daily-followup-reminder
```

---

## Step 4: IAM Role for Lambda

Create an IAM role with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

Trust relationship:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

---

## Step 5: Test the Setup

### Test Cron Endpoint Manually

```bash
curl -X POST https://your-domain.com/api/cron/followup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-cron-secret-token"
```

### Test Lambda Function

In AWS Lambda Console:

1. Click "Test" button
2. Create test event with empty JSON: `{}`
3. Click "Test"
4. Check CloudWatch Logs for output

---

## Cron Expression Reference

```
cron(Minutes Hours Day-of-month Month Day-of-week Year)

Examples:
- cron(0 9 * * ? *)    - Every day at 9 AM UTC
- cron(0 14 * * ? *)   - Every day at 2 PM UTC (9 AM EST)
- cron(0 9 * * MON *)  - Every Monday at 9 AM UTC
- cron(0 */6 * * ? *)  - Every 6 hours
- cron(0 9,17 * * ? *) - Every day at 9 AM and 5 PM UTC
```

---

## Monitoring

### CloudWatch Logs

- Lambda logs: `/aws/lambda/followup-reminder-trigger`
- Check for errors or successful executions

### Your Application Logs

Check your server logs for:

```
"Follow-up cron job triggered at: [timestamp]"
"Follow-up reminders processed"
```

---

## Security Notes

1. **Never commit** `CRON_SECRET_TOKEN` to version control
2. Use **HTTPS** for your API endpoint
3. Rotate the secret token periodically
4. Monitor for unauthorized access attempts in your logs
5. Consider adding **IP whitelist** if Lambda has static IP (via NAT Gateway)

---

## Cost Estimate

- **Lambda**: ~$0.0000002 per request (virtually free)
- **EventBridge**: Free for first 1M events/month
- **Estimated monthly cost**: < $0.01

---

## Troubleshooting

### Lambda times out

- Increase timeout in Lambda settings (default 3s → 30s)
- Check your API response time

### Lambda returns 403

- Verify `CRON_SECRET_TOKEN` matches in both Lambda env and your .env
- Check Authorization header format

### No emails sent

- Check your followup service logs
- Verify SMTP credentials
- Ensure inquiries exist that match the criteria

---

## Alternative: Manual Testing

Test the endpoint anytime:

```bash
# From your local machine or another server
curl -X POST http://localhost:3000/api/cron/followup \
  -H "Authorization: Bearer $(grep CRON_SECRET_TOKEN .env | cut -d '=' -f2)"
```
