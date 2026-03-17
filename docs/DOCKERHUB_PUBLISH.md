# DockerHub 发布说明

## 目标仓库

- GitHub：
  - `moviepilot-ai-recognizer-gateway`
- DockerHub：
  - `liuyuexi/moviepilot-ai-recognizer-gateway`

## 推荐标签策略

首发阶段建议这样发：

- `2.0.0-alpha.1`
- `2.0.0-alpha.2`
- `2.0.0-beta.1`

只有在第一个稳定版发布后，才开始使用：

- `2.0.0`
- `latest`

## 为什么不建议一开始就推 latest

当前 `v2.0` 仍在快速迭代：

- `direct_llm` 是主路径
- `external_recognizer` 是兼容路径
- 配置字段和日志语义还在收敛

如果过早把 alpha 版指向 `latest`，对 NAS 用户不够友好。

## 手工构建

如果只验证当前本机架构：

```bash
docker build -t liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1 .
```

或者直接使用脚本：

```bash
bash scripts/dockerhub-alpha-release.sh
```

说明：

- 脚本默认按 `linux/amd64,linux/arm64` 构建
- 不带 `--push` 时只做本地构建

## 本地验证

```bash
docker run --rm \
  --env-file .env \
  -p 19090:9000 \
  liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1
```

另开一个终端验证：

```bash
curl -s http://127.0.0.1:19090/healthz
```

## 推送镜像

```bash
docker push liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1
```

或者使用脚本直接构建并推送多架构镜像：

```bash
bash scripts/dockerhub-alpha-release.sh --push
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

- 明确把 `direct_llm` 写成主推模式
- 把 `external_recognizer` 写成兼容模式
- Release 文案里写清楚：`latest` 暂不提供
- 至少做一次容器级 `/recognize` 实测再发版
