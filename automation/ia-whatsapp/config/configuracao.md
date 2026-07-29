# 🔧 CONFIGURAÇÃO - DRA. JÚLIA ADVOCACIA

## 📋 Variáveis de Ambiente Necessárias

### WhatsApp Business API
```env
WHATSAPP_TOKEN=seu_token_permanente_meta
PHONE_NUMBER_ID=seu_phone_number_id
WEBHOOK_VERIFY_TOKEN=seu_token_verificacao
```

### OpenAI API
```env
OPENAI_API_KEY=sua_chave_openai
# Modelos utilizados (v2.0):
# - gpt-4o (conversas + análise de documentos com visão)
# - whisper-1 (transcrição áudio)
# NOTA: gpt-4-vision-preview foi descontinuado e substituído por gpt-4o
```

### Google Workspace
```env
GOOGLE_SHEETS_ID_ADVOCACIA=id_da_planilha_advocacia
GOOGLE_CALENDAR_ID=primary_ou_id_calendario
```

## 🔗 URLs de Configuração

### Webhook WhatsApp
```
URL Webhook: https://seu-n8n.com/webhook/dra-julia-advocacia
Método: POST e GET
Campos Obrigatórios (POST): messages, contacts
Verificação Meta (GET): hub.mode, hub.verify_token, hub.challenge
API Version: v20.0 (Graph API)
```

> ⚠️ **v2.0**: O Meta exige que o webhook responda ao challenge de verificação (GET).
> Configure `WEBHOOK_VERIFY_TOKEN` com um valor aleatório e registre-o no painel da Meta.

### Google Sheets - Estrutura Necessária
**Aba 1:** `Clientes_Dra_Julia`  
**Aba 2:** `Consultas_Agendadas`  
**Aba 3:** `Documentos_Gerados`  

## 🎯 IDs dos Nós N8N (v2.0 — 35 nós)
```
webhook-whatsapp-julia          → Recebe mensagens WhatsApp
guardrail-webhook-validation    → Valida challenge + payload
roteador-challenge              → Roteia challenge vs mensagem
responder-challenge             → Responde verificação Meta
filtro-payload-valido           → Filtra payloads inválidos
ignorar-invalido                → Rejeita silenciosamente
processar-mensagem-julia        → Extrai + anti-replay + truncamento
verificar-skip                  → Ignora stickers/msgs antigas
responder-skip                  → OK silencioso
salvar-cliente-sheets           → Registra contato (non-blocking)
verificar-audio                 → Roteia áudio
obter-url-audio                 → URL do áudio (Graph API)
baixar-audio                    → Download binário do áudio
transcrever-audio               → Whisper STT
verificar-documento             → Roteia documento/imagem
obter-url-documento             → URL do documento
analisar-documento              → GPT-4o Vision
combinar-resultados             → Merge multimodal + classificação
chatgpt-principal               → GPT-4o com 6 guardrails
interpretar-resposta            → Detecta GERAR_DOCUMENTO / AGENDAR
check-gerar-doc                 → Roteador geração de doc
check-agendar                   → Roteador agendamento
gerar-documento                 → GPT-4o geração documento
preparar-doc                    → Extrai texto do documento
salvar-doc-sheets               → Salva documento no Sheets
criar-evento-calendar           → Cria evento no Calendar
salvar-consulta-sheets          → Salva consulta no Sheets
consolidar-resposta             → Sanitiza resposta final
enviar-resposta-whatsapp        → Envia mensagem (v20.0, sem token hardcoded)
response-webhook                → Fecha webhook 200 OK
cron-lembretes                  → Cron 9h dias úteis
buscar-consultas                → Busca eventos Calendar
filtrar-consultas               → Filtra e valida telefones E.164
tem-consultas                   → Há consultas hoje?
enviar-lembrete                 → Envia lembrete WhatsApp
```

## ⚙️ Credenciais N8N Necessárias
- `whatsapp-api-token` (HTTP Header Auth)
- `openai-api` (OpenAI API)
- `google-sheets-oauth` (Google Sheets OAuth2)
- `google-calendar-oauth` (Google Calendar OAuth2)

## 🕘 Configuração do Cron
```
Cron Expression: 0 9 * * 1-5
Descrição: Lembretes de consulta às 9h (dias úteis)
```

## 🔒 Segurança (v2.0)
- **NUNCA** coloque tokens diretamente no JSON do workflow
- Use variáveis de ambiente (`$env['WHATSAPP_TOKEN']`, `$env['PHONE_NUMBER_ID']`, etc.)
- Configure `WEBHOOK_VERIFY_TOKEN` com valor aleatório seguro (32+ caracteres)
- Rotacione tokens periodicamente
- O workflow descarta automaticamente mensagens com mais de 5 minutos (anti-replay)
- Mensagens excedem 4.000 caracteres são truncadas automaticamente (anti-prompt-injection por volume)

## ⚠️ Notas Importantes
- Mantenha os tokens seguros e nunca os commite no Git
- Configure as permissões corretas no Google Workspace (Sheets + Calendar)
- Teste o webhook challenge (GET) antes de ativar no Meta Business
- Monitore os logs de erro — todos os nós têm `onError` configurado
- O campo `saveDataErrorExecution: "all"` está ativo para depuração