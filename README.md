# XGate Proxy - Vercel Serverless Function

Este proxy intermediário roteia requisições do Supabase para a API XGate através do Fixie Proxy, garantindo que todas as chamadas usem os IPs fixos whitelistados.

## Passo a Passo para Deploy

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Fazer Login no Vercel

```bash
vercel login
```

### 3. Fazer Deploy

Na pasta `vercel-proxy`, execute:

```bash
vercel --prod
```

### 4. Configurar Variáveis de Ambiente

No Vercel Dashboard (https://vercel.com/dashboard):

1. Acesse seu projeto
2. Vá em **Settings** > **Environment Variables**
3. Adicione:
   - `FIXIE_URL` = `http://fixie:SUA_SENHA@criterium.usefixie.com:80`
   - `AUTH_SECRET` = Gere um token secreto forte (ex: `openssl rand -hex 32`)

4. Clique em **Save**
5. Faça **Redeploy** do projeto para aplicar as variáveis

### 5. URL do Proxy

Após o deploy, você receberá uma URL como:
```
https://xgate-proxy.vercel.app/api/xgate-proxy
```

Copie esta URL - você vai precisar dela no Supabase!

## Como Usar

### Exemplo de requisição do Supabase:

```javascript
const response = await fetch('https://xgate-proxy.vercel.app/api/xgate-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Auth-Secret': process.env.AUTH_SECRET
  },
  body: JSON.stringify({
    method: 'POST',
    url: 'https://api.xgateglobal.com/auth/token',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      email: 'seu-email@xgate.com',
      password: 'sua-senha'
    }
  })
});

const data = await response.json();
```

## Segurança

- Todas as requisições devem incluir o header `X-Auth-Secret`
- O proxy valida o secret antes de processar qualquer requisição
- CORS está configurado para aceitar requisições do Supabase

## Logs

Para ver os logs:
```bash
vercel logs https://xgate-proxy.vercel.app
```
