# 🔐 LOTO Simulator Platform

Plataforma web de simulação educacional para procedimentos de **Lock Out Tag Out (LOTO)**, com histórico de sessões, event-sourcing e análise de desempenho.

![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

---

## 🏗️ Arquitetura

Monorepo (pnpm workspace) com separação clara de responsabilidades:

```
loto-sim-platform/
├── apps/
│   ├── api/          # Backend Express + Prisma + PostgreSQL
│   └── web/          # Frontend Next.js 14 (App Router) + Tailwind
├── packages/
│   ├── engine/       # Motor determinístico de simulação
│   ├── shared/       # Tipos e schemas compartilhados (Zod)
│   └── scenarios/    # Cenários JSON versionados
└── infra/
    └── docker/       # Docker Compose para desenvolvimento local
```

### Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, TypeScript |
| **Backend** | Express.js, Prisma ORM, TypeScript |
| **Banco de Dados** | PostgreSQL (local) / Neon (produção) |
| **Autenticação** | JWT + bcrypt |
| **Deploy** | Vercel (Frontend + API) |

---

## ✨ Funcionalidades

- ✅ **Simulação interativa** de procedimentos LOTO
- ✅ **Event-sourcing** com log imutável de decisões
- ✅ **Histórico de sessões** com replay completo
- ✅ **Sistema de pontuação** e análise de maturidade
- ✅ **Múltiplos cenários** versionados em JSON
- ✅ **Autenticação JWT** com roles (Admin, Supervisor, Executor)
- ✅ **API RESTful** documentada
- ✅ **Idempotência** de eventos por `(sessionId, clientEventId)`

---

## 🚀 Quick Start (Desenvolvimento Local)

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org))
- pnpm 9+ (`npm install -g pnpm`)
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))

### 1️⃣ Clonar Repositório

```bash
git clone https://github.com/Leoliveira2/loto-simulation.git
cd loto-simulation
```

### 2️⃣ Instalar Dependências

```bash
pnpm install
```

### 3️⃣ Subir Banco de Dados (PostgreSQL)

```bash
cd infra/docker
docker compose up -d
cd ../..
```

### 4️⃣ Configurar API

```bash
cd apps/api
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed
```

**Credenciais de teste**:
- Email: `admin@demo.com`
- Senha: `admin123`

### 5️⃣ Configurar Web

```bash
cd ../web
cp .env.local.example .env.local
```

### 6️⃣ Iniciar Aplicação

Em terminais separados:

```bash
# Terminal 1: API
cd apps/api
pnpm dev

# Terminal 2: Web
cd apps/web
pnpm dev
```

Acesse:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 🌐 Deploy em Produção

**Veja o guia completo em [DEPLOY.md](./DEPLOY.md)**.

### Resumo Rápido

1. **Banco de Dados**: Criar projeto no [Neon](https://neon.tech)
2. **API**: Deploy no Vercel com root `apps/api`
3. **Web**: Deploy no Vercel com root `apps/web`
4. **Migrations**: `pnpm prisma migrate deploy`
5. **Seed**: `pnpm seed`

---

## 📦 Scripts Disponíveis

### Root (Monorepo)

```bash
pnpm dev              # Inicia API + Web em paralelo
pnpm build            # Build de todos os projetos
pnpm dev:api          # Apenas API
pnpm dev:web          # Apenas Web
pnpm clean            # Limpa node_modules e builds
```

### API

```bash
pnpm dev              # Desenvolvimento com hot-reload
pnpm build            # Build para produção
pnpm start            # Inicia servidor de produção
pnpm prisma:generate  # Gera Prisma Client
pnpm prisma:migrate   # Executa migrations
pnpm seed             # Popula banco com dados de teste
```

### Web

```bash
pnpm dev              # Desenvolvimento com hot-reload
pnpm build            # Build para produção
pnpm start            # Inicia servidor de produção
```

---

## 🗄️ Banco de Dados

### Schema Principal

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         UserRole @default(EXECUTOR)
  sessions     Session[]
}

model Session {
  id              String        @id @default(uuid())
  userId          String
  scenarioId      String
  status          SessionStatus @default(IN_PROGRESS)
  overallScore    Int?
  events          Event[]
}

model Event {
  id            String   @id @default(uuid())
  sessionId     String
  clientEventId String
  type          EventType
  payload       Json
  
  @@unique([sessionId, clientEventId])
}
```

### Migrations

```bash
# Desenvolvimento
pnpm --filter api prisma migrate dev --name nome_da_migration

# Produção
pnpm --filter api prisma migrate deploy
```

---

## 📚 Documentação da API

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/auth/login` | Login com email/senha |
| `GET` | `/scenarios` | Listar cenários disponíveis |
| `GET` | `/scenarios/:id` | Obter cenário específico |
| `POST` | `/sessions` | Iniciar nova sessão |
| `POST` | `/sessions/:id/events` | Adicionar eventos à sessão |
| `POST` | `/sessions/:id/complete` | Finalizar sessão |
| `GET` | `/sessions/me/history` | Histórico do usuário |
| `GET` | `/sessions/:id` | Detalhes da sessão + eventos |

### Exemplo: Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@demo.com",
    "role": "ADMIN"
  }
}
```

---

## 🎯 Cenários

Os cenários são definidos em JSON versionado em `packages/scenarios/`:

```
packages/scenarios/
├── loto-eletrico-motor-480v/
│   └── 1.0.0.json
└── loto-eletrico-mcc-multiplas-fontes/
    └── 1.0.0.json
```

### Estrutura de Cenário

```json
{
  "scenarioId": "loto-eletrico-motor-480v",
  "version": "1.0.0",
  "title": "LOTO - Motor Elétrico 480V",
  "nodes": [...],
  "rules": [...],
  "scoring": {...}
}
```

---

## 🔒 Segurança

- ✅ **JWT** com expiração configurável
- ✅ **Bcrypt** para hash de senhas (salt rounds: 10)
- ✅ **CORS** configurável por ambiente
- ✅ **Validação** de entrada com Zod
- ✅ **Headers de segurança** (X-Frame-Options, CSP, etc.)
- ✅ **Rate limiting** (recomendado adicionar)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 👥 Autores

- **Leonardo Oliveira** - [@Leoliveira2](https://github.com/Leoliveira2)

---

## 🙏 Agradecimentos

- Comunidade de segurança do trabalho
- Contribuidores open-source
- Vercel e Neon por infraestrutura gratuita

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/Leoliveira2/loto-simulation/issues)
- **Email**: contato@seudominio.com
- **Documentação**: [Wiki](https://github.com/Leoliveira2/loto-simulation/wiki)

---

**Desenvolvido com ❤️ para tornar ambientes de trabalho mais seguros**
