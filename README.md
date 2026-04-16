# moviepilot-ai-recognizer-gateway

一个给 MoviePilot 用的 AI 识别网关，面向 NAS 用户设计。

从 `v2.1.0` 开始，项目只保留 `direct_llm` 路径，不再维护 OpenClaw / `external_recognizer` 那一套。目标很明确：部署更轻、依赖更少、响应更快。

当前推荐 DockerHub 镜像：

```text
liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0
liuyuexi/moviepilot-ai-recognizer-gateway:latest
```

支持架构：

- `linux/amd64`
- `linux/arm64`

## 工作方式

- MoviePilot 原生 TMDB 识别失败
- 插件把标题转发到这个 Gateway
- Gateway 直接调用大模型识别
- Gateway 用 TMDB 再做一次复核
- Gateway 回调 MoviePilot，触发二次整理

## 为什么现在只保留 LLM

- OpenClaw 链路额外增加了一层网络和处理开销
- 实际反馈速度慢，收益不明显
- 对 NAS 用户来说，单一 LLM 后端更容易部署和排障
- 配置项更少，维护成本更低

## 推荐接口

当前更推荐这两类 OpenAI 兼容接口：

- `NVIDIA NIM`
- `SiliconFlow`

推荐理由：

- 我们实际用下来速度和可用性都更合适
- 对这个项目来说，直接接 OpenAI 兼容接口最省事
- NVIDIA 上的 `qwen/qwen3-5-122b-a10b` 目前实测效果不错，适合作为优先尝试的模型

说明：

- “免费接口 / 免费模型 / 免费额度” 会变化，建议以平台当期页面为准
- 项目仍兼容其他 OpenAI 兼容接口，只是不再把千问官方端点作为特别推荐项

## Docker 部署

推荐方式：

- MoviePilot 与 Gateway 同机部署
- 小白用户优先使用宿主机内网地址
- 熟悉 Docker 网络后，再改成同一网络下的容器名互通

常见写法：

- 方案 A：同一 Docker 网络，直接写容器名
- 方案 B：直接写宿主机内网地址

`docker-compose.direct-llm.yml`

```yaml
services:
  moviepilot-ai-recognizer-gateway:
    image: liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0
    container_name: moviepilot-ai-recognizer-gateway
    environment:
      PORT: "9000"
      MP_BASE_URL: "http://192.168.x.x:3000" # 小白推荐直接写 MoviePilot 的宿主机内网地址和外部端口；熟悉 Docker 网络后也可改成 http://moviepilot-v2:3001；不要写 127.0.0.1
      MP_API_KEY: "replace_with_moviepilot_api_key"
      LLM_BASE_URL: "https://integrate.api.nvidia.com/v1"
      LLM_API_KEY: "replace_with_llm_api_key"
      LLM_MODEL: "qwen/qwen3-5-122b-a10b"
      LLM_TEMPERATURE: "0.1"
      LLM_ENABLE_THINKING: "false"
      TMDB_API_KEY: "replace_with_tmdb_api_key"
      RECOGNIZER_TIMEOUT_MS: "60000"
    ports:
      - "9000:9000"
    restart: unless-stopped
    networks:
      - moviepilot

networks:
  moviepilot:
    external: true
    name: moviepilot
```

启动命令：

```bash
docker compose -f docker-compose.direct-llm.yml up -d
```

启动后，插件里一般填写这个 Webhook 地址：

```text
http://192.168.x.x:9000/webhook
```

如果你熟悉 Docker 网络，并且 MoviePilot 与 Gateway 在同一网络中，也可以写容器名：

```text
http://moviepilot-ai-recognizer-gateway:9000/webhook
```

`MP_BASE_URL` 推荐这样理解：

- 方案 A：`http://moviepilot-v2:3001`
- 方案 B（小白推荐）：`http://192.168.x.x:3000`
- 不推荐：`http://127.0.0.1:3001`

## 需要改的地方

- `MP_BASE_URL`
- `MP_API_KEY`
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `TMDB_API_KEY`

说明：

- 默认只支持 OpenAI 兼容的 Chat Completions 接口
- 当前文档优先推荐 `NVIDIA NIM` 和 `SiliconFlow`
- 配置了 `TMDB_API_KEY` 后，最终 `tmdb_id` 以 TMDB 复核结果为准
- `LLM_ENABLE_THINKING` 建议保持 `false`，更容易稳定输出 JSON

## 文档

- [docker-compose.direct-llm.yml](./docker-compose.direct-llm.yml)
- [docker-compose.example.yml](./docker-compose.example.yml)
- [LLM 快速测试](./docs/LLM_QUICKSTART.md)
- [DockerHub 发布说明](./docs/DOCKERHUB_PUBLISH.md)
- [Release 检查清单](./docs/RELEASE_CHECKLIST.md)
- [LLM 后端规范](./docs/LLM_BACKEND_SPEC.md)
- [提供商兼容说明](./docs/PROVIDER_GUIDE.md)
