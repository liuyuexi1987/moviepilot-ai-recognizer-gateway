# v2.1.0 发布文案

## 标题

moviepilot-ai-recognizer-gateway v2.1.0

## 一句话版本说明

v2.1.0 正式移除 OpenClaw / `external_recognizer` 路径，网关只保留直接调用 LLM 的主链路，整体更轻、更快、更容易部署。

## 适合写在 Release 里的更新摘要

- 移除 OpenClaw / `external_recognizer` 兼容路径
- 网关后端收敛为单一 `direct_llm`
- 精简环境变量和 Docker Compose 示例
- 推荐接口调整为 `NVIDIA NIM` / `SiliconFlow`
- 健康检查与接口返回统一为单一后端语义
- 默认发布标签更新为 `2.1.0`

## 发布说明正文

这个版本的目标很简单：把 MoviePilot AI 识别网关继续做减法。

在前面的实践里，OpenClaw 这条兼容链路虽然保留了扩展性，但实际部署成本更高、反馈速度更慢，对多数 NAS 用户来说并没有带来足够收益。因此从 `v2.1.0` 开始，项目只保留 `direct_llm` 方案，直接面向 OpenAI 兼容的 Chat Completions 接口工作。

这样做之后，整个网关有几个直接变化：

- 配置项更少，不再需要 `RECOGNIZER_MODE`
- 不再需要额外维护 OpenClaw / 外部识别端地址
- 健康检查、日志和接口返回都围绕单一后端展开
- Docker 部署文档更简单，默认路径更清晰
- 默认示例改为更贴近实际使用的 NVIDIA / SiliconFlow 兼容接口

如果你之前已经在使用 `direct_llm`，升级到这个版本会更轻松；如果你之前依赖 OpenClaw，则需要改为直接配置你的 LLM 提供商兼容接口。

## Docker 镜像示例

```bash
docker build -t liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0 .
docker push liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0
```
