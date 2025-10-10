# Script para verificar configuração da branch de teste
# Uso: .\scripts\verify-test-setup.ps1

Write-Host "🔍 Verificando Configuração da Branch de Teste" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Verificar se está na raiz do projeto
Write-Host "📋 Verificando estrutura do projeto..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Estrutura do projeto OK" -ForegroundColor Green
Write-Host ""

# Verificar branch atual
Write-Host "📋 Verificando branch Git..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Branch atual: $currentBranch" -ForegroundColor Gray

if ($currentBranch -eq "test/vercel-aabb-test") {
    Write-Host "✅ Você está na branch de teste!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Você não está na branch de teste" -ForegroundColor Yellow
    Write-Host "   Para mudar: git checkout test/vercel-aabb-test" -ForegroundColor Gray
    $allGood = $false
}
Write-Host ""

# Verificar arquivo .env.test
Write-Host "📋 Verificando arquivo .env.test..." -ForegroundColor Yellow
if (Test-Path ".env.test") {
    Write-Host "✅ Arquivo .env.test existe" -ForegroundColor Green
    
    $envContent = Get-Content ".env.test" -Raw
    
    # Verificar URL
    if ($envContent -match "wznycskqsavpmejwpksp") {
        Write-Host "✅ URL do aabb-test configurada" -ForegroundColor Green
    } else {
        Write-Host "❌ URL do aabb-test não encontrada" -ForegroundColor Red
        $allGood = $false
    }
    
    # Verificar Anon Key
    if ($envContent -match "VITE_SUPABASE_ANON_KEY") {
        Write-Host "✅ Anon Key configurada" -ForegroundColor Green
    } else {
        Write-Host "❌ Anon Key não encontrada" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "❌ Arquivo .env.test não encontrado" -ForegroundColor Red
    Write-Host "   Execute: .\scripts\setup-test-branch.ps1" -ForegroundColor Gray
    $allGood = $false
}
Write-Host ""

# Verificar arquivo .env.test.vercel
Write-Host "📋 Verificando arquivo .env.test.vercel..." -ForegroundColor Yellow
if (Test-Path ".env.test.vercel") {
    Write-Host "✅ Arquivo .env.test.vercel existe" -ForegroundColor Green
} else {
    Write-Host "⚠️  Arquivo .env.test.vercel não encontrado" -ForegroundColor Yellow
    Write-Host "   Este arquivo é opcional, mas útil como referência" -ForegroundColor Gray
}
Write-Host ""

# Verificar se a branch foi enviada para o remoto
Write-Host "📋 Verificando branch remota..." -ForegroundColor Yellow
$remoteBranch = git ls-remote --heads origin test/vercel-aabb-test
if ($remoteBranch) {
    Write-Host "✅ Branch existe no repositório remoto" -ForegroundColor Green
} else {
    Write-Host "❌ Branch não encontrada no remoto" -ForegroundColor Red
    Write-Host "   Execute: git push origin test/vercel-aabb-test" -ForegroundColor Gray
    $allGood = $false
}
Write-Host ""

# Verificar Vercel CLI
Write-Host "📋 Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelInstalled) {
    Write-Host "✅ Vercel CLI instalada" -ForegroundColor Green
    $vercelVersion = vercel --version
    Write-Host "   Versão: $vercelVersion" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Vercel CLI não instalada" -ForegroundColor Yellow
    Write-Host "   Para instalar: npm install -g vercel" -ForegroundColor Gray
}
Write-Host ""

# Verificar documentação
Write-Host "📋 Verificando documentação..." -ForegroundColor Yellow
$docs = @(
    "GUIA_DEPLOY_VERCEL_TESTE.md",
    "SETUP_VERCEL_TESTE_RAPIDO.md",
    "VARIAVEIS_VERCEL_TESTE.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "❌ $doc não encontrado" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# Resumo
Write-Host "=============================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ TUDO CONFIGURADO CORRETAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Configure as variáveis na Vercel" -ForegroundColor White
    Write-Host "   Consulte: VARIAVEIS_VERCEL_TESTE.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Acesse o Dashboard da Vercel:" -ForegroundColor White
    Write-Host "   https://vercel.com/dashboard" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Vá em Settings → Environment Variables" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Adicione as variáveis para a branch:" -ForegroundColor White
    Write-Host "   test/vercel-aabb-test" -ForegroundColor Gray
} else {
    Write-Host "⚠️  ALGUMAS CONFIGURAÇÕES ESTÃO FALTANDO" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Ações necessárias:" -ForegroundColor Yellow
    Write-Host "1. Execute o script de setup:" -ForegroundColor White
    Write-Host "   .\scripts\setup-test-branch.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Faça push da branch:" -ForegroundColor White
    Write-Host "   git push origin test/vercel-aabb-test" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Configure as variáveis na Vercel" -ForegroundColor White
    Write-Host "   Consulte: VARIAVEIS_VERCEL_TESTE.md" -ForegroundColor Gray
}
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Informações úteis
Write-Host "📚 Documentação disponível:" -ForegroundColor Cyan
Write-Host "   - GUIA_DEPLOY_VERCEL_TESTE.md (Guia completo)" -ForegroundColor Gray
Write-Host "   - SETUP_VERCEL_TESTE_RAPIDO.md (Guia rápido)" -ForegroundColor Gray
Write-Host "   - VARIAVEIS_VERCEL_TESTE.md (Lista de variáveis)" -ForegroundColor Gray
Write-Host ""

Write-Host "🔑 Credenciais do aabb-test:" -ForegroundColor Cyan
Write-Host "   URL: https://wznycskqsavpmejwpksp.supabase.co" -ForegroundColor Gray
Write-Host "   Project ID: wznycskqsavpmejwpksp" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Verificação concluída!" -ForegroundColor Green
