#!/bin/bash

# Lambda Deployment Script
# This script packages and deploys the Lambda function to AWS

set -e

echo "🔧 Packaging Lambda function..."

# Clean up old zip if exists
rm -f followup-lambda.zip

# Create deployment package (no node_modules needed - using built-in modules only)
zip -r followup-lambda.zip followupHandler.js package.json

echo "📦 Package created: followup-lambda.zip"
echo ""
echo "📋 File contents:"
unzip -l followup-lambda.zip

echo ""
echo "✅ Lambda function ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda"
echo "2. Create or update function: followup-reminder-trigger"
echo "3. Upload followup-lambda.zip"
echo "4. Set environment variables:"
echo "   - API_URL: https://your-domain.com"
echo "   - API_SECRET_TOKEN: 416635511a6aab7f01dc2a9239487dd36f2ec30298dd77d37d38065ecae775ec"
echo ""
echo "Or deploy via AWS CLI:"
echo "aws lambda update-function-code --function-name followup-reminder-trigger --zip-file fileb://followup-lambda.zip"
