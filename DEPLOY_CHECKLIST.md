# ✅ Checklist de Deploy - LOTO Simulator

Use este checklist para garantir que todos os passos foram executados corretamente.

---

## 📋 PRÉ-DEPLOY

- [ ] Código commitado no GitHub
- [ ] Conta Vercel criada e conectada ao GitHub
- [ ] Conta Neon criada

---

## 🗄️ BANCO DE DADOS

- [ ] Projeto criado no Neon
- [ ] Connection string copiada e salva
- [ ] Banco de dados testado (conexão OK)

---

## 🔧 API (Backend)

### Deploy
- [ ] Projeto importado no Vercel
- [ ] Root directory: `apps/api`
- [ ] Build command: `pnpm vercel-build`
- [ ] Output directory: `dist`

### Variáveis de Ambiente
- [ ] `DATABASE_URL` configurada
- [ ] `JWT_SECRET` configurada (32+ caracteres)
- [ ] `JWT_EXPIRES_IN` configurada (`8h`)
- [ ] `PORT` configurada (`4000`)
- [ ] `NODE_ENV` configurada (`production`)
- [ ] `ALLOWED_ORIGINS` configurada (URL do frontend)

### Validação
- [ ] Build concluído com sucesso
- [ ] URL da API copiada
- [ ] Health check testado: `curl https://loto-api.vercel.app/health`
- [ ] Resposta: `{"ok":true,...}`

---

## 🎨 FRONTEND (Web)

### Deploy
- [ ] Projeto importado no Vercel
- [ ] Root directory: `apps/web`
- [ ] Build command: `pnpm build`
- [ ] Output directory: `.next`

### Variáveis de Ambiente
- [ ] `NEXT_PUBLIC_API_BASE_URL` configurada (URL da API)

### Validação
- [ ] Build concluído com sucesso
- [ ] URL do frontend copiada
- [ ] Site acessível no navegador

---

## 🔗 INTEGRAÇÃO

- [ ] `ALLOWED_ORIGINS` da API atualizada com URL do frontend
- [ ] API redeployada após atualização de CORS
- [ ] Frontend consegue se comunicar com API

---

## 🗃️ MIGRATIONS E SEED

- [ ] Vercel CLI instalada: `npm i -g vercel`
- [ ] Login no Vercel: `vercel login`
- [ ] Variáveis de ambiente baixadas: `vercel env pull`
- [ ] Migrations executadas: `pnpm prisma migrate deploy`
- [ ] Seed executado: `pnpm seed`
- [ ] Usuário admin criado: `admin@demo.com` / `admin123`
- [ ] Cenários carregados no banco

---

## ✅ TESTES FUNCIONAIS

### Login
- [ ] Página de login acessível
- [ ] Login com `admin@demo.com` / `admin123` funciona
- [ ] Token JWT recebido e armazenado
- [ ] Redirecionamento para dashboard após login

### Cenários
- [ ] Lista de cenários carregada
- [ ] Cenários exibidos corretamente
- [ ] Detalhes do cenário acessíveis

### Simulação
- [ ] Iniciar simulação funciona
- [ ] Navegação entre nós funciona
- [ ] Escolhas são registradas
- [ ] Eventos são enviados para API
- [ ] Simulação pode ser completada
- [ ] Pontuação é calculada

### Histórico
- [ ] Histórico de sessões acessível
- [ ] Sessões listadas corretamente
- [ ] Detalhes da sessão acessíveis
- [ ] Replay de eventos funciona

---

## 🔒 SEGURANÇA

- [ ] HTTPS ativo (Vercel fornece automaticamente)
- [ ] CORS configurado corretamente
- [ ] JWT_SECRET é forte e único
- [ ] Variáveis de ambiente não expostas no código
- [ ] `.env` e `.env.local` no `.gitignore`

---

## 📊 MONITORAMENTO

- [ ] Logs da API acessíveis no Vercel
- [ ] Logs do Frontend acessíveis no Vercel
- [ ] Analytics do Vercel ativado (opcional)
- [ ] Alertas de erro configurados (opcional)

---

## 🎯 PÓS-DEPLOY

- [ ] Domínio personalizado configurado (opcional)
- [ ] DNS configurado (se domínio personalizado)
- [ ] Certificado SSL ativo
- [ ] README atualizado com URLs de produção
- [ ] Equipe notificada sobre deploy
- [ ] Documentação de API compartilhada

---

## 📈 OTIMIZAÇÕES (Opcional)

- [ ] CDN configurado (Vercel já fornece)
- [ ] Cache configurado
- [ ] Imagens otimizadas
- [ ] Bundle size analisado
- [ ] Lighthouse score > 90

---

## 🔄 DEPLOY CONTÍNUO

- [ ] Deploy automático ativo (push para `main`)
- [ ] Preview deployments ativos (pull requests)
- [ ] Branch de staging configurada (opcional)
- [ ] GitHub Actions configurado (opcional)

---

## 📞 SUPORTE E DOCUMENTAÇÃO

- [ ] Link para documentação compartilhado
- [ ] Issues do GitHub configuradas
- [ ] Contatos de suporte definidos
- [ ] Runbook de troubleshooting criado

---

## ✨ FINALIZAÇÃO

- [ ] Todos os itens acima verificados
- [ ] Aplicação testada end-to-end
- [ ] Stakeholders notificados
- [ ] Deploy marcado como concluído

---

**Data do Deploy**: _______________

**Responsável**: _______________

**URLs**:
- Frontend: _______________
- API: _______________
- Banco: _______________

---

**Status**: [ ] Em Progresso  [ ] Concluído  [ ] Bloqueado

**Notas**:
_______________________________________
_______________________________________
_______________________________________
