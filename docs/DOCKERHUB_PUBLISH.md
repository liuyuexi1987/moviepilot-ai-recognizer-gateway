# DockerHub Publish Guide

## Recommended Repository

- GitHub repo:
  - `moviepilot-ai-recognizer-gateway`
- DockerHub image:
  - `liuyuexi1987/moviepilot-ai-recognizer-gateway`

## Recommended Tags

- `2.0.0-alpha.1`
- `latest` only after a stable release

## Manual Build Example

```bash
docker build -t liuyuexi1987/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1 .
```

## Manual Push Example

```bash
docker push liuyuexi1987/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1
```

## Recommended Initial Policy

- push alpha tags explicitly
- do not point `latest` to alpha releases
- document `direct_llm` as primary mode
- document `external_recognizer` as compatibility mode
