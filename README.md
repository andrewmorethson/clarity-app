# Clarity App 🎯
Analytics inteligente para criadores e agências TikTok

---

## 🚀 Como rodar (passo a passo)

### 1. Criar banco de dados gratuito (Supabase)
1. Acesse https://supabase.com e crie uma conta
2. Clique em "New Project"
3. Dê um nome (ex: clarity-db) e crie uma senha forte
4. Após criar, vá em **Settings → Database**
5. Copie a "Connection string" (URI)
6. Cole no `.env.local` no campo `DATABASE_URL`

### 2. Configurar variáveis de ambiente
1. Abra o arquivo `.env.local` (já criado com suas chaves)
2. Substitua `DATABASE_URL` com a string do Supabase
3. Gere um `NEXTAUTH_SECRET` forte em: https://generate-secret.vercel.app/32

### 3. Instalar dependências
```bash
npm install
```

### 4. Criar tabelas no banco
```bash
npm run db:push
```

### 5. Rodar localmente
```bash
npm run dev
```
Acesse: http://localhost:3000
Login: admin / teste

---

## 📦 Deploy na Vercel

1. Suba o projeto no GitHub (sem o `.env.local`!)
2. Acesse https://vercel.com → "New Project" → importe seu repo
3. Em **Environment Variables**, adicione todas as variáveis do `.env.local`
4. Clique em Deploy

---

## 🔗 Configurar TikTok Developer App

1. Acesse https://developers.tiktok.com → seu app
2. Em **Redirect URIs**, adicione:
   - `http://localhost:3000/api/auth/tiktok-callback` (dev)
   - `https://seu-app.vercel.app/api/auth/tiktok-callback` (prod)
3. Solicite as permissões: `user.info.basic`, `video.list`

---

## 💳 Configurar Cakto

1. No painel Cakto, crie 3 produtos:
   - Starter (R$49/mês)
   - Pro (R$129/mês)
   - Agency (R$299/mês)
2. Copie os IDs de cada produto
3. Cole em `lib/cakto.ts` nos campos `caktoProductId`
4. Configure o webhook em: `https://seu-app.vercel.app/api/webhooks/cakto`

---

## 🏗️ Estrutura do projeto

```
clarity-app/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth].ts     # Auth (login)
│   │   │   └── tiktok-callback.ts   # OAuth TikTok
│   │   ├── diagnosis/
│   │   │   └── [accountId].ts       # Diagnóstico IA
│   │   └── webhooks/
│   │       └── cakto.ts             # Webhooks de pagamento
│   ├── login.tsx                    # Tela de login
│   └── dashboard.tsx                # App principal
├── lib/
│   ├── tiktok.ts                    # Integração TikTok API
│   ├── claude.ts                    # Diagnóstico com Claude
│   └── cakto.ts                     # Pagamentos
├── prisma/
│   └── schema.prisma                # Banco de dados
└── .env.local                       # Suas chaves (não sobe pro git!)
```
