# ⚡ Quick Start - Deploy no Vercel

Guia rápido para fazer deploy do LOTO Simulator no Vercel em **menos de 15 minutos**.

---

## ✅ Checklist Pré-Deploy

- [ ] Código commitado e pushed para GitHub
- [ ] Conta no [Vercel](https://vercel.com) criada
- [ ] Conta no [Neon](https://neon.tech) criada

---

## 🗄️ PASSO 1: Banco de Dados Neon (3 minutos)

### 1. Criar Projeto

1. Acesse [https://console.neon.tech](https://console.neon.tech)
2. Clique em **"Create a project"**
3. Nome: `loto-simulator`
4. Region: **US East (Ohio)** (ou mais próxima)
5. Clique em **"Create project"**

### 2. Copiar Connection String

1. No dashboard, clique em **"Connection string"**
2. Copie a URL completa (começa com `postgresql://`)
3. **Salve em local seguro** - você vai precisar!

Exemplo:
```
postgresql://neondb_owner:AbC123XyZ@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🚀 PASSO 2: Deploy da API (5 minutos)

### 1. Importar no Vercel

1. Acesse [https://vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione `Leoliveira2/loto-simulation`
4. Configure:

```
Project Name: loto-api
Framework: Other
Root Directory: apps/api
Build Command: pnpm vercel-build
Output Directory: dist
Install Command: pnpm install
```

### 2. Adicionar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Cole a connection string do Neon |
| `JWT_SECRET` | Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `8h` |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | Deixe vazio por enquanto (vamos atualizar depois) |

### 3. Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. **Copie a URL da API** (ex: `https://loto-api.vercel.app`)

### 4. Testar

```bash
curl https://loto-api.vercel.app/health
```

Deve retornar:
```json
{"ok":true,"timestamp":"...","env":"production"}
```

---

## 🎨 PASSO 3: Deploy do Frontend (5 minutos)

### 1. Importar no Vercel

1. Acesse [https://vercel.com/new](https://vercel.com/new) novamente
2. Clique em **"Import Git Repository"**
3. Selecione `Leoliveira2/loto-simulation` novamente
4. Configure:

```
Project Name: loto-web
Framework: Next.js
Root Directory: apps/web
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

### 2. Adicionar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Cole a URL da API (do passo 2.3) |

Exemplo: `https://loto-api.vercel.app`

### 3. Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. **Copie a URL do Frontend** (ex: `https://loto-web.vercel.app`)

---

## 🔗 PASSO 4: Conectar API e Frontend (2 minutos)

### 1. Atualizar CORS da API

1. Volte ao projeto **loto-api** no Vercel
2. Vá em **Settings → Environment Variables**
3. Edite `ALLOWED_ORIGINS`
4. Cole a URL do frontend: `https://loto-web.vercel.app`
5. Clique em **"Save"**

### 2. Redeploy da API

1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deployment
3. Clique em **"Redeploy"**
4. Aguarde 1-2 minutos

---

## 🗃️ PASSO 5: Migrations e Seed (2 minutos)

### Opção A: Via Vercel CLI (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ir para pasta da API
cd apps/api

# Baixar variáveis de ambiente
vercel env pull .env.production

# Executar migrations
pnpm prisma migrate deploy

# Executar seed
pnpm seed
```

### Opção B: Via Prisma Studio (Alternativa)

1. Acesse [https://www.prisma.io/studio](https://www.prisma.io/studio)
2. Cole a `DATABASE_URL` do Neon
3. Execute as migrations manualmente

---

## 🎉 PASSO 6: Testar Aplicação

### 1. Acessar Frontend

Abra a URL do frontend no navegador: `https://loto-web.vercel.app`

### 2. Fazer Login

Use as credenciais do seed:
- **Email**: `admin@demo.com`
- **Senha**: `admin123`

### 3. Testar Fluxo

1. ✅ Login
2. ✅ Ver lista de cenários
3. ✅ Iniciar simulação
4. ✅ Completar simulação
5. ✅ Ver histórico

---

## 🎯 URLs Finais

Após completar todos os passos:

- **Frontend**: `https://loto-web.vercel.app`
- **API**: `https://loto-api.vercel.app`
- **Banco de Dados**: Neon Dashboard

---

## 🐛 Problemas Comuns

### "CORS policy blocked"

**Solução**: Verifique se `ALLOWED_ORIGINS` da API inclui a URL do frontend e redeploy.

### "DATABASE_URL não está configurado"

**Solução**: Verifique se a variável está em Environment Variables da API no Vercel.

### "Prisma Client not found"

**Solução**: Execute `pnpm prisma:generate` localmente e faça commit.

### "Build failed"

**Solução**: Verifique os logs de build no Vercel e corrija erros.

---

## 📊 Próximos Passos

- [ ] Configurar domínio personalizado
- [ ] Adicionar mais usuários via Prisma Studio
- [ ] Criar mais cenários LOTO
- [ ] Configurar analytics
- [ ] Adicionar monitoramento de erros (Sentry)

---

## 🔗 Links Úteis

- **Documentação Completa**: [DEPLOY.md](./DEPLOY.md)
- **README**: [README.md](./README.md)
- **GitHub**: [https://github.com/Leoliveira2/loto-simulation](https://github.com/Leoliveira2/loto-simulation)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Neon Docs**: [https://neon.tech/docs](https://neon.tech/docs)

---

**✨ Pronto! Sua aplicação LOTO está no ar!**
