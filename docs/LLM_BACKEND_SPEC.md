# LLM Backend Spec

## Goal

Define a stable direct-LLM backend contract for `v2.1`.

This backend is intended to work with **OpenAI-compatible Chat Completions APIs**.

## Supported Backend

### `direct_llm`

The gateway directly calls a provider that exposes an OpenAI-compatible chat-completions endpoint.

## Required Environment Variables

### Shared

- `PORT`
- `MP_BASE_URL`
- `MP_API_KEY`
- `RECOGNIZER_TIMEOUT_MS`

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

### Optional

- `TMDB_API_KEY`

## Expected OpenAI-Compatible Request Shape

```http
POST {LLM_BASE_URL}/chat/completions
Authorization: Bearer {LLM_API_KEY}
Content-Type: application/json
```

Body:

```json
{
  "model": "qwen/qwen3.5-122b-a10b",
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

v2.1 should describe the gateway as:

> Compatible with most OpenAI-compatible Chat Completions APIs.

Avoid claiming that all providers are fully identical.

## Recommended Providers To Mention In Docs

Initial recommended providers:

- OpenAI
- Qwen compatible endpoints
- OpenRouter

Other providers may work if they expose a sufficiently compatible Chat Completions API.
