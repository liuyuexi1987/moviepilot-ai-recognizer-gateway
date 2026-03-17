# moviepilot-ai-recognizer-gateway

一个面向 NAS 用户的 MoviePilot AI 识别网关服务。

这个仓库的目标是把 MoviePilot 的 AI 识别补救链路做成一个可以直接 `docker pull`、填写环境变量、然后启动使用的独立网关镜像。

`v2.0` 的核心方向是：

- 默认主推 **直接大模型 API 模式**
- 保留 **OpenClaw / 外部识别端兼容模式**
- 降低 NAS 用户接入门槛
- 让 DockerHub 分发更自然

## 这个仓库解决什么问题

当 MoviePilot 原生 TMDB 识别失败时，插件会把标题转发给这个 Gateway。

Gateway 会：

1. 立即返回 `202 Accepted`
2. 在后台执行 AI 识别
3. 根据需要补做 TMDB 校验或补全
4. 回调 MoviePilot 插件接口
5. 让插件继续触发二次整理

这样可以避免 MoviePilot 在等待大模型时同步超时，也更适合 NAS 场景下的异步处理。

## 主要特性

- 接收 MoviePilot Webhook 请求
- 立即返回 `202 Accepted`
- 后台异步识别
- 支持两种后端模式：
  - `direct_llm`
  - `external_recognizer`
- 可选 TMDB 校验 / 补全
- 配置 `TMDB_API_KEY` 时，最终返回的 `tmdb_id` 以 TMDB 复核结果为准，不直接信任模型输出的编号
- 自动回调 MoviePilot 插件 API

## 后端模式

### 1. `direct_llm`

这是 `v2.0` 的主推模式。

Gateway 直接调用 **OpenAI 兼容的 Chat Completions API**，例如：

- OpenAI
- 千问兼容接口
- OpenRouter

这也是最适合 NAS 用户的模式，因为：

- 不需要先安装 OpenClaw
- 不需要宿主机桥接脚本
- 更适合 DockerHub 镜像分发

### 2. `external_recognizer`

这是兼容模式。

Gateway 不直接调用大模型，而是把识别请求转发给用户自己提供的外部识别端。这个外部识别端可以由：

- OpenClaw
- 自定义 AI 服务
- 其他兼容服务

来实现。

这个模式的价值在于：

- 兼容已经在用 OpenClaw 的用户
- 保留更复杂的自定义识别能力
- 降低从 `v1` 迁移到 `v2` 的阻力

## 关于跨主机 / 跨 NAS

跨主机部署不是不支持，但不建议作为默认推荐方案。

在实际开发和联调过程中，这类场景更容易出现：

- 容器地址与宿主机地址混淆
- 容器名无法跨主机解析
- 回调方向与识别方向不一致
- 网络可达但请求超时
- NAS 厂商之间的 Docker 网络行为差异

因此 `v2.0` 文档默认更推荐：

- MoviePilot 与 Gateway 同机部署
- 同一 Docker 网络内互通
- 跨主机仅作为进阶部署方式

## DockerHub 使用方式

目标体验应该是：

1. `docker pull` 镜像
2. 直接修改 compose 里的环境变量
3. 启动容器
4. 在 MoviePilot 插件里填写 Gateway 地址

## Docker Compose 快速启动

仓库已提供 compose 示例文件：

- [docker-compose.example.yml](./docker-compose.example.yml)

推荐步骤：

1. 打开 `docker-compose.example.yml`
2. 直接修改其中的 `environment` 配置
3. 至少填好 `MP_API_KEY`、`LLM_API_KEY`、`TMDB_API_KEY`
4. 使用示例 compose 启动

示例命令：

```bash
docker compose -f docker-compose.example.yml up -d
```

如果你更喜欢把敏感信息单独放到 `.env` 文件里，也可以继续参考：

- [`.env.example`](./.env.example)
- [`.env.qwen.example`](./.env.qwen.example)

默认示例适用于：

- MoviePilot 与 Gateway 同机
- 两者都加入 `moviepilot` Docker 网络

启动后，插件中的 Webhook 地址一般填写：

```text
http://moviepilot-ai-recognizer-gateway:9000/webhook
```

## 发布前检查

发布前建议执行：

```bash
bash scripts/pre-release-check.sh
```

如果要准备 DockerHub alpha 镜像，也可以直接执行：

```bash
bash scripts/dockerhub-alpha-release.sh
```

当前脚本默认按多架构构建：

- `linux/amd64`
- `linux/arm64`

执行 `--push` 时，脚本会自动准备可用的 buildx 多架构 builder。

## 推荐镜像名

```text
liuyuexi/moviepilot-ai-recognizer-gateway
```

## 推荐仓库信息

- 仓库名：
  - `moviepilot-ai-recognizer-gateway`
- 仓库描述：
  - `Dockerized MoviePilot AI recognition gateway for NAS users, with direct LLM and OpenClaw-compatible modes`

## 文档入口

- [Docker Compose 示例](./docker-compose.example.yml)
- [DockerHub 发布说明](./docs/DOCKERHUB_PUBLISH.md)
- [v2.0.0-alpha.1 发布文案](./docs/RELEASE_v2.0.0-alpha.1.md)
- [Release 检查清单](./docs/RELEASE_CHECKLIST.md)
- [千问快速测试](./docs/QWEN_QUICKSTART.md)
- [LLM 后端规范](./docs/LLM_BACKEND_SPEC.md)
- [提供商兼容说明](./docs/PROVIDER_GUIDE.md)

## 当前定位

当前仓库处于 `v2.0.0-alpha.1` 阶段，重点是先把：

- 目录结构
- 配置方式
- 双后端路线
- DockerHub 分发思路

这些基础能力收稳。

后续重点会放在：

- 把 `direct_llm` 路径做成真正可跑的默认实现
- 优先验证千问兼容接口
- 再逐步补 OpenAI / OpenRouter 等兼容提供商
