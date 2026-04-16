# LLM 快速测试

这个文档用于快速验证当前唯一的 LLM 路径是否可用。

当前文档优先推荐：

- `NVIDIA NIM`
- `SiliconFlow`

## 1. 准备配置

最简单的做法，是**直接编辑 `docker-compose.example.yml` 里的 `environment:`**。

至少把这几个值改成你自己的：

- `MP_API_KEY`
- `LLM_API_KEY`
- `TMDB_API_KEY`
- `LLM_ENABLE_THINKING=false`

如果你更喜欢把配置单独放到 `.env` 文件，再用模板方式也可以：

复制示例文件：

```bash
cp .env.llm.example .env
```

然后至少填写：

- `MP_API_KEY`
- `LLM_API_KEY`
- `TMDB_API_KEY`
- `LLM_ENABLE_THINKING=false`

其中最重要的是：

- `LLM_API_KEY`
- `TMDB_API_KEY`

如果你只是先测试 `/recognize`，暂时没有 MoviePilot，也可以先只填：

- `LLM_API_KEY`
- `TMDB_API_KEY`

如果你使用的是 SiliconFlow 或其他兼容端点，也可以把：

- `LLM_BASE_URL`

改成实际可用的根路径，例如：

- `https://api.siliconflow.cn/v1`

如果你不确定怎么填，推荐先保持这些默认值不动：

- `LLM_BASE_URL=https://integrate.api.nvidia.com/v1`
- `LLM_MODEL=qwen/qwen3-5-122b-a10b`
- `LLM_TEMPERATURE=0.1`
- `LLM_ENABLE_THINKING=false`

## 2. 启动网关

```bash
docker compose -f docker-compose.example.yml up -d
```

或者直接本地运行：

```bash
npm ci
node server.js
```

## 3. 健康检查

```bash
curl -s http://127.0.0.1:9000/healthz
```

预期会看到：

- `ok: true`
- `backend: direct_llm`

## 4. 直接测试识别

```bash
curl -s http://127.0.0.1:9000/recognize \
  -H "Content-Type: application/json" \
  -d '{"title":"警察故事（1985）.mkv","recognize_mode":"standard"}'
```

## 5. 增强模式测试

```bash
curl -s http://127.0.0.1:9000/recognize \
  -H "Content-Type: application/json" \
  -d '{"title":"jing cha gu shi 1985.mkv","recognize_mode":"enhanced"}'
```

## 6. 成功标准

至少应满足：

- 返回 `success: true`
- `result.name` 有值
- `result.type` 为 `movie` 或 `tv`
- 如果 TMDB 匹配成功，`result.tmdb_id` 为非 0
- 如果配置了 `TMDB_API_KEY`，最终 `result.tmdb_id` 应以网关日志里的 TMDB 复核结果为准，而不是模型原始输出

## 7. 如果识别失败，优先检查

1. `LLM_API_KEY` 是否正确
2. `LLM_BASE_URL` 是否是兼容接口根路径，而不是完整 `/chat/completions`
3. `LLM_MODEL` 是否存在
4. `TMDB_API_KEY` 是否可用
5. `LLM_ENABLE_THINKING` 是否关闭，结构化 JSON 识别建议使用 `false`
6. 网关日志里是否出现：
   - `direct llm returned ...`
   - `TMDB 未命中 ...`

## 8. 最适合 NAS 用户的默认组合

如果你只是想先尽快跑通，推荐直接用下面这组配置思路：

- `LLM_BASE_URL=https://integrate.api.nvidia.com/v1`
- `LLM_MODEL=qwen/qwen3-5-122b-a10b`
- `LLM_ENABLE_THINKING=false`
- `TMDB_API_KEY` 必填
- MoviePilot 与 Gateway 同机部署，并加入同一 Docker 网络
