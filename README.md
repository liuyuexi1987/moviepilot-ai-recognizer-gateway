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

当前推荐 DockerHub 镜像：

```text
liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.2
```

支持架构：

- `linux/amd64`
- `linux/arm64`

---

## 和官方插件的区别

MoviePilot 官方已有一类“直接填 OpenAI / 千问兼容接口”的插件，适合轻量用户直接做 AI 辅助识别。

这个项目更适合下面这些情况：

- 原生识别失败后，希望再走一条更完整的补救链路
- 需要 TMDB 二次复核，而不是只信模型返回结果
- 需要异步回调和二次整理
- 需要保留 OpenClaw / 外部识别端兼容能力

简单理解：

- 官方插件更像“轻量 AI 辅助识别”
- 这个项目更像“识别失败后的增强闭环”

## Docker 部署

推荐方式：

- MoviePilot 与 Gateway 同机部署
- 小白用户优先使用宿主机内网地址
- 熟悉 Docker 网络后，再考虑改成同一网络下的容器名互通

两种常见写法：

- 方案 A：同一 Docker 网络，直接写容器名
- 方案 B：直接写宿主机内网地址

### 方案 1：direct_llm

适合：

- 直接接千问 / OpenAI 兼容接口
- 不想单独部署 OpenClaw

`docker-compose.direct-llm.yml`

```yaml
services:
  moviepilot-ai-recognizer-gateway:
    image: liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.2
    container_name: moviepilot-ai-recognizer-gateway
    environment:
      PORT: "9000"
      MP_BASE_URL: "http://192.168.x.x:3000" # 小白推荐直接写 MoviePilot 的宿主机内网地址和外部端口；熟悉 Docker 网络后也可改成 http://moviepilot-v2:3001；不要写 127.0.0.1
      MP_API_KEY: "replace_with_moviepilot_api_key" # 改成你的 MoviePilot API Key
      RECOGNIZER_MODE: "direct_llm"
      LLM_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1" # 改成你的 OpenAI 兼容接口根路径
      LLM_API_KEY: "replace_with_llm_api_key" # 改成你的大模型 API Key
      LLM_MODEL: "qwen-plus" # 推荐先用 qwen-plus
      LLM_TEMPERATURE: "0.1" # 温度越低越保守，越容易稳定输出 JSON；不懂就保持 0.1
      LLM_ENABLE_THINKING: "false" # 推荐保持 false，稳定输出 JSON
      TMDB_API_KEY: "replace_with_tmdb_api_key" # 改成你的 TMDB API Key
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

### 方案 2：OpenClaw / external_recognizer

适合：

- 你已经有 OpenClaw
- 或你有自己的外部识别端

`docker-compose.openclaw.yml`

```yaml
services:
  moviepilot-ai-recognizer-gateway:
    image: liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.2
    container_name: moviepilot-ai-recognizer-gateway
    environment:
      PORT: "9000"
      MP_BASE_URL: "http://192.168.x.x:3000" # 小白推荐直接写 MoviePilot 的宿主机内网地址和外部端口；熟悉 Docker 网络后也可改成 http://moviepilot-v2:3001；不要写 127.0.0.1
      MP_API_KEY: "replace_with_moviepilot_api_key" # 改成你的 MoviePilot API Key
      RECOGNIZER_MODE: "external_recognizer"
      OPENCLAW_RECOGNIZE_URL: "http://192.168.x.x:19000/recognize" # 这里不是固定可用地址，必须改成你自己已经部署好并能访问的 OpenClaw / 外部识别端 HTTP 接口
      TMDB_API_KEY: "replace_with_tmdb_api_key" # 推荐保留，用于最终 TMDB 复核
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
docker compose -f docker-compose.openclaw.yml up -d
```

两种方案启动后，插件里一般都填写这个 Webhook 地址：

```text
http://192.168.x.x:9000/webhook
```

如果你熟悉 Docker 网络，并且 MoviePilot 与 Gateway 在同一网络中，也可以写容器名：

```text
http://moviepilot-ai-recognizer-gateway:9000/webhook
```

`MP_BASE_URL` 推荐这样理解：

- 方案 A：`http://moviepilot-v2:3001`
  - 适用于 MoviePilot 和 Gateway 在同一 Docker 网络
- 方案 B（小白推荐）：`http://192.168.x.x:3000`
  - 适用于不折腾 Docker 网络名，直接用 MoviePilot 宿主机内网地址和外部端口
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

如果你想走 OpenClaw 方案，最少需要改这两项：

```yaml
RECOGNIZER_MODE: "external_recognizer"
OPENCLAW_RECOGNIZE_URL: "http://你的-openclaw-识别端/recognize"
```

这时：

- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

可以先不使用。

注意：

- OpenClaw 不是必须
- 不是把 `OPENCLAW_RECOGNIZE_URL` 原样填上就能用
- 你必须先自己把 OpenClaw 或其他外部识别端部署好，并确认这个 HTTP 地址真的能返回识别 JSON
- 如果你没有现成的 OpenClaw，直接用 `direct_llm` 更省事

---

## 说明

- 默认推荐 `direct_llm`
- 默认推荐同机 Docker 部署
- 不建议把跨主机 / 跨 NAS 作为默认方案
- 配置了 `TMDB_API_KEY` 后，最终 `tmdb_id` 以 TMDB 复核结果为准

---

## 文档

- [docker-compose.direct-llm.yml](./docker-compose.direct-llm.yml)
- [docker-compose.openclaw.yml](./docker-compose.openclaw.yml)
- [docker-compose.example.yml](./docker-compose.example.yml)
- [千问快速测试](./docs/QWEN_QUICKSTART.md)
- [DockerHub 发布说明](./docs/DOCKERHUB_PUBLISH.md)
- [Release 检查清单](./docs/RELEASE_CHECKLIST.md)
- [LLM 后端规范](./docs/LLM_BACKEND_SPEC.md)
- [提供商兼容说明](./docs/PROVIDER_GUIDE.md)
