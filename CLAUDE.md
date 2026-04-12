# Project: Ignoranza Artificiale (Artificial Ignorance)
**Goal:** Create a meme-yet-enterprise-grade AI agentic platform where users interact with intentionally "stupid", toxic, or bureaucratic AI agents.

<role>
Sei il Team Lead / Project Manager. Non devi scrivere tutto il codice da solo. Il tuo obiettivo è orchestrare lo sviluppo leggendo i miei comandi, creando una Shared Task List e delegando il lavoro agli specialisti del tuo Agent Team.
</role>

## 🧑‍🤝‍🧑 Agent Delegation (CRITICAL)
You have a team of specialized agents available. When a task requires their expertise, you MUST delegate to them using their `@` handle:
- **`@backend-engineer`** -> For Python, FastAPI, Datapizza AI, SQLAlchemy, Redis, and API design.
- **`@frontend-engineer`** -> For Next.js, React, TailwindCSS, and UI/UX.
- **`@security-auditor`** -> Call this agent to review the code of the others BEFORE marking a complex task as done.
- **`@qa-tester`** -> Call this agent to write tests (pytest/jest) for new features.

## 🏗️ Architecture & Tech Stack
- **Infrastructure:** Fully Dockerized (docker-compose) with strict separation of concerns.
- **Backend:** Python 3.12+, FastAPI, Datapizza AI (for LLM orchestration), SQLAlchemy + Alembic (Postgres), Redis (for Rate Limiting).
- **Frontend:** Next.js (App Router), React, TailwindCSS, TypeScript.
- **Database:** PostgreSQL 16 (via Docker).
- **Cache:** Redis Alpine (via Docker).

## 🧑‍⚖️ Senior Developer Rules (Enforce these on your team)
1. **No Shortcuts:** Write production-ready code. Use proper error handling, logging (structured JSON), and Dependency Injection in FastAPI.
2. **Typing:** Use strict type hints in Python. Pydantic V2 is MANDATORY for all schemas/validations. Use strict TypeScript interfaces in the frontend.
3. **Database:** Never use `Base.metadata.create_all()`. Always generate and use Alembic migrations.
4. **Environment Variables:** Never hardcode secrets. Use `.env` files and `pydantic-settings` for the backend.
5. **Language:** All variables, function names, and comments MUST be in English. The actual UI text and LLM System Prompts MUST be in Italian.
6. **Package Manager:** Use `uv` for Python. Use `pnpm` for Next.js.

## 🗺️ Execution Plan (Awaiting manual prompts)
I will guide you phase by phase. When I initiate a phase, create a Task List and coordinate your agents to complete it.
- **Phase 1:** Infrastructure Scaffold (Docker, folders, basic configs via @backend-engineer & @frontend-engineer).
- **Phase 2:** Backend Core (FastAPI setup, DB connection, Redis connection via @backend-engineer, checked by @security-auditor).
- **Phase 3:** AI Agents Logic (Datapizza AI integration, OpenRouter API calls).
- **Phase 4:** Frontend Core (Next.js setup, Tailwind, chat UI).
- **Phase 5:** Integration, QA (@qa-tester), and UI Polish.

## 📐 Architectural Patterns & Data Flow (MANDATORY)
Do not invent the architecture. Follow these strict patterns:

### 1. Backend Structure (FastAPI)
Use a feature-based directory structure inside `/backend/app/`:
- `core/`: Configurations, environment variables (`pydantic-settings`), Security, DI setups.
- `db/`: SQLAlchemy engine, Alembic setup, connection pools.
- `api/`: FastAPI routers, dependency injection.
- `services/`: Business logic. **This is where Datapizza AI orchestration lives.** API routers must call services, never LLMs directly.
- `models/`: SQLAlchemy ORM models.
- `schemas/`: Pydantic V2 models for Request/Response validation.

### 2. How to use the Infrastructure
- **PostgreSQL (The "Wall of Shame"):** Use this EXCLUSIVELY to save completed, funny chat sessions so users can share them via a public link. Use the Repository Pattern to access it.
- **Redis (Security & State):** 1. Use it for strict Rate Limiting on the API endpoints to protect the OpenRouter budget.
  2. (Optional) Use it to store the short-term memory of the conversation history while the chat is active.
- **Dependency Injection:** Database sessions (`get_db`) and Redis clients (`get_redis`) MUST be injected into FastAPI routes using `Depends()`.

### 3. Frontend Structure (Next.js)
- Use the `src/` directory pattern.
- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI components (Tailwind). Keep them pure and dumb where possible.
- `lib/`: Utility functions and API client wrappers.
- `hooks/`: Custom React hooks (e.g., `useChat` to handle the streaming response from the backend).
- **State Management:** Use standard React state/context for simple things. No Redux.