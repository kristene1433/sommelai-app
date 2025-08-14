# Environment Variables Setup

## Required API Keys

You need to create a `.env` file in your project root with the following variables:

```bash
# OpenAI API Key (for text-to-speech)
OPENAI_API_KEY=your_openai_api_key_here

# HuggingFace API Key (for GPT-OSS-20b chat)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

## How to get the keys:

1. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **HuggingFace API Key**: Get from [HuggingFace Settings](https://huggingface.co/settings/tokens)

## Important Notes:

- The `.env` file is already in `.gitignore` so it won't be committed
- You need both keys because:
  - **HuggingFace**: Used for the main chat functionality (GPT-OSS-20b)
  - **OpenAI**: Used for text-to-speech features
- After creating the `.env` file, restart your development server

