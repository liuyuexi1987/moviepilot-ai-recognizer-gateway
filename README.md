# moviepilot-ai-recognizer-gateway

Dockerized gateway service for MoviePilot AI recognition fallback.

This repository is designed for DockerHub publishing and NAS-first deployment.

`v2.0` aims to make NAS usage simpler:

- users can `docker pull` the gateway image
- users can choose direct LLM API mode
- OpenClaw becomes optional rather than mandatory

## Main Features

- accepts MoviePilot webhook requests
- returns `202 Accepted` immediately
- performs recognition asynchronously
- supports:
  - direct LLM API mode
  - external recognizer mode
- verifies or supplements recognition via TMDB when configured
- calls MoviePilot callback API after recognition

## Backend Modes

### direct_llm

Primary recommended mode for v2.0.

The gateway directly calls an OpenAI-compatible Chat Completions API, such as:

- OpenAI
- Qwen-compatible endpoints
- OpenRouter

This is the recommended mode for NAS users because it removes the need to install OpenClaw separately.

### external_recognizer

Compatibility mode.

The gateway forwards recognition to a user-managed external recognizer endpoint, which may still be backed by OpenClaw or another custom service.

## Intended DockerHub Flow

Users should be able to:

1. `docker pull` the image
2. set environment variables
3. start the container
4. point the MoviePilot plugin webhook URL to the container

## Minimal v2.0 Direction

Recommended default positioning:

- direct LLM API as the primary documented path
- external recognizer as a compatibility fallback

## Related Docs

- [LLM backend spec](/Volumes/acasis/Downloads/moviepilot-openclaw-forwarder-v2/docs/LLM_BACKEND_SPEC.md)
- [Provider guide](/Volumes/acasis/Downloads/moviepilot-openclaw-forwarder-v2/docs/PROVIDER_GUIDE.md)
- [DockerHub publish guide](/Volumes/acasis/Downloads/moviepilot-openclaw-forwarder-v2/gateway-image-repo/docs/DOCKERHUB_PUBLISH.md)
- [Release checklist](/Volumes/acasis/Downloads/moviepilot-openclaw-forwarder-v2/gateway-image-repo/docs/RELEASE_CHECKLIST.md)

## Recommended image name

```text
liuyuexi1987/moviepilot-ai-recognizer-gateway
```

## Suggested Repository Metadata

- Repository name:
  - `moviepilot-ai-recognizer-gateway`
- Description:
  - `Dockerized MoviePilot AI recognition gateway for NAS users, with direct LLM and OpenClaw-compatible modes`
