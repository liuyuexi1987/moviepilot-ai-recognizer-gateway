#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_REPO="${IMAGE_REPO:-liuyuexi/moviepilot-ai-recognizer-gateway}"
IMAGE_TAG="${IMAGE_TAG:-2.0.0-alpha.1}"
FULL_IMAGE="${IMAGE_REPO}:${IMAGE_TAG}"
PUSH_IMAGE="false"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER_NAME="${BUILDER_NAME:-moviepilot-ai-recognizer-gateway-builder}"

if [ "${1:-}" = "--push" ]; then
  PUSH_IMAGE="true"
fi

ensure_builder() {
  if docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
    docker buildx use "$BUILDER_NAME" >/dev/null
  else
    echo "未找到多架构 builder，正在创建：$BUILDER_NAME"
    docker buildx create --name "$BUILDER_NAME" --driver docker-container --use >/dev/null
  fi

  docker buildx inspect "$BUILDER_NAME" --bootstrap >/dev/null
}

echo "准备构建多架构镜像：$FULL_IMAGE"
echo "目标平台：$PLATFORMS"

if [ "$PUSH_IMAGE" = "true" ]; then
  ensure_builder

  echo
  echo "开始使用 buildx 构建并推送多架构镜像：$FULL_IMAGE"
  docker buildx build \
    --builder "$BUILDER_NAME" \
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
