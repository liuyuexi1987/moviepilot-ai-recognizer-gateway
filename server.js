require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = parseInt(process.env.PORT || "9000", 10);
const MP_BASE_URL = process.env.MP_BASE_URL || "";
const MP_API_KEY = process.env.MP_API_KEY || "";
const BACKEND = "direct_llm";
const LLM_BASE_URL = (process.env.LLM_BASE_URL || "").replace(/\/$/, "");
const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const RECOGNIZER_TIMEOUT_MS = parseInt(process.env.RECOGNIZER_TIMEOUT_MS || "60000", 10);
const TMDB_TIMEOUT_MS = parseInt(process.env.TMDB_TIMEOUT_MS || "3500", 10);
const LLM_TEMPERATURE = Number.parseFloat(process.env.LLM_TEMPERATURE || "0.1");
const LLM_ENABLE_THINKING = /^(1|true|yes|on)$/i.test(process.env.LLM_ENABLE_THINKING || "false");
const RECOGNIZE_CACHE_TTL_MS = parseInt(process.env.RECOGNIZE_CACHE_TTL_MS || "900000", 10);
const RECOGNIZE_MISS_CACHE_TTL_MS = parseInt(process.env.RECOGNIZE_MISS_CACHE_TTL_MS || "300000", 10);
const TMDB_CACHE_TTL_MS = parseInt(process.env.TMDB_CACHE_TTL_MS || "21600000", 10);
const TMDB_MISS_CACHE_TTL_MS = parseInt(process.env.TMDB_MISS_CACHE_TTL_MS || "600000", 10);
const CACHE_MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES || "500", 10);

const recognizeCache = new Map();
const tmdbCache = new Map();
const inflightRecognitions = new Map();

