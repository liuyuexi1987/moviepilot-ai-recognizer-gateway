#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

IMAGE_REPO="${IMAGE_REPO:-liuyuexi/moviepilot-ai-recognizer-gateway}"
IMAGE_TAG="${IMAGE_TAG:-2.0.0-alpha.1}"
FULL_IMAGE="${IMAGE_REPO}:${IMAGE_TAG}"
PUSH_IMAGE="false"

if [ "${1:-}" = "--push" ]; then
  PUSH_IMAGE="true"
fi

echo "准备构建镜像：$FULL_IMAGE"

docker build -t "$FULL_IMAGE" .

echo
echo "镜像构建完成：$FULL_IMAGE"

if [ "$PUSH_IMAGE" = "true" ]; then
  echo
  echo "开始推送镜像：$FULL_IMAGE"
  docker push "$FULL_IMAGE"
  echo "镜像推送完成。"
else
  echo
  echo "当前为本地构建模式，未执行 push。"
  echo "如需推送，请执行："
  echo "bash scripts/dockerhub-alpha-release.sh --push"
fi
