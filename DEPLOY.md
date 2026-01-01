# 🚀 Guia de Deploy - LOTO Simulator Platform

Este guia detalha o processo completo de deploy da plataforma LOTO no **Vercel** com banco de dados **Neon (PostgreSQL serverless)**.

---

## 📋 Pré-requisitos

- [ ] Conta no [GitHub](https://github.com)
- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Neon](https://neon.tech) (PostgreSQL serverless - gratuito)
- [ ] Node.js 18+ e pnpm instalados localmente

---

## 🗄️ PASSO 1: Configurar Banco de Dados (Neon)

### 1.1 Criar Projeto no Neon

1. Acesse [https://console.neon.tech](https://console.neon.tech)
2. Clique em **"Create a project"**
3. Configure:
   - **Project name**: `loto-simulator`
   - **Region**: Escolha a mais próxima (ex: `US East (Ohio)`)
   - **PostgreSQL version**: 16 (recomendado)
4. Clique em **"Create project"**

### 1.2 Obter Connection String

1. No dashboard do projeto, clique em **"Connection string"**
2. Copie a **connection string** (formato: `postgresql://user:password@host/database`)
3. **IMPORTANTE**: Salve essa string em local seguro, você precisará dela

Exemplo:
```
postgresql://neondb_owner:abc123xyz@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🔧 PASSO 2: Configurar Repositório GitHub

### 2.1 Verificar Arquivos

Certifique-se de que os seguintes arquivos estão no repositório:

```
✅ .gitignore
✅ .nvmrc
✅ vercel.json
✅ .env.example
✅ apps/api/vercel.json
✅ apps/api/.env.example
✅ apps/web/.env.local.example
```

### 2.2 Fazer Commit e Push

```bash
cd /caminho/para/loto-sim

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: preparar projeto para deploy em produção"

# Push para GitHub
git push origin main
```

---

## 🌐 PASSO 3: Deploy da API no Vercel

### 3.1 Importar Projeto

1. Acesse [https://vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `loto-simulation`
4. Configure:
   - **Project Name**: `loto-api`
   - **Framework Preset**: `Other`
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm vercel-build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 3.2 Configurar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

| Key | Value | Exemplo |
|-----|-------|---------|
| `DATABASE_URL` | Connection string do Neon | `postgresql://neondb_owner:...` |
| `JWT_SECRET` | String aleatória segura (32+ caracteres) | `sua-chave-super-secreta-aqui-123` |
| `JWT_EXPIRES_IN` | `8h` | `8h` |
| `PORT` | `4000` | `4000` |
| `NODE_ENV` | `production` | `production` |
| `ALLOWED_ORIGINS` | URLs do frontend (separadas por vírgula) | `https://loto-web.vercel.app` |

**Dica**: Para gerar `JWT_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Após o deploy, copie a **URL da API** (ex: `https://loto-api.vercel.app`)

### 3.4 Testar API

```bash
curl https://loto-api.vercel.app/health
```

Resposta esperada:
```json
{
  "ok": true,
  "timestamp": "2026-01-01T12:00:00.000Z",
  "env": "production"
}
```

---

## 🎨 PASSO 4: Deploy do Frontend no Vercel

### 4.1 Importar Projeto

1. Acesse [https://vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `loto-simulation` novamente
4. Configure:
   - **Project Name**: `loto-web`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

### 4.2 Configurar Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

| Key | Value | Exemplo |
|-----|-------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | URL da API (do passo 3.3) | `https://loto-api.vercel.app` |

### 4.3 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Após o deploy, copie a **URL do Frontend** (ex: `https://loto-web.vercel.app`)

### 4.4 Atualizar CORS da API

1. Volte ao projeto **loto-api** no Vercel
2. Vá em **Settings → Environment Variables**
3. Edite `ALLOWED_ORIGINS` e adicione a URL do frontend:
   ```
   https://loto-web.vercel.app,https://loto-web-*.vercel.app
   ```
4. Clique em **"Save"**
5. Vá em **Deployments** e clique em **"Redeploy"** no último deployment

---

## 🗃️ PASSO 5: Executar Migrations e Seed

### 5.1 Migrations via Vercel CLI

Instale o Vercel CLI:
```bash
npm i -g vercel
```

Faça login:
```bash
vercel login
```

Execute as migrations:
```bash
cd apps/api
vercel env pull .env.production
pnpm prisma migrate deploy
```

### 5.2 Seed do Banco de Dados

Execute o seed:
```bash
pnpm seed
```

Isso criará:
- **Organização**: Demo Org
- **Usuário admin**: `admin@demo.com` / `admin123`
- **Cenários**: 2 cenários LOTO de exemplo

---

## ✅ PASSO 6: Testar Aplicação

### 6.1 Acessar Frontend

1. Acesse a URL do frontend (ex: `https://loto-web.vercel.app`)
2. Clique em **"Login"**
3. Use as credenciais:
   - **Email**: `admin@demo.com`
   - **Senha**: `admin123`

### 6.2 Testar Fluxo Completo

1. ✅ Login
2. ✅ Listar cenários
3. ✅ Iniciar simulação
4. ✅ Completar simulação
5. ✅ Ver histórico

---

## 🔒 PASSO 7: Segurança e Boas Práticas

### 7.1 Configurar Domínio Personalizado (Opcional)

No Vercel:
1. Vá em **Settings → Domains**
2. Adicione seu domínio (ex: `app.seudominio.com`)
3. Configure DNS conforme instruções

### 7.2 Configurar HTTPS

O Vercel já fornece HTTPS automático via Let's Encrypt.

### 7.3 Monitoramento

- **Logs**: Vercel → Deployments → Logs
- **Analytics**: Vercel → Analytics
- **Errors**: Vercel → Errors

---

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não está configurado"

**Solução**: Verifique se a variável `DATABASE_URL` está configurada no Vercel (Settings → Environment Variables).

### Erro: "CORS policy blocked"

**Solução**: 
1. Verifique se `ALLOWED_ORIGINS` inclui a URL do frontend
2. Redeploy da API após alterar variáveis de ambiente

### Erro: "Prisma Client not found"

**Solução**: Execute `pnpm prisma:generate` localmente e faça commit do código gerado.

### Erro: "Build failed"

**Solução**: 
1. Verifique os logs de build no Vercel
2. Teste o build localmente: `pnpm build`
3. Verifique se todas as dependências estão no `package.json`

---

## 📊 Monitoramento de Custos

### Neon (Banco de Dados)

**Plano Free**:
- ✅ 0.5 GB de armazenamento
- ✅ 1 projeto
- ✅ 10 branches
- ✅ Ideal para MVP e testes

**Upgrade**: Quando ultrapassar limites, considere plano Pro ($19/mês).

### Vercel

**Plano Hobby (Free)**:
- ✅ 100 GB de bandwidth/mês
- ✅ Deployments ilimitados
- ✅ HTTPS automático
- ✅ Ideal para projetos pessoais

**Upgrade**: Para uso comercial, considere plano Pro ($20/mês por membro).

---

## 🔄 Atualizações Futuras

### Deploy Automático

O Vercel já está configurado para **deploy automático** a cada push no GitHub:

1. Faça alterações no código
2. Commit e push para `main`
3. Vercel detecta e faz deploy automaticamente

### Ambientes de Staging

Para criar ambiente de staging:

1. Crie branch `staging` no GitHub
2. No Vercel, vá em **Settings → Git**
3. Configure **Production Branch**: `main`
4. Configure **Preview Branch**: `staging`

---

## 📞 Suporte

- **Vercel**: [https://vercel.com/support](https://vercel.com/support)
- **Neon**: [https://neon.tech/docs](https://neon.tech/docs)
- **GitHub**: [https://github.com/Leoliveira2/loto-simulation/issues](https://github.com/Leoliveira2/loto-simulation/issues)

---

## ✨ Próximos Passos

- [ ] Configurar domínio personalizado
- [ ] Adicionar analytics (Google Analytics, Plausible)
- [ ] Configurar alertas de erro (Sentry)
- [ ] Implementar testes automatizados
- [ ] Configurar CI/CD com GitHub Actions

---

**🎉 Parabéns! Sua aplicação LOTO está em produção!**
