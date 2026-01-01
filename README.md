# LOTO Simulator Platform (MVP) — Web app com histórico

Monorepo com:
- **@loto/engine**: motor determinístico de cenários com *event log*
- **API**: Express + Prisma + PostgreSQL (sessions/events/history + seed)
- **Web**: Next.js (App Router) + Tailwind (runner + histórico + replay)
- **Cenários**: JSON versionados em `packages/scenarios/*`
- **Infra**: Docker Compose para PostgreSQL

## Rodar local (Windows/macOS/Linux)

### 1) Subir Postgres
```bash
cd infra/docker
docker compose up -d
```

### 2) API
```bash
cd ../../apps/api
cp .env.example .env
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

API: http://localhost:4000/health

Seed login:
- email: **admin@demo.com**
- senha: **admin123**

### 3) Web
```bash
cd ../web
cp .env.local.example .env.local
pnpm install
pnpm dev
```

Web: http://localhost:3000

## Observações
- O histórico é baseado em **event-sourcing**: cada decisão gera eventos imutáveis.
- O backend aplica **idempotência** em eventos por `(sessionId, clientEventId)`.
