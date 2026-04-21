# Changelog

## v2.1.1

- adds TMDB timeout protection to reduce long-tail request stalls
- caches TMDB lookups and repeated recognition results for faster retries
- deduplicates same-title in-flight recognition work to avoid duplicate upstream calls
- keeps timing logs explicit for `llm`, `tmdb`, `total`, and `cache hit`

## v2.1.0

- removes the `external_recognizer` / OpenClaw compatibility path
- keeps a single `direct_llm` backend to reduce deployment weight and latency
- simplifies env examples, compose files, health output, and release defaults

## v2.0.0-alpha.1

- initial standalone gateway repository skeleton
- supports `direct_llm` mode
- supports `external_recognizer` compatibility mode
- includes DockerHub-oriented env and compose examples
- includes TMDB verification fallback design
