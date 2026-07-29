# Variáveis de ambiente novas (v3.0 - integração ManuADV)

Além das já existentes (OPENAI_API_KEY, WHATSAPP_TOKEN, PHONE_NUMBER_ID,
WHATSAPP_VERIFY_TOKEN), configurar no n8n (Settings → Variables):

- `MANUADV_API_URL` — URL base da API do backend ManuADV (ex: https://api.manuadv.com.br)
- `MANUADV_API_TOKEN` — token de serviço para a IA autenticar nas chamadas ao backend
  (precisa ser um token de "service account", não o JWT de um usuário comum —
  isso ainda precisa ser criado no backend do ManuADV, hoje só existe login de usuário)
- `MANUADV_WEBHOOK_SECRET` — segredo compartilhado que o backend do ManuADV envia
  no header `X-ManuADV-Secret` ao chamar o novo webhook de notificação
- `AI_ASSISTANT_NAME` — nome da assistente virtual (era fixo "Dra. Júlia", agora configurável)

## O que foi adicionado nesta versão

1. **Ação CRIAR_CLIENTE** — a IA identifica quando deve cadastrar alguém como
   cliente e chama `POST {MANUADV_API_URL}/api/clients`
2. **Ação CONSULTAR_ANDAMENTO** — a IA identifica pergunta sobre status do
   processo e chama `GET {MANUADV_API_URL}/api/cases/search?phone=...`
3. **Webhook de notificação** (`/webhook/manuadv-notificacao`, POST) — endpoint
   novo para o backend do ManuADV chamar quando quiser que a IA avise o
   cliente no WhatsApp (ex: audiência marcada, processo andou). Body esperado:
   `{ "telefone": "5513...", "mensagem": "...", "clienteNome": "..." }`,
   com header `X-ManuADV-Secret`.
4. Removido o node "Salvar Cliente Sheets" (Google Sheets não faz mais sentido
   agora que o cadastro vai direto pro banco do ManuADV)

## ⚠️ Pendências que dependem do seu retorno

- Os endpoints `/api/clients` (POST) e `/api/cases/search` (GET) são um
  **formato assumido** — preciso confirmar o formato real das rotas do
  backend ManuADV (nomes dos campos, se aceita "phone" ou "telefone", se
  `/api/cases/search` existe ou precisa ser criado)
- Autenticação de serviço (`MANUADV_API_TOKEN`) — hoje o backend só tem JWT de
  usuário logado com refresh token; precisa criar um jeito da IA se autenticar
  sem ser "um usuário" (API key fixa, client credentials, etc.)
- Onde no backend disparar o `POST /webhook/manuadv-notificacao` — normalmente
  dentro do engine de notificações que você já implementou, no mesmo ponto
  onde ele cria a Notification no banco
