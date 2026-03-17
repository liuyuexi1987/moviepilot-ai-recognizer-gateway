# 千问快速测试

这个文档用于快速验证 `direct_llm` 路径是否可用。

## 1. 准备环境变量

复制示例文件：

```bash
cp .env.qwen.example .env
```

然后填写：

- `MP_API_KEY`
- `LLM_API_KEY`
- `TMDB_API_KEY`
- `LLM_ENABLE_THINKING=false`

如果你只是先测试 `/recognize`，暂时没有 MoviePilot，也可以先只填：

- `LLM_API_KEY`
- `TMDB_API_KEY`

如果你使用的是百炼 Coding Plan / OpenClaw 当前使用的那类端点，也可以把：

- `LLM_BASE_URL`

改成实际可用的根路径，例如：

- `https://coding.dashscope.aliyuncs.com/v1`

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
- `recognizer_mode: direct_llm`

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
