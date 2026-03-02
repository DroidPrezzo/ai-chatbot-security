# ShieldAI — AI Chatbot Security Platform

An AI security platform that lets you chat with phi3:mini, simulate emoji injection attacks using PyRIT, apply defense layers, and generate visual risk reports.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PyRIT](https://img.shields.io/badge/PyRIT-0.11-purple)

## Features

- **AI Chatbot** — Chat with phi3:mini via Ollama with real-time streaming
- **Defense Toggle** — Switch between defended/undefended modes to test input sanitization
- **Attack Lab** — Run 6 emoji injection attack scenarios (emoji obfuscation, Ecoji encoding, variation selector smuggling, invisible character injection, homoglyph substitution, mixed emoji-text)
- **Visual Results** — Interactive charts (Chart.js) and detailed tables showing attack outcomes
- **Risk Report** — Security score, defense comparison, category breakdown, and recommendations
- **PyRIT Integration** — Optional Python backend using Microsoft's PyRIT framework for real attack converters

## Quick Start

### Prerequisites

- **Node.js 20+** (`nvm install 20`)
- **Ollama** with phi3:mini model
- **Python 3.10+** (optional, for PyRIT attack server)

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

### 3. (Optional) Run PyRIT Attack Server

```bash
cd attack-server
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

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
│   └── requirements.txt
├── package.json
└── next.config.ts           # API proxy config
```

## Defense Layer

The defense layer (in `app/api/chat/route.ts`) applies:

1. **Variation selector stripping** — removes Unicode variation selectors used for data smuggling
2. **Invisible character removal** — strips zero-width joiners, soft hyphens, etc.
3. **Emoji stripping** — removes emoji used for prompt obfuscation
4. **NFKC normalization** — converts confusable homoglyphs to ASCII
5. **Prompt injection detection** — pattern-matches known injection templates

## Deploying to Vercel

```bash
npm run build
npx vercel
```

> **Note:** The Ollama backend must be accessible from the deployed site. Set `OLLAMA_URL` environment variable in Vercel to point to your remote Ollama instance.

## License

MIT
