# Provider Guide

## Recommended First-Class Provider Types

For `v2.1`, documentation should explicitly prioritize:

1. NVIDIA NIM
2. SiliconFlow
3. OpenAI / OpenRouter

This keeps the docs closer to the project's real-world usage.

## Why Not Claim Universal Support

Many providers say they are "OpenAI-compatible", but differences still appear in:

- model naming
- timeout behavior
- JSON output discipline
- support for optional parameters
- response shape edge cases

So the recommended wording is:

> The gateway is designed for OpenAI-compatible Chat Completions APIs and is currently best recommended with NVIDIA NIM, SiliconFlow, OpenAI, and OpenRouter style endpoints.

## Documentation Recommendation

Use this split in docs:

- officially recommended
- theoretically compatible but not fully verified

That keeps expectations realistic.

## Provider Config Examples

### NVIDIA NIM style

```env
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_API_KEY=your_api_key
LLM_MODEL=qwen/qwen3-5-122b-a10b
```

Recommended note:

- The NVIDIA-hosted `qwen/qwen3-5-122b-a10b` is a good first model to try for this gateway.
- Free trial availability may change over time; users should confirm current quotas on the provider side.

### SiliconFlow style

```env
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_API_KEY=your_api_key
LLM_MODEL=copy_from_siliconflow_model_square
```

Recommended note:

- SiliconFlow is a good fallback when users want low-cost or temporarily free OpenAI-compatible models.
- Free models and quotas can change, so docs should avoid hard-coding long-lived "free forever" claims.

### Other compatible providers

```env
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your_api_key
LLM_MODEL=gpt-4o-mini
```
