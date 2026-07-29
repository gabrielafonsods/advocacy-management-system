# 🚀 SCRIPT DE PUBLICAÇÃO NO GITHUB - WINDOWS
# Dra. Júlia - Agente IA Advocacia
# Execute no PowerShell como Administrador

Write-Host "Dra. Julia - Agente IA Advocacia" -ForegroundColor Cyan
Write-Host "INICIANDO PUBLICACAO NO GITHUB" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Verificar se está no diretório correto
if (-not (Test-Path "README.md")) {
    Write-Host "❌ Erro: Execute este script no diretório raiz do projeto" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Verificando estrutura do projeto..." -ForegroundColor Yellow
Start-Sleep 1

# Verificar arquivos essenciais
$files = @("README.md", "LICENSE", "CHANGELOG.md", "CONTRIBUTING.md", ".gitignore")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file não encontrado" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Inicializando repositório Git..." -ForegroundColor Yellow
git init

Write-Host ""
Write-Host "📦 Adicionando todos os arquivos..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Criando commit inicial..." -ForegroundColor Yellow
git commit -m "🎉 Initial commit: Dra. Júlia - Agente IA Advocacia completo

✨ Funcionalidades principais:
- 🤖 Agente IA jurídica com GPT-4 + Whisper
- 📄 Análise automática de documentos jurídicos
- 🎙️ Transcrição de áudios via WhatsApp
- 📝 Geração de contratos e procurações
- 📅 Agendamento automático no Google Calendar
- 🔄 Sistema de lembretes via WhatsApp
- 📊 Gestão completa em Google Sheets

🛠️ Stack tecnológica:
- N8N Workflow Automation
- OpenAI GPT-4 & Whisper
- WhatsApp Business API
- Google Workspace Integration

🏛️ Áreas jurídicas cobertas:
- Direito Empresarial, Civil, Trabalhista
- Direito de Família, Criminal, Imobiliário
- Direito Público e Administrativo

⚖️ Projeto completo para transformar atendimento jurídico com IA

#n8n #automation #chatbot #whatsapp-business #openai #gpt4 #legal-tech #artificial-intelligence"

Write-Host ""
Write-Host "🌟 Commit criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS MANUAIS:" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣ Criar repositório no GitHub:" -ForegroundColor White
Write-Host "   → Acesse: https://github.com/new" -ForegroundColor Gray
Write-Host "   → Nome: agente-dra-julia-advocacia" -ForegroundColor Gray
Write-Host "Dra. Julia - Agente IA Advocacia completo com N8N, GPT-4 e WhatsApp Business - Analise de documentos, transcricao de audios e geracao de contratos automatizada" -ForegroundColor Gray
Write-Host "   → Visibilidade: Public" -ForegroundColor Gray
Write-Host "   → NÃO inicializar com README" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣ Conectar e enviar ao GitHub:" -ForegroundColor White
Write-Host "   → git remote add origin https://github.com/SEU_USUARIO/agente-dra-julia-advocacia.git" -ForegroundColor Yellow
Write-Host "   → git branch -M main" -ForegroundColor Yellow
Write-Host "   → git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣ Configurar Topics no GitHub:" -ForegroundColor White
Write-Host "   n8n, automation, chatbot, whatsapp-business, openai, gpt4, whisper" -ForegroundColor Gray
Write-Host "   legal-tech, artificial-intelligence, workflow, google-workspace" -ForegroundColor Gray
Write-Host "   document-analysis, brazilian-law" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣ Criar Release v1.0.0 com as release notes do arquivo:" -ForegroundColor White
Write-Host "   docs/PUBLICACAO-GITHUB.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 DICAS PARA RECRUTADORES:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ Workflow complexo com 25+ nós N8N" -ForegroundColor Green
Write-Host "✅ Integração de múltiplas APIs (WhatsApp, OpenAI, Google)" -ForegroundColor Green
Write-Host "✅ IA multimodal (texto, áudio, imagem)" -ForegroundColor Green
Write-Host "✅ Automação end-to-end completa" -ForegroundColor Green
Write-Host "✅ Documentação profissional" -ForegroundColor Green
Write-Host "✅ Projeto com valor comercial real" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 PROJETO PRONTO PARA IMPRESSIONAR! Advocacia + IA" -ForegroundColor Magenta
Write-Host ""

# Pausar para o usuário ler
Read-Host "Pressione Enter para continuar..."