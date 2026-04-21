# v2.1.1 发布文案

## 标题

moviepilot-ai-recognizer-gateway v2.1.1

## 一句话版本说明

v2.1.1 在纯 LLM 主链路的基础上继续补强性能，重点压缩 TMDB 长尾等待，并优化重复识别场景。

## 适合写在 Release 里的更新摘要

- 保持单一 `direct_llm` 后端
- 为 TMDB 查询增加短超时，避免长时间挂起
- 增加 TMDB 查询缓存和识别结果缓存
- 对相同标题的并发识别请求做去重
- 日志新增 `llm / tmdb / total / cache hit` 阶段信息

## 发布说明正文

这个版本不是功能扩展，而是一次很实用的性能收口。

在 `v2.1.0` 去掉 OpenClaw 之后，网关主链路已经足够轻。但实际跑下来，长尾延迟主要集中在两个地方：一是 TMDB 查询偶尔会卡很久，二是同一个标题在短时间内重复识别时，会重复消耗上游 LLM 和 TMDB 调用。

所以 `v2.1.1` 的重点就是把这两类浪费压下去：

- TMDB 查询现在有更短的超时保护，失败会更快进入后续路径
- 同标题识别结果会做短期缓存，重复请求可以直接命中
- TMDB 查询结果也会缓存，减少重复复核
- 相同标题如果正在识别中，会复用同一条 in-flight 请求

这让 webhook 和重复整理场景的体感改善会比较明显。冷启动仍然取决于上游 LLM 和 TMDB 的当时状态，但重复请求已经可以快很多。

## Docker 镜像示例

```bash
docker build -t liuyuexi/moviepilot-ai-recognizer-gateway:2.1.1 .
docker push liuyuexi/moviepilot-ai-recognizer-gateway:2.1.1
```
