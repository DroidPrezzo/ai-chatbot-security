# YewoAI — AI Chatbot Security Platform

An AI security platform that lets you chat with phi3:mini, run real emoji/Unicode injection attacks using PyRIT, apply defense layers, and generate visual risk reports.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PyRIT](https://img.shields.io/badge/PyRIT-0.14-purple)

## Screenshots

### 1. Dashboard
![Dashboard](/screenshots/dashboard.png)

### 2. Attack Lab
![Attack Laboratory](/screenshots/attack-lab.png)

### 3. Risk Report
![Risk Report](/screenshots/risk-report1.png)
![Risk Report](/screenshots/risk-report2.png)

### 4. Chat Interface with Defense Toggle
![Chat Interface](/screenshots/chat-interface.png)

## Features

- **AI Chatbot** — Chat with phi3:mini via Ollama with real-time streaming
- **Defense Toggle** — Switch between defended/undefended modes to test input sanitization
- **Attack Lab** — Run 6 attack scenarios executed by the PyRIT backend (emoji obfuscation, Ecoji encoding, variation selector smuggling, invisible/zero-width injection, homoglyph substitution, mixed emoji-text)
- **Visual Results** — Interactive charts (Chart.js) and detailed tables showing attack outcomes
- **Risk Report** — Security score, defense comparison, category breakdown, and recommendations
- **PyRIT Integration** — Python backend using Microsoft's PyRIT framework for the real attack converters. The Attack Lab calls this backend; if it is unreachable the UI shows an error rather than fabricating results.

## Quick Start

### Prerequisites

- **Node.js 20+** (`nvm install 20`)
- **Ollama** with phi3:mini model
- **Python 3.10+** (required for the PyRIT attack server that powers the Attack Lab)

### 1. Install Ollama & Model

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull phi3:mini
ollama serve  # keep running in a terminal
```

### 2. Install & Run Frontend

```bash
cd ai-chatbot-security
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Run the PyRIT Attack Server

The Attack Lab page depends on this server. Run it in a separate terminal:

```bash
cd attack-server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The frontend reaches it via the `/api/attacks/*` proxy configured in `next.config.ts`
(`ATTACK_SERVER_URL`, default `http://localhost:8000`). Check it with
`curl http://localhost:8000/health` — `pyrit_available: true` confirms the real
converters are active.

**API** — attack runs are asynchronous so long (real LLM) runs never hit a proxy
timeout:

- `POST /run-attacks` `{ "defense": bool }` → `202 { job_id, status, total }`
- `GET /jobs/{job_id}` → `{ status, progress: { completed, total }, results? }`
  (`results` present once `status` is `completed`)
- `GET /results` / `DELETE /results` — persisted history
- `GET /health` — liveness + available PyRIT converters

The Attack Lab polls `/jobs/{id}` and shows live progress.

## Project Structure

```
ai-chatbot-security/
├── app/
│   ├── api/chat/route.ts    # Chat API with defense layer
│   ├── attacks/page.tsx     # Attack dashboard
│   ├── chat/page.tsx        # Chat interface
│   ├── report/page.tsx      # Risk report
│   ├── globals.css          # Design system
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── AttackCharts.tsx     # Attack result charts
│   ├── Nav.tsx              # Navigation
│   └── ReportCharts.tsx     # Report charts
├── attack-server/
│   ├── server.py            # FastAPI + PyRIT backend
│   ├── defense.py           # Shared defense layer (mirrors route.ts)
│   ├── Dockerfile
│   └── requirements.txt
├── Dockerfile               # Next.js frontend image (standalone)
├── docker-compose.yml       # Frontend + attack-server orchestration
├── .env.example             # Configuration template
├── package.json
└── next.config.ts           # API proxy + standalone output config
```

## Defense Layer

The same defense logic runs in two places, kept in sync: `app/api/chat/route.ts`
(live chat) and `attack-server/defense.py` (defended attack runs). It applies:

1. **Variation selector + tag-character stripping** — removes Unicode variation selectors and U+E0000–E007F tag characters used for data smuggling
2. **Invisible character removal** — strips zero-width joiners, soft hyphens, etc.
3. **Emoji stripping** — removes emoji used for prompt obfuscation
4. **NFKC normalization** — folds math-alphanumeric and compatibility homoglyphs to ASCII
5. **Cross-script homoglyph folding** — an explicit Cyrillic/Greek→ASCII map, because NFKC does **not** fold cross-script lookalikes
6. **Prompt injection detection** — pattern-matches known injection templates

A defended attack is reported as **blocked** only when the defense actually stops the
payload — the cleaned input is empty (pure obfuscation) or matches a known injection
template. Otherwise the obfuscation is stripped and the cleaned text is forwarded, so
partial bypasses show up honestly in the report.

## Deploying with Docker Compose (recommended)

The whole tool — frontend + PyRIT attack server — runs from one command:

```bash
cp .env.example .env       # adjust if needed
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

**Notes**
- **Ollama** is expected on the host. Compose maps `host.docker.internal` to the
  host gateway, so the default `OLLAMA_BASE_URL=http://host.docker.internal:11434`
  works on Linux/macOS/Windows. Point it at a remote instance (or the Saffev proxy)
  by overriding the variable in `.env`.
- The attack server is **not** published to the host by default; the frontend
  reaches it over the internal Compose network. Uncomment its `ports:` block in
  `docker-compose.yml` to expose it for debugging.
- Both services run as **non-root** users and the attack server has a healthcheck.
- Rate limits are configurable via `RATE_LIMIT_MAX` / `ATTACK_RATE_LIMIT_MAX`.

## Deploying the frontend to Vercel

```bash
npm run build
npx vercel
```

> **Note:** Vercel hosts only the Next.js app. The Ollama backend and the PyRIT
> attack server must be reachable from the deployment — set `OLLAMA_BASE_URL` and
> `ATTACK_SERVER_URL` to publicly reachable URLs. For a single self-contained
> deployment, prefer Docker Compose above.

## Security

- **Dependencies:** `npm audit` and `pip-audit` both report **0 known vulnerabilities**
  (Next.js 15.5.19, patched transitive deps pinned in `requirements.txt`).
- **OWASP LLM Top 10:** input size caps and per-IP rate limiting (LLM10), a shared
  input-sanitization defense layer (LLM01), strict role allow-listing on chat history,
  sanitized error messages, SSRF-guarded backend URL parsing, and a restrictive CSP +
  security headers in `next.config.ts`.
- Re-audit anytime with `npm audit` and, in `attack-server/`, `pip-audit`.

## License

MIT
