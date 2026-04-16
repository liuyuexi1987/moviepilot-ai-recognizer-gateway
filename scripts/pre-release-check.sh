#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/4] 检查 Git 工作区是否干净..."
if [ -n "$(git status --short)" ]; then
  echo "Git 工作区不干净，请先提交或处理变更。" >&2
  git status --short
  exit 1
fi

echo "[2/4] 检查 Node 语法..."
node --check server.js

echo "[3/4] 检查依赖可安装..."
npm ci >/dev/null

echo "[4/4] 检查镜像可构建..."
docker build -t moviepilot-ai-recognizer-gateway:precheck . >/dev/null

echo
echo "网关仓库发布前检查通过。"
echo "建议发布标签：v2.1.0 / 2.1.0"
