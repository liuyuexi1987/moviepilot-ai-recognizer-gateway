#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_REPO="${IMAGE_REPO:-liuyuexi/moviepilot-ai-recognizer-gateway}"
IMAGE_TAG="${IMAGE_TAG:-2.0.0-alpha.1}"
FULL_IMAGE="${IMAGE_REPO}:${IMAGE_TAG}"
PUSH_IMAGE="false"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

if [ "${1:-}" = "--push" ]; then
  PUSH_IMAGE="true"
fi

echo "准备构建多架构镜像：$FULL_IMAGE"
echo "目标平台：$PLATFORMS"

if [ "$PUSH_IMAGE" = "true" ]; then
  echo
  echo "开始使用 buildx 构建并推送多架构镜像：$FULL_IMAGE"
  docker buildx build \
    --platform "$PLATFORMS" \
    -t "$FULL_IMAGE" \
    --push \
    .
  echo "镜像推送完成。"
else
  LOCAL_PLATFORM="${LOCAL_PLATFORM:-linux/arm64}"

  docker buildx build \
    --platform "$LOCAL_PLATFORM" \
    -t "$FULL_IMAGE" \
    --load \
    .

  echo
  echo "当前为本地构建模式，未执行 push。"
  echo "本地验证平台：$LOCAL_PLATFORM"
  echo "如需推送，请执行："
  echo "bash scripts/dockerhub-alpha-release.sh --push"
fi
