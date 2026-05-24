# 🧠 ChatLLM — AI Super Assistant with RouteLLM

A full-stack chat application with intelligent **RouteLLM** model routing for both **Chat** and **Agents** modes. Automatically selects the optimal Claude model (Haiku, Sonnet, or Opus) based on query complexity — reducing cost while maintaining quality.

---

## ✨ Features

### RouteLLM Engine
- **Auto-routing** — scores each query 0–100 across 7 dimensions (length, code depth, reasoning, math/science, planning, creativity, simplicity)
- **Three tiers** — ⚡ Haiku (fast/cheap), ⚖️ Sonnet (balanced), 💎 Opus (most capable)
- **Live preview** — shows predicted model as you type, updates in real time
- **Route badge** on every AI message with complexity bar and score
- **Decision callout** — explains *why* a model was selected
- **Cost savings tracker** — estimates savings vs always using Opus
- **Manual override** — turn off RouteLLM to force a specific model

### Chat Mode
- Full conversation history with localStorage persistence
- SSE streaming with real-time token delivery
- Multi-turn context maintained across messages
- Regenerate any response
- Copy individual messages or full chat

### Agents Mode (5 specialized agents)
- 🔬 **Researcher** — deep analysis, citations, structured summaries
- 💻 **Code Assistant** — write, debug, review & explain code
- ✍️ **Writer** — creative & professional writing
- 📊 **Data Analyst** — data insights & interpretation
- 📋 **Task Planner** — goals → actionable steps

Each agent has a specialized system prompt. RouteLLM runs for every agent request with a 3-step reasoning panel (analyze → route → invoke).

### Stats Bar
Live counters: Haiku / Sonnet / Opus usage, total routed messages, estimated savings vs Opus, average complexity score.

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd chatllm
npm run install:all
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env and add your ANTHROPIC_API_KEY
```

### 3. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 4. Build for production

```bash
npm run build    # Builds React into server/public/
npm start        # Serves everything from Express
```

---

## 📁 Project Structure

```
chatllm/
├── package.json              # Root workspace (scripts + concurrently)
│
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js          # Express server
│       ├── routellm.js       # RouteLLM scoring & routing engine
│       ├── agents.js         # Agent definitions & message builder
│       ├── middleware/
│       │   └── auth.js       # API key validation
│       └── routes/
│           ├── chat.js       # POST /api/chat (SSE streaming)
│           ├── agent.js      # POST /api/agent/:id/chat (SSE + steps)
│           └── route.js      # POST /api/route/analyze
│
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx          # React entry
        ├── App.jsx           # Root component + send logic
        ├── store/
        │   └── index.js      # Zustand store (convs, agents, stats)
        ├── hooks/
        │   └── useRouteLLM.js # SSE streaming hooks
        ├── components/
        │   ├── Sidebar.jsx   # Navigation (Chat + Agents)
        │   ├── Topbar.jsx    # Title bar + actions
        │   ├── StatsBar.jsx  # Live RouteLLM stats
        │   ├── Message.jsx   # Message row with route badge
        │   ├── InputBar.jsx  # Textarea + route controls
        │   ├── EmptyState.jsx # Empty state + suggestions
        │   └── RouteUI.jsx   # RouteBadge, RouteDecision, AgentSteps
        ├── styles/
        │   └── globals.css
        └── utils/
            └── index.js
```

---

## 🛠 API Reference

### `POST /api/chat`
Stream a chat completion with RouteLLM routing.

**Body:**
```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "forceModel": null,
  "stream": true
}
```

**SSE Events:** `routing`, `token`, `done`, `error`

---

### `POST /api/agent/:id/chat`
Stream an agent response with step-by-step reasoning events.

**Agents:** `researcher`, `coder`, `writer`, `analyst`, `planner`

**SSE Events:** `agent`, `routing`, `step`, `token`, `done`, `error`

---

### `POST /api/route/analyze`
Analyze query complexity without calling Anthropic.

**Body:** `{ "text": "..." }`

**Response:**
```json
{
  "score": 72,
  "modelKey": "opus",
  "model": { "id": "...", "label": "Opus 4", "costPer1k": 0.015 },
  "reason": "High complexity query — most capable model selected",
  "isManual": false
}
```

---

### `GET /api/route/models`
Returns all model definitions and routing thresholds.

---

## ⚙️ RouteLLM Thresholds

| Score | Model | Use case |
|-------|-------|----------|
| 0–34  | ⚡ Haiku 4.5 | Simple lookups, short questions |
| 35–67 | ⚖️ Sonnet 4  | Technical questions, moderate reasoning |
| 68–100 | 💎 Opus 4  | Deep analysis, complex multi-step reasoning |

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | *required* |
| `PORT` | Server port | `3001` |
| `CLIENT_URL` | CORS origin | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` |

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| State | Zustand (persisted) |
| Backend | Express.js |
| AI SDK | `@anthropic-ai/sdk` |
| Streaming | Server-Sent Events (SSE) |
| Markdown | marked.js |
| Security | helmet, rate-limiting, CORS |
