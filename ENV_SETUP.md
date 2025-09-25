# Environment Setup for SommelAI App

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# OpenAI API Key (for GPT-4o-mini chat and GPT-4o vision)
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB Connection String
MONGODB_URI=your_mongodb_connection_string_here

# AWS S3 Configuration (for image storage)
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=your_aws_region_here
BUCKET=your_s3_bucket_name_here

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## How to Get These Keys

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Required for: Chat functionality (GPT-4o-mini), Image analysis (GPT-4o vision)
   - Cost: $0.15 per 1M input tokens, $0.60 per 1M output tokens (GPT-4o-mini)

2. **MongoDB URI**: Get from [MongoDB Atlas](https://cloud.mongodb.com/)
   - Required for: User data, preferences, wine journal entries

3. **AWS S3**: Get from [AWS Console](https://aws.amazon.com/s3/)
   - Required for: Storing wine bottle images and menu photos

4. **Stripe**: Get from [Stripe Dashboard](https://dashboard.stripe.com/)
   - Required for: Payment processing and subscription management

## Model Information

- **GPT-4o-mini**: Used for chat functionality
  - Fast, cost-effective, always available
  - 128K context window, 16K max output tokens
  - October 2024 knowledge cutoff
  - Supports text and structured outputs

- **GPT-4o**: Used for vision functionality
  - Advanced vision capabilities for image analysis
  - 128K context window, 16K max output tokens
  - October 2024 knowledge cutoff
  - Supports images, text, and structured outputs

- **GPT-4o-mini**: Also used for web search functionality
  - Fast web search capabilities
  - Can search the internet for current information
  - Returns structured data with citations
  - Perfect for finding wine stores and current wine prices

