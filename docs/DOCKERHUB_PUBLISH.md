# DockerHub 发布说明

## 目标仓库

- GitHub：
  - `moviepilot-ai-recognizer-gateway`
- DockerHub：
  - `liuyuexi/moviepilot-ai-recognizer-gateway`

## 推荐标签策略

当前版本建议直接使用：

- `2.1.0`
- `latest`

## 为什么现在建议同步更新 latest

当前 `v2.1.0` 已经把后端收敛成单一路径：

- 只保留 `direct_llm`
- 配置字段更少
- 更适合作为默认稳定镜像

当前这个版本已经是稳定收口版，DockerHub 建议同时维护版本 tag 和 `latest`。

## 手工构建

如果只验证当前本机架构：

```bash
docker build -t liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0 .
docker tag liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0 liuyuexi/moviepilot-ai-recognizer-gateway:latest
```

或者直接使用脚本：

```bash
bash scripts/dockerhub-release.sh
```

说明：

- 脚本默认按 `linux/amd64,linux/arm64` 构建
- 不带 `--push` 时只做本地构建
- 带 `--push` 时会自动创建并使用 `docker-container` 类型的 buildx builder（如本机尚未配置）

## 本地验证

```bash
docker run --rm \
  --env-file .env \
  -p 19090:9000 \
  liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0
```

另开一个终端验证：

```bash
curl -s http://127.0.0.1:19090/healthz
```

## 推送镜像

```bash
docker push liuyuexi/moviepilot-ai-recognizer-gateway:2.1.0
docker push liuyuexi/moviepilot-ai-recognizer-gateway:latest
```

或者使用脚本直接构建并推送多架构镜像：

```bash
bash scripts/dockerhub-release.sh --push
```

推送完成后，同一个 tag 将同时支持：

- `linux/amd64`
- `linux/arm64`

## 发布前建议检查

先确认你已经登录 DockerHub：

```bash
docker login
```

再执行：

```bash
bash scripts/pre-release-check.sh
```

## 首发阶段建议

- 明确写清楚当前版本只保留 `direct_llm`
- Release 文案里写清楚轻量化目标和 OpenClaw 移除原因
- 稳定版同步更新 DockerHub `latest`
- 至少做一次容器级 `/recognize` 实测再发版