function normalizeTitle(t) {
  if (!t) return "";
  return t
    .replace(/\.[^.]+$/, "")
    .replace(/[“”"'`´]+/g, "")
    .replace(/[：:·,，!?！？、（）()\[\]{}]+/g, "")
    .replace(/[\s._-]+/g, "")
    .toLowerCase();
}

function cleanTitle(t) {
  if (!t) return "";
  let s = t.replace(/\.[^.]+$/, "");
  s = s.replace(/\((\d{4})\)/g, " ");
  s = s.replace(/\b(19|20)\d{2}\b/g, " ");
  s = s.replace(/\bS\d{1,2}E\d{1,3}\b/gi, " ");
  s = s.replace(/\bSeason\s*\d+\b/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function sanitizeModelTitle(t) {
  if (!t) return "";
  let s = String(t).trim();
  s = s.replace(/^["'`“”]+|["'`“”]+$/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function extractCoreTitle(t) {
  if (!t) return "";
  let s = t.replace(/\.[^.]+$/, "");
  s = s.replace(/\[[^\]]+\]/g, " ");
  s = s.replace(/\((19|20)\d{2}\)/g, " ");
  s = s.replace(/\bS\d{1,2}E\d{1,3}\b/gi, " ");
  s = s.replace(/\bS\d{1,2}\b/gi, " ");
  s = s.replace(/\bSeason\s*\d+\b/gi, " ");
  s = s.replace(/\b(19|20)\d{2}\b/g, " ");
  s = s.replace(/\b(2160p|1080p|720p|480p|4k|web-dl|webrip|bluray|blu-ray|bdrip|remux|hdrip|hdtv|dvdrip|uhd|hdr10|hdr|dv|nf|dsnp|amzn|web|x264|x265|h\.264|h\.265|hevc|avc|aac|ddp|dts|truehd|atmos|10bit|8bit|multi|audio|audios)\b/gi, " ");
  s = s.replace(/-[A-Za-z0-9._-]+$/g, " ");
  s = s.replace(/[._]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function hasCjk(t) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(t || "");
}

function extractTopLevelJson(text) {
  if (!text) return null;
  let start = -1, depth = 0, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === "\"") inStr = false;
      continue;
    } else if (ch === "\"") {
      inStr = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try { return JSON.parse(candidate); } catch {}
        start = -1;
      }
    }
  }
  return null;
}

function extractJsonFromText(text) {
  if (!text) return null;
  const code = text.match(/```json\s*([\s\S]*?)```/i);
  if (code) {
    try { return JSON.parse(code[1]); } catch {}
  }
  const genericCode = text.match(/```\s*([\s\S]*?)```/i);
  if (genericCode) {
    try { return JSON.parse(genericCode[1]); } catch {}
  }
  return extractTopLevelJson(text);
}

function normalizeRecognizeMode(mode) {
  return mode === "enhanced" ? "enhanced" : "standard";
}

function normalizeResult(data) {
  const result = typeof data === "object" && data ? data : {};
  return {
    name: String(result.name || ""),
    year: Number.parseInt(result.year, 10) || 0,
    tmdb_id: Number.parseInt(result.tmdb_id, 10) || 0,
    type: result.type === "tv" ? "tv" : "movie",
    season: Number.parseInt(result.season, 10) || 0,
    episode: Number.parseInt(result.episode, 10) || 0,
  };
}

function extractTmdbCandidate(data) {
  const result = typeof data === "object" && data ? data : {};
  return Number.parseInt(result.tmdb_id, 10) || 0;
}

function emptyResult() {
  return { name: "", year: 0, tmdb_id: 0, type: "movie", season: 0, episode: 0 };
}

function elapsedSeconds(startTime) {
  return Number(((Date.now() - startTime) / 1000).toFixed(2));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function pruneCache(map) {
  while (map.size > CACHE_MAX_ENTRIES) {
    const oldestKey = map.keys().next().value;
    if (typeof oldestKey === "undefined") break;
    map.delete(oldestKey);
  }
}

function getCacheEntry(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    map.delete(key);
    return null;
  }
  return cloneJson(entry.value);
}

function setCacheEntry(map, key, value, ttlMs) {
  map.set(key, {
    value: cloneJson(value),
    expiresAt: Date.now() + ttlMs,
  });
  pruneCache(map);
}

async function fetchJsonWithTimeout(url, { headers, method = "GET", body, timeoutMs, errorLabel }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    return res;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`${errorLabel} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function formatTimingLog(timings) {
  if (timings?.cache_hit) {
    return "⏱️  识别阶段：cache=hit llm=0s tmdb=0s total=0s";
  }
  return `⏱️  识别阶段：llm=${timings.llm_s}s tmdb=${timings.tmdb_s}s total=${timings.total_s}s`;
}

function formatRecognizeDuration(timings) {
  return timings?.cache_hit ? "cache hit" : `${timings.total_s}s`;
}

function pushQuery(list, seen, label, value) {
  const q = String(value || "").trim();
  if (!q) return;
  const key = normalizeTitle(q);
  if (!key || seen.has(key)) return;
  seen.add(key);
  list.push({ label, value: q });
}

function isSportsOrNewsTitle(t) {
  if (!t) return false;
  const s = t.toLowerCase();
  if (/(news|新闻|新闻联播|晚间新闻|晨间新闻)/i.test(t)) return true;
  if (/(wta|atp|tennis|nba|nfl|mlb|nhl|f1|formula 1|ufc|boxing|wwe|world cup|euros|olympics)/i.test(s)) return true;
  if (/(hdtv|sports|赛事|体育|锦标赛|联赛|季后赛|半决赛|决赛)/i.test(t)) return true;
  return false;
}

function extractYearFromTitle(t) {
  if (!t) return 0;
  const m = t.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : 0;
}

function extractSeasonEpisodeFromTitle(t) {
  if (!t) return { season: 0, episode: 0 };
  const m = t.match(/\bS(\d{1,2})E(\d{1,3})\b/i);
  if (!m) return { season: 0, episode: 0 };
  return {
    season: parseInt(m[1], 10) || 0,
    episode: parseInt(m[2], 10) || 0,
  };
}

function titleMatch(target, candidate) {
  if (!target || !candidate) return false;
  const t = normalizeTitle(target);
  const c = normalizeTitle(candidate);
  if (!t || !c) return false;
  return t === c || t.includes(c) || c.includes(t);
}

async function tmdbSearchOnce(name, year, type, lang) {
  if (!name || !TMDB_API_KEY) return 0;
  const sanitizedName = sanitizeModelTitle(name);
  if (!sanitizedName) return 0;
  const cacheKey = [type, lang, year || 0, normalizeTitle(sanitizedName)].join("|");
  const cachedId = getCacheEntry(tmdbCache, cacheKey);
  if (cachedId !== null) {
    return cachedId;
  }
  const isTv = type === "tv";
  const url = isTv
    ? `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(sanitizedName)}&first_air_date_year=${year || ""}&language=${lang}`
    : `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(sanitizedName)}&year=${year || ""}&language=${lang}`;

  try {
    const res = await fetchJsonWithTimeout(url, {
      timeoutMs: TMDB_TIMEOUT_MS,
      errorLabel: `TMDB search [lang=${lang}, type=${type}, year=${year || 0}, query=${sanitizedName}]`,
    });
    if (!res.ok) {
      const text = await res.text();
      console.log(`TMDB 请求失败 [lang=${lang}, type=${type}, year=${year || 0}, query=${sanitizedName}] -> ${res.status} ${text.slice(0, 200)}`);
      setCacheEntry(tmdbCache, cacheKey, 0, TMDB_MISS_CACHE_TTL_MS);
      return 0;
    }
    const data = await res.json();
    const results = data?.results || [];
    if (!results.length) {
      console.log(`TMDB 空结果 [lang=${lang}, type=${type}, year=${year || 0}, query=${sanitizedName}]`);
      setCacheEntry(tmdbCache, cacheKey, 0, TMDB_MISS_CACHE_TTL_MS);
    }
    for (const r of results) {
      const t1 = isTv ? r.name : r.title;
      const t2 = isTv ? r.original_name : r.original_title;
      if (year) {
        const d = isTv ? r.first_air_date : r.release_date;
        const ry = d ? parseInt(String(d).slice(0, 4), 10) || 0 : 0;
        if (!ry || ry !== year) continue;
      }
      if (t1 && titleMatch(sanitizedName, t1)) {
        setCacheEntry(tmdbCache, cacheKey, r.id || 0, TMDB_CACHE_TTL_MS);
        return r.id || 0;
      }
      if (t2 && titleMatch(sanitizedName, t2)) {
        setCacheEntry(tmdbCache, cacheKey, r.id || 0, TMDB_CACHE_TTL_MS);
        return r.id || 0;
      }
    }
    const sampleTitles = results.slice(0, 3).map((r) => (isTv ? (r.name || r.original_name) : (r.title || r.original_title))).filter(Boolean);
    if (sampleTitles.length) {
      console.log(`TMDB 有结果但未匹配 [lang=${lang}, type=${type}, year=${year || 0}, query=${sanitizedName}] -> ${sampleTitles.join(" | ")}`);
    }
  } catch (error) {
    console.log(`TMDB 查询异常 [lang=${lang}, type=${type}, year=${year || 0}, query=${sanitizedName}] -> ${error.message}`);
  }
  setCacheEntry(tmdbCache, cacheKey, 0, TMDB_MISS_CACHE_TTL_MS);
  return 0;
}

async function tmdbSearch(name, year, type) {
  const langs = hasCjk(name) ? ["zh-CN", "en-US"] : ["en-US", "zh-CN"];
  for (const lang of langs) {
    let id = await tmdbSearchOnce(name, year, type, lang);
    if (id) return id;
    if (year) {
      id = await tmdbSearchOnce(name, 0, type, lang);
      if (id) return id;
    }
  }
  return 0;
}

async function callChatCompletion(messages) {
  if (!LLM_BASE_URL || !LLM_API_KEY || !LLM_MODEL) {
    throw new Error("LLM_BASE_URL / LLM_API_KEY / LLM_MODEL is not fully configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RECOGNIZER_TIMEOUT_MS);
  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: Number.isFinite(LLM_TEMPERATURE) ? LLM_TEMPERATURE : 0.1,
        enable_thinking: LLM_ENABLE_THINKING,
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`direct llm returned ${res.status}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`direct llm timed out after ${RECOGNIZER_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function directLlmJson(prompt) {
  const content = await callChatCompletion([
    { role: "system", content: "你是一个严格输出 JSON 的媒体识别助手。" },
    { role: "user", content: prompt },
  ]);
  return normalizeResult(extractJsonFromText(content) || {});
}

async function directLlmText(prompt) {
  const content = await callChatCompletion([
    { role: "system", content: "你是一个媒体名称标准化助手，只输出最终答案，不输出解释。" },
    { role: "user", content: prompt },
  ]);
  return String(content || "").replace(/```[\s\S]*?```/g, "").trim();
}

async function directLlmRecognize(title, recognizeMode) {
  const baseName = normalizeTitle(title);
  const extra = recognizeMode === "enhanced"
    ? "标题可能存在拼音、漏词、缩写或网盘规避命名，请优先猜测最可能的标准影视标题。"
    : "标题通常接近标准影视命名，请优先保证准确率。";

  const prompt1 = [
    "你是媒体识别助手。",
    extra,
    "必须输出唯一一行 JSON，不得包含任何解释或额外文字。",
    "字段必须齐全：name, year, tmdb_id, type, season, episode。",
    "tmdb_id 如果无法可靠确定必须输出 0。",
    "type 只能是 movie 或 tv。",
    "name 尽量输出标准片名；如果无法判断可留空字符串。",
    "如果无法判断 season 或 episode，则输出 0。",
    `标题：${title}`,
  ].join("\n");

  const prompt2 = [
    "你是媒体识别助手。",
    extra,
    "必须输出唯一一行 JSON，不得包含任何解释或额外文字。",
    "字段必须齐全：name, year, tmdb_id, type, season, episode。",
    "不允许直接回显原始标题。",
    "如果无法可靠识别，name 允许为空字符串。",
    "tmdb_id 如果无法可靠确定必须输出 0。",
    "type 只能是 movie 或 tv。",
    `标题：${title}`,
  ].join("\n");

  let result = await directLlmJson(prompt1);
  if (!result.name || normalizeTitle(result.name) === baseName) {
    result = await directLlmJson(prompt2);
  }

  const modelTmdbCandidate = extractTmdbCandidate(result);

  if (!result.name) {
    result.name = cleanTitle(title);
  }
  result.name = sanitizeModelTitle(result.name);
  if (!result.year) {
    result.year = extractYearFromTitle(title);
  }
  if (!result.season || !result.episode) {
    const se = extractSeasonEpisodeFromTitle(title);
    if (!result.season) result.season = se.season;
    if (!result.episode) result.episode = se.episode;
  }

  let nameForSearch = result.name || "";
  if (hasCjk(nameForSearch)) {
    const promptEn = [
      "只输出最可能对应的标准英文片名或英文剧名，不要解释，不要 JSON。",
      "如果无法判断，输出空字符串。",
      `标题：${title}`,
    ].join("\n");
    const enName = await directLlmText(promptEn);
    if (enName && !hasCjk(enName)) {
      nameForSearch = sanitizeModelTitle(enName);
      result.name = sanitizeModelTitle(enName);
    }
  }

  return {
    result: normalizeResult(result),
    modelTmdbCandidate,
    searchHints: {
      model_name: nameForSearch,
      clean_title: cleanTitle(title),
      core_title: extractCoreTitle(title),
      raw_title: title.replace(/\.[^.]+$/, "").trim(),
    },
  };
}

async function recognizeTitleUncached({ title, path, recognize_mode }) {
  if (!title) {
    return {
      result: emptyResult(),
      timings: { llm_s: 0, tmdb_s: 0, total_s: 0 },
    };
  }
  if (isSportsOrNewsTitle(title)) {
    return {
      result: { name: "", year: extractYearFromTitle(title), tmdb_id: 0, type: "tv", season: 0, episode: 0 },
      timings: { llm_s: 0, tmdb_s: 0, total_s: 0 },
    };
  }

  const recognizeStart = Date.now();
  const llmStart = Date.now();
  const llm = await directLlmRecognize(title, recognize_mode);
  const llmTime = elapsedSeconds(llmStart);
  let result = llm.result;
  const tmdbCandidate = llm.modelTmdbCandidate;
  const searchHints = llm.searchHints || {};

  if (!result.name) {
    result.name = cleanTitle(title);
  }
  if (!result.year) {
    result.year = extractYearFromTitle(title);
  }
  if (!result.season || !result.episode) {
    const se = extractSeasonEpisodeFromTitle(title);
    if (!result.season) result.season = se.season;
    if (!result.episode) result.episode = se.episode;
  }

  let tmdbTime = 0;
  if (TMDB_API_KEY) {
    const tmdbStart = Date.now();
    if (tmdbCandidate) {
      console.log(`收到模型候选 tmdb_id=${tmdbCandidate}，最终结果仍以 TMDB 复核为准`);
    }
    const queries = [];
    const seen = new Set();
    pushQuery(queries, seen, "model_name", searchHints.model_name || result.name);
    pushQuery(queries, seen, "clean_title", searchHints.clean_title || cleanTitle(title));
    if (recognize_mode === "enhanced") {
      pushQuery(queries, seen, "core_title", searchHints.core_title || extractCoreTitle(title));
      pushQuery(queries, seen, "raw_title", searchHints.raw_title || title.replace(/\.[^.]+$/, "").trim());
    }

    let tmdbId = 0;
    let matchedRoute = "";
    for (const q of queries) {
      tmdbId = await tmdbSearch(q.value, result.year, result.type);
      if (tmdbId) {
        matchedRoute = q.label;
        break;
      }
    }
    result.tmdb_id = tmdbId || 0;
    if (tmdbId) {
      console.log(`TMDB 命中 [mode=${recognize_mode}, route=${matchedRoute}] -> ${tmdbId}`);
    } else {
      console.log(`TMDB 未命中 [mode=${recognize_mode}]`);
    }
    tmdbTime = elapsedSeconds(tmdbStart);
  } else {
    result.tmdb_id = tmdbCandidate || 0;
  }
  return {
    result: normalizeResult(result),
    timings: {
      llm_s: llmTime,
      tmdb_s: tmdbTime,
      total_s: elapsedSeconds(recognizeStart),
    },
  };
}

async function recognizeTitle(input) {
  const title = String(input?.title || "").trim();
  const recognizeMode = normalizeRecognizeMode(input?.recognize_mode);
  const cacheKey = `${recognizeMode}|${normalizeTitle(title)}`;

  if (cacheKey !== `${recognizeMode}|`) {
    const cached = getCacheEntry(recognizeCache, cacheKey);
    if (cached) {
      cached.timings = { llm_s: 0, tmdb_s: 0, total_s: 0, cache_hit: true };
      return cached;
    }
    if (inflightRecognitions.has(cacheKey)) {
      return cloneJson(await inflightRecognitions.get(cacheKey));
    }
  }

  const task = recognizeTitleUncached({
    ...input,
    title,
    recognize_mode: recognizeMode,
  });

  if (cacheKey === `${recognizeMode}|`) {
    return task;
  }

  inflightRecognitions.set(cacheKey, task);
  try {
    const recognize = await task;
    const ttlMs = recognize.result?.tmdb_id ? RECOGNIZE_CACHE_TTL_MS : RECOGNIZE_MISS_CACHE_TTL_MS;
    setCacheEntry(recognizeCache, cacheKey, recognize, ttlMs);
    return cloneJson(recognize);
  } finally {
    inflightRecognitions.delete(cacheKey);
  }
}

async function callbackToMoviePilot(requestId, title, path, result) {
  if (!MP_BASE_URL || !MP_API_KEY) {
    return { status: 0, body: "callback skipped: MP_BASE_URL or MP_API_KEY is missing" };
  }

  const url = `${MP_BASE_URL}/api/v1/plugin/AIRecoginzerForwarder/ai_recognize_callback?apikey=${MP_API_KEY}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, title, path: path || "", result }),
    });
    return { status: res.status, body: await res.text() };
  } catch (error) {
    return { status: 0, body: `callback failed: ${error.message}` };
  }
}

