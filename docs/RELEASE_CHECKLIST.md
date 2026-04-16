# Release Checklist

1. `node --check server.js` passes
2. `npm ci` succeeds
3. `.env.example` contains placeholders only
4. README reflects the single direct-LLM backend
5. Docker image name matches DockerHub target
6. stable tag is chosen explicitly
7. no private keys or API keys are present in source
