# OAuth Setup Guide

## Gemini CLI Authentication

Gemini CLI uses Google OAuth for authentication.

### Setup Steps:

1. **Install Gemini CLI** (if not already installed):
```bash
pnpm add -g @google/gemini-cli
```

2. **Authenticate**:
```bash
gemini auth login
```

This will:
- Open your browser
- Prompt you to sign in with your Google account
- Request permission to access Gemini AI
- Save credentials to `~/.gemini/`

3. **Verify**:
```bash
gemini chat "Hello, test message"
```

If it responds, you're authenticated!

### Where are credentials stored?
- Linux/Mac: `~/.gemini/credentials.json`
- Windows: `%USERPROFILE%\.gemini\credentials.json`

### Quota:
- **Free tier**: 100 requests/day on Gemini 2.0 Pro
- Automatically falls back to Flash model after quota

---

## QwenCode CLI Authentication

QwenCode CLI also uses OAuth (Alibaba Cloud).

### Setup Steps:

1. **Install QwenCode CLI**:
```bash
pnpm add -g qwen-code
```

2. **Authenticate**:
```bash
qwencode auth login
```

This will:
- Open your browser
- Prompt you to sign in with Alibaba Cloud account
- Request API access
- Save credentials to `~/.qwen/`

3. **Verify**:
```bash
qwencode chat "Hello, test message"
```

### Where are credentials stored?
- Linux/Mac: `~/.qwen/credentials.json`
- Windows: `%USERPROFILE%\.qwen\credentials.json`

### Quota:
- **Free tier**: 2000 requests/day
- Best for heavy coding workloads

---

## Aider CLI Setup (No OAuth!)

Aider uses OpenRouter API key (no OAuth needed).

### Setup Steps:

1. **Get OpenRouter API Key**:
   - Go to https://openrouter.ai/
   - Sign up (free)
   - Copy your API key

2. **Add to .env**:
```env
OPENROUTER_API_KEY=your_key_here
```

3. **Aider will use free models automatically**:
   - `qwen/qwen3-coder:free`
   - `google/gemini-2.0-flash-001:free`
   - etc.

### Quota:
- **Unlimited** (using free tier models)

---

## Docker Deployment

When deploying in Docker, you need to copy the credential files:

### Option 1: Mount credentials as volumes

```yaml
# docker-compose.yml
volumes:
  - ~/.gemini:/root/.gemini:ro
  - ~/.qwen:/root/.qwen:ro
```

### Option 2: Copy credentials during build

```dockerfile
# Dockerfile
COPY .gemini /root/.gemini
COPY .qwen /root/.qwen
```

**IMPORTANT**: Add to `.gitignore`:
```
.gemini/
.qwen/
```

---

## Troubleshooting

### "Authentication failed" error

**Gemini CLI:**
```bash
# Re-authenticate
gemini auth logout
gemini auth login
```

**QwenCode CLI:**
```bash
# Re-authenticate
qwencode auth logout
qwencode auth login
```

### "Quota exceeded" error

This means you've hit the daily limit. The bot will automatically:
1. Try Gemini first (100/day)
2. Fall back to QwenCode (2000/day)
3. Final fallback to Aider (unlimited)

Use `/agent status` in Telegram to check quotas.

### Credentials not found in Docker

Make sure you've either:
1. Mounted the credentials directory as a volume
2. Copied credentials during Docker build
3. Run `gemini auth login` and `qwencode auth login` INSIDE the container

---

## Security Notes

- ✅ Credentials are stored locally (not in repo)
- ✅ OAuth tokens expire and auto-refresh
- ✅ No API keys stored in code
- ⚠️ Don't commit `.gemini/` or `.qwen/` directories
- ⚠️ Use `.gitignore` to exclude credentials

---

## Quick Start Checklist

- [ ] Installed Gemini CLI (`pnpm add -g @google/gemini-cli`)
- [ ] Authenticated Gemini (`gemini auth login`)
- [ ] Installed QwenCode CLI (`pnpm add -g qwen-code`)
- [ ] Authenticated QwenCode (`qwencode auth login`)
- [ ] Got OpenRouter API key (https://openrouter.ai/)
- [ ] Added `OPENROUTER_API_KEY` to `.env`
- [ ] Tested all agents: `/agent gemini`, `/agent qwen`, `/agent aider`

Done! 🎉