app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    service: "moviepilot-ai-recognizer-gateway",
    backend: BACKEND,
  });
});

app.post("/recognize", async (req, res) => {
  const { title, path } = req.body || {};
  const recognizeMode = normalizeRecognizeMode(req.body?.recognize_mode);

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "missing title",
      result: emptyResult(),
    });
  }

  try {
    const recognize = await recognizeTitle({
      title,
      path: path || "",
      recognize_mode: recognizeMode,
    });
    console.log(formatTimingLog(recognize.timings));
    return res.json({
      success: true,
      mode: recognizeMode,
      backend: BACKEND,
      result: recognize.result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      mode: recognizeMode,
      backend: BACKEND,
      message: error.message,
      result: emptyResult(),
    });
  }
});

app.post("/webhook", async (req, res) => {
  const { request_id, title, path } = req.body || {};
  const recognizeMode = normalizeRecognizeMode(req.body?.recognize_mode);
  const startTime = Date.now();

  if (!request_id || !title) {
    return res.status(400).json({ success: false, message: "missing request_id or title" });
  }

  console.log(`📥 收到识别请求：${request_id} - ${title} [mode=${recognizeMode}, backend=${BACKEND}]`);
  res.status(202).json({ success: true, accepted: true, request_id });

  try {
    const recognize = await recognizeTitle({ title, path, recognize_mode: recognizeMode });
    console.log(formatTimingLog(recognize.timings));
    console.log(`🎯 识别结果 (${formatRecognizeDuration(recognize.timings)}): ${JSON.stringify(recognize.result)}`);
    const cbStart = Date.now();
    const cb = await callbackToMoviePilot(request_id, title, path || "", recognize.result);
    const cbTime = elapsedSeconds(cbStart);
    console.log(`📤 回调结果：status=${cb.status}, body=${String(cb.body).slice(0, 120)}... (${cbTime}s)`);
    console.log(`⏱️  总耗时：${elapsedSeconds(startTime)}s`);
  } catch (error) {
    const total = elapsedSeconds(startTime);
    console.error(`❌ 识别失败 (${total}s): ${error.message}`);
    const cb = await callbackToMoviePilot(request_id, title, path || "", emptyResult());
    console.error(`📤 失败回调：status=${cb.status}, body=${String(cb.body).slice(0, 120)}...`);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MoviePilot AI recognizer gateway listening on :${PORT}`);
});
