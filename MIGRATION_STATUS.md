# Codex SDK → CLI Agents Migration

## 🎯 Goal
Adapt Cole Medin's Codex Telegram bot to use FREE CLI-based coding agents instead of Codex SDK ($20/mo ChatGPT Plus requirement).

## ✅ Completed

### 1. Proof of Concept
- ✅ Tested Gemini CLI - WORKS! Creates actual files via subprocess
- ✅ Confirmed streaming output possible
- ✅ Verified YOLO mode (`-y`) for auto-approval

### 2. Project Setup
- ✅ Cloned Cole's repo to `~/telegram-coding-bot`
- ✅ Created `src/agents/` directory
- ✅ Defined agent interfaces (`types.ts`)
- ✅ Implemented Gemini CLI agent with:
  - Quota tracking (100 calls/day)
  - Auto-reset at midnight
  - Streaming output via async iterator
  - Process spawning with working directory support

## 🔄 In Progress

### 3. Remaining Agents
- ⏳ QwenCode CLI agent (2000 calls/day)
- ⏳ Aider agent (unlimited via OpenRouter)

### 4. Integration Layer
- ⏳ Agent router (switch between agents)
- ⏳ Replace Codex SDK calls in `src/codex/client.ts`
- ⏳ Update message handler to use agents
- ⏳ Add `/agent` command for switching

### 5. Commands to Add
```
/agent gemini  - Use Gemini CLI (100/day, Pro model)
/agent qwen    - Use QwenCode CLI (2000/day)
/agent aider   - Use Aider (unlimited, OpenRouter)
/agent status  - Show quota usage
```

## 📋 Next Steps

1. **Create QwenCode agent** (`src/agents/qwen-agent.ts`)
2. **Create Aider agent** (`src/agents/aider-agent.ts`)
3. **Create agent router** (`src/agents/router.ts`)
4. **Replace Codex client** with agent router
5. **Update .env.example** with new requirements
6. **Test locally**
7. **Deploy to PCT-120** (new container)

## 🏗️ Architecture

```
Telegram Message
    ↓
Message Handler (unchanged)
    ↓
Agent Router (NEW)
    ├─→ Gemini Agent (100/day)
    ├─→ Qwen Agent (2000/day)
    └─→ Aider Agent (unlimited)
    ↓
Subprocess spawn (gemini/qwencode/aider CLI)
    ↓
Streaming output back to Telegram
```

## 🔑 Key Changes

### Before (Codex SDK):
```typescript
const codex = new Codex();
const thread = codex.startThread({ workingDirectory });
const result = await thread.runStreamed(prompt);
```

### After (CLI Agents):
```typescript
const agent = getAgent(session.agent); // gemini/qwen/aider
for await (const event of agent.run(prompt, workingDirectory)) {
  // Process streaming events (same as Codex)
}
```

## 📊 Cost Comparison

| Solution | Cost | Limitations |
|----------|------|-------------|
| Codex SDK (original) | $20/mo | Requires ChatGPT Plus |
| Gemini CLI | FREE | 100 calls/day |
| QwenCode CLI | FREE | 2000 calls/day |
| Aider + OpenRouter | FREE | Unlimited (with free models) |
| **Total** | **$0** | **Smart routing between quotas** |

## 🚀 Deployment Plan

1. **Test locally** in WSL
2. **Create PCT-120** on Proxmox
3. **Install CLI tools** in container:
   - `pnpm add -g @google/gemini-cli`
   - `pnpm add -g qwen-code`
   - `pip install aider-chat`
4. **Deploy with Docker Compose**
5. **Set Telegram webhook** (or use polling)

## 📝 Notes

- Session management stays the same (Cole's pattern)
- Telegraf bot framework unchanged
- All commands work identically
- Streaming works via async iterators
- Each agent tracks its own quota
