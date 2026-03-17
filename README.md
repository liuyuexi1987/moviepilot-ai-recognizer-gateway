# moviepilot-ai-recognizer-gateway

一个给 MoviePilot 用的 AI 识别网关，面向 NAS 用户设计。

作用很简单：

- MoviePilot 原生 TMDB 识别失败
- 插件把标题转发到这个 Gateway
- Gateway 调用大模型识别
- Gateway 再回调 MoviePilot，触发二次整理

当前主推模式：

- `direct_llm`

兼容保留模式：

- `external_recognizer`

当前 DockerHub 镜像：

```text
liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1
```

支持架构：

- `linux/amd64`
- `linux/arm64`

---

## Docker 部署

推荐方式：

- MoviePilot 与 Gateway 同机部署
- 同一 Docker 网络中互通

两种常见写法：

- 方案 A：同一 Docker 网络，直接写容器名
- 方案 B：没有自定义网络名时，直接写宿主机内网地址

最常用的 `docker compose` 示例：

```yaml
services:
  moviepilot-ai-recognizer-gateway:
    image: liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1
    container_name: moviepilot-ai-recognizer-gateway
    environment:
      PORT: "9000"
      MP_BASE_URL: "http://moviepilot-v2:3001" # 方案A：同一 Docker 网络写容器名；方案B：改成宿主机内网地址；不要写 127.0.0.1
      MP_API_KEY: "replace_with_moviepilot_api_key" # 改成你的 MoviePilot API Key
      RECOGNIZER_MODE: "direct_llm" # 默认推荐 direct_llm
      LLM_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1" # 改成你的 OpenAI 兼容接口根路径
      LLM_API_KEY: "replace_with_llm_api_key" # 改成你的大模型 API Key
      LLM_MODEL: "qwen-plus" # 可改成你实际使用的模型
      LLM_TEMPERATURE: "0.1"
      LLM_ENABLE_THINKING: "false"
      TMDB_API_KEY: "replace_with_tmdb_api_key" # 改成你的 TMDB API Key
      OPENCLAW_RECOGNIZE_URL: "http://openclaw-recognizer:19000/recognize" # 仅 external_recognizer 模式使用
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
docker compose up -d
```

插件里一般填写这个 Webhook 地址：

```text
http://moviepilot-ai-recognizer-gateway:9000/webhook
```

如果你没有自定义 Docker 网络名，也可以在插件里直接填宿主机内网地址：

```text
http://192.168.x.x:9000/webhook
```

`MP_BASE_URL` 推荐这样理解：

- 方案 A：`http://moviepilot-v2:3001`
  - 适用于 MoviePilot 和 Gateway 在同一 Docker 网络
- 方案 B：`http://192.168.x.x:3001`
  - 适用于没有自定义网络名，或不在同一 Docker 网络，但宿主机地址对 Gateway 容器可达
- 不推荐：`http://127.0.0.1:3001`
  - 容器内的 `127.0.0.1` 通常指向 Gateway 容器自己，不是 MoviePilot

---

## 需要改的地方

- `MP_BASE_URL`
- `MP_API_KEY`
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `TMDB_API_KEY`

如果你已经有自己的 OpenClaw / 外部识别端，也可以改成：

- `RECOGNIZER_MODE=external_recognizer`
- `OPENCLAW_RECOGNIZE_URL=你的识别端地址`

---

## 说明

- 默认推荐 `direct_llm`
- 默认推荐同机 Docker / 同网络部署
- 不建议把跨主机 / 跨 NAS 作为默认方案
- 配置了 `TMDB_API_KEY` 后，最终 `tmdb_id` 以 TMDB 复核结果为准

---

## 文档

- [docker-compose.example.yml](./docker-compose.example.yml)
- [千问快速测试](./docs/QWEN_QUICKSTART.md)
- [DockerHub 发布说明](./docs/DOCKERHUB_PUBLISH.md)
- [Release 检查清单](./docs/RELEASE_CHECKLIST.md)
- [LLM 后端规范](./docs/LLM_BACKEND_SPEC.md)
- [提供商兼容说明](./docs/PROVIDER_GUIDE.md)
