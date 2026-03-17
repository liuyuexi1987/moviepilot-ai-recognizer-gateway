# LLM Backend Spec

## Goal

Define a stable direct-LLM backend contract for `v2.0`.

This backend is intended to work with **OpenAI-compatible Chat Completions APIs**.

## Supported Backend Modes

### 1. `direct_llm`

Primary v2.0 mode.

The gateway directly calls a provider that exposes an OpenAI-compatible chat-completions endpoint.

### 2. `external_recognizer`

Compatibility mode.

The gateway delegates recognition to a user-managed external recognizer endpoint, such as an OpenClaw-based service.

## Required Environment Variables

### Shared

- `PORT`
- `MP_BASE_URL`
- `MP_API_KEY`
- `RECOGNIZER_MODE`
- `RECOGNIZER_TIMEOUT_MS`

### For `direct_llm`

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

### Optional For `direct_llm`

- `TMDB_API_KEY`

### For `external_recognizer`

- `OPENCLAW_RECOGNIZE_URL`

## Expected OpenAI-Compatible Request Shape

```http
POST {LLM_BASE_URL}/chat/completions
Authorization: Bearer {LLM_API_KEY}
Content-Type: application/json
```

Body:

```json
{
  "model": "qwen-plus",
  "temperature": 0.1,
  "messages": [
    {
      "role": "system",
      "content": "你是一个严格输出 JSON 的媒体识别助手。"
    },
    {
      "role": "user",
      "content": "..."
    }
  ]
}
```

## Expected Model Behavior

The model should return a response that contains a JSON object with:

```json
{
  "name": "",
  "year": 0,
  "tmdb_id": 0,
  "type": "movie",
  "season": 0,
  "episode": 0
}
```

Notes:

- `tmdb_id` does not need to be accurate from the model side
- the gateway may override or supplement `tmdb_id` with TMDB verification
- `name` should be as close as possible to a standard title

## Compatibility Statement

v2.0 should describe direct LLM mode as:

> Compatible with most OpenAI-compatible Chat Completions APIs.

Avoid claiming that all providers are fully identical.

## Recommended Providers To Mention In Docs

Initial recommended providers:

- OpenAI
- Qwen compatible endpoints
- OpenRouter

Other providers may work if they expose a sufficiently compatible Chat Completions API.
