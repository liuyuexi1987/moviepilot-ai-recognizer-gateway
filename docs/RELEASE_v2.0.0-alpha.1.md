# v2.0.0-alpha.1 发布文案

## GitHub Release

### Tag version

```text
v2.0.0-alpha.1
```

### Release title

```text
v2.0.0-alpha.1 首个可运行版本（direct_llm 主路径）
```

### 是否勾选 Pre-release

建议：

- 勾选

因为当前版本仍属于 `alpha` 阶段。

### 是否设置为 latest release

建议：

- GitHub Release 可以正常发布
- 但 DockerHub 暂时不要推 `latest`

### 是否上传附件

建议：

- 不强制上传二进制附件

原因：

- 网关仓库的核心交付物是 Docker 镜像
- GitHub Release 主要承担版本说明作用
- 真正安装时更推荐拉 DockerHub 镜像

### Release Notes

```md
## v2.0.0-alpha.1 首个可运行版本（direct_llm 主路径）

这是 `moviepilot-ai-recognizer-gateway` 的首个 `v2.0` alpha 版本。

本版本的目标，是把 MoviePilot AI 识别补救链路收敛成一个更适合 NAS 用户部署的独立网关镜像，并以 `direct_llm` 作为默认主路径。

## 本版本包含

- Docker 化网关服务
- `direct_llm` 模式
- `external_recognizer` 兼容模式
- `/webhook` 异步处理链路
- `/recognize` 本地测试接口
- 千问兼容接口联调示例
- TMDB 复核与补全逻辑

## 本版本验证情况

已完成以下验证：

- 本地 `node server.js` 运行验证
- Docker 镜像构建验证
- 容器启动与 `/healthz` 验证
- 容器内 `direct_llm` 识别验证
- 标准电影标题识别验证
- 标准剧集标题识别验证
- 拼音规避命名增强识别验证

## 当前推荐模式

### direct_llm

这是当前主推模式，适合：

- 没有 OpenClaw 的 NAS 用户
- 希望直接填写大模型 API Key 后使用的用户
- 以 DockerHub 镜像方式部署的用户

### external_recognizer

这是兼容模式，适合：

- 已经有 OpenClaw 的用户
- 已有外部识别服务的用户
- 需要保留自定义识别流程的用户

## 重要说明

- 当配置 `TMDB_API_KEY` 时，最终返回的 `tmdb_id` 以 TMDB 复核结果为准
- 模型即使返回了非 0 `tmdb_id`，也不会直接作为最终真值
- 当前不建议将 alpha 版本推送为 `latest`

## 已知状态

- `direct_llm` 已可用
- 千问兼容接口已完成基础实测
- `external_recognizer` 为兼容保留路径
- 当前仍属于 alpha 阶段，后续还会继续收敛配置和文档

## 后续方向

- 完善 DockerHub 发布流程
- 增加更多提供商兼容说明
- 优化 MoviePilot 插件侧 `v2.0` 对接
- 继续推进插件仓库独立发布
```

## DockerHub 首发命令

### 构建

```bash
docker build -t liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1 .
```

### 推送

```bash
docker push liuyuexi/moviepilot-ai-recognizer-gateway:2.0.0-alpha.1
```

## 首发建议

- 本次只推：
  - `2.0.0-alpha.1`
- 暂时不要推：
  - `latest`
- GitHub Release 标题和 DockerHub tag 保持一致
- 发版前至少再做一次容器级 `/recognize` 验证
- Release 页面建议直接引用这份文案，不需要再单独维护另一套说明
