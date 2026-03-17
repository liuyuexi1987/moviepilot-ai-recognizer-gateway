# Provider Guide

## Recommended First-Class Provider Types

For `v2.0`, documentation should explicitly prioritize:

1. OpenAI
2. Qwen-compatible endpoints
3. OpenRouter

These three are enough to cover most early users while keeping docs realistic.

## Why Not Claim Universal Support

Many providers say they are "OpenAI-compatible", but differences still appear in:

- model naming
- timeout behavior
- JSON output discipline
- support for optional parameters
- response shape edge cases

So the recommended wording is:

> The gateway is designed for OpenAI-compatible Chat Completions APIs and has the best expected compatibility with OpenAI, Qwen-compatible endpoints, and OpenRouter.

## Documentation Recommendation

Use this split in docs:

- officially recommended
- theoretically compatible but not fully verified

That keeps expectations realistic.

## Provider Config Examples

### OpenAI style

```env
RECOGNIZER_MODE=direct_llm
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-4o-mini
```

### Qwen compatible style

```env
RECOGNIZER_MODE=direct_llm
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=your_api_key
LLM_MODEL=qwen-plus
```

### OpenRouter style

```env
RECOGNIZER_MODE=direct_llm
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=your_api_key
LLM_MODEL=openai/gpt-4o-mini
```
