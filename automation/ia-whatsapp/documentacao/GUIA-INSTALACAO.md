# 📊 GUIA DE INSTALAÇÃO - DRA. JÚLIA ADVOCACIA

## 🚀 PASSO A PASSO COMPLETO

### 1️⃣ PREPARAÇÃO DO AMBIENTE N8N

#### Importar Workflow
1. Acesse seu N8N
2. Vá em **Workflows** → **Import from file**
3. Selecione: `workflows/dra-julia-agente-ia-advocacia.json`
4. Clique em **Import**

#### Verificar Nós Importados
✅ Webhook WhatsApp Dra. Júlia  
✅ Filtro Mensagem Válida  
✅ Processar Mensagem Jurídica  
✅ ChatGPT Dra. Júlia Principal  
✅ Sistema de Agendamento  
✅ Geração de Documentos  
✅ Cron Lembretes  

### 2️⃣ CONFIGURAÇÃO DE CREDENCIAIS

#### WhatsApp Business API
```
Nome: whatsapp-api-token
Tipo: HTTP Header Auth
Header Name: Authorization
Header Value: Bearer SEU_TOKEN_AQUI
```

#### OpenAI API
```
Nome: openai-api
Tipo: OpenAI API
API Key: sk-...SEU_TOKEN_OPENAI
```

#### Google Sheets OAuth2
```
Nome: google-sheets-oauth
Tipo: Google Sheets OAuth2
Configurar OAuth2 → Autorizar conta Google
```

#### Google Calendar OAuth2
```
Nome: google-calendar-oauth
Tipo: Google Calendar OAuth2
Configurar OAuth2 → Autorizar conta Google
```

### 3️⃣ CONFIGURAÇÃO DO GOOGLE SHEETS

#### Criar Nova Planilha
1. Acesse [Google Sheets](https://sheets.google.com)
2. Criar nova planilha
3. Nomear: "Dra Julia - Gestão Advocacia"
4. Copiar ID da URL

#### Configurar Abas
**Aba 1: Clientes_Dra_Julia**
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Nome | Telefone | Data_Contato | Tipo_Mensagem | Conteudo | Media_URL | Area_Juridica | Status | Plataforma |

**Aba 2: Consultas_Agendadas**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Data_Agendamento | Nome_Cliente | Telefone | Area_Juridica | Data_Preferida | Status | Observacoes | Plataforma |

**Aba 3: Documentos_Gerados**
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Data_Solicitacao | Tipo_Documento | Cliente | Telefone | Detalhes | Status | Conteudo_Documento | Plataforma |

### 4️⃣ CONFIGURAÇÃO DO WHATSAPP BUSINESS

#### Meta Developer Console
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Criar novo app → **Business**
3. Adicionar produto **WhatsApp**
4. Configurar número de telefone

#### Configurar Webhook
```
URL: https://seu-n8n.com/webhook/dra-julia-advocacia
Verify Token: seu_token_verificacao
Eventos: messages, message_deliveries
```

#### Testar Webhook
1. Enviar mensagem de teste
2. Verificar logs no N8N
3. Confirmar recebimento

### 5️⃣ CONFIGURAÇÃO DAS VARIÁVEIS

#### No N8N - Editar Nós
Substituir as seguintes variáveis:

**Webhook WhatsApp:**
- `SEU_PHONE_NUMBER_ID` → Seu Phone Number ID real

**Google Sheets:**
- `SEU_GOOGLE_SHEETS_ID_ADVOCACIA` → ID da sua planilha

**HTTP Requests:**
- `SEU_WHATSAPP_TOKEN` → Seu token permanente

### 6️⃣ ATIVAÇÃO DO WORKFLOW

#### Ativar Workflow
1. No N8N, clique em **Active** no workflow
2. Verificar se todos os nós estão conectados
3. Testar com mensagem de WhatsApp

#### Ativar Cron de Lembretes
1. Verificar nó "Cron Lembretes Consultas"
2. Confirmar horário: 9h (dias úteis)
3. Ativar execução automática

### 7️⃣ TESTES FUNCIONAIS

#### Teste 1: Mensagem de Texto
```
Enviar: "Olá, preciso de ajuda com um contrato"
Esperado: Resposta da Dra. Júlia sobre direito empresarial
```

#### Teste 2: Análise de Documento
```
Enviar: Foto de um contrato
Esperado: Análise detalhada do documento
```

#### Teste 3: Agendamento
```
Enviar: "Gostaria de agendar uma consulta sobre divórcio"
Esperado: Consulta agendada no Google Calendar
```

#### Teste 4: Geração de Documento
```
Enviar: "Preciso de uma procuração para representar minha mãe"
Esperado: Documento gerado e enviado
```

### 8️⃣ MONITORAMENTO

#### Logs para Acompanhar
- **N8N Executions:** Execuções do workflow
- **Google Sheets:** Registros salvos
- **Google Calendar:** Consultas agendadas
- **WhatsApp Business:** Mensagens enviadas/recebidas

#### Métricas de Sucesso
- Taxa de resposta: 100%
- Tempo de resposta: < 10 segundos
- Agendamentos realizados
- Documentos gerados

### 9️⃣ SOLUÇÃO DE PROBLEMAS

#### ❌ Webhook não recebe mensagens
```
1. Verificar URL do webhook
2. Confirmar token de verificação
3. Testar conectividade N8N
```

#### ❌ OpenAI não responde
```
1. Verificar API Key
2. Confirmar créditos disponíveis
3. Testar modelo GPT-4
```

#### ❌ Google Sheets não salva
```
1. Verificar OAuth2
2. Confirmar permissões da planilha
3. Testar credencial
```

### 🔟 PRÓXIMOS PASSOS

#### Customização
- Ajustar prompts da Dra. Júlia
- Personalizar templates de documentos
- Configurar horários de atendimento

#### Expansão
- Adicionar mais áreas jurídicas
- Integrar com CRM jurídico
- Implementar análise de sentimentos

---

🎉 **PARABÉNS! DRA. JÚLIA ESTÁ PRONTA PARA ATENDER!** ⚖️👩‍💼

💡 **Dica:** Comece com testes simples e vá evoluindo gradualmente as funcionalidades.