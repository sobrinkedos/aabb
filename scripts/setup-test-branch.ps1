# Script PowerShell para configurar branch de teste
# Uso: .\scripts\setup-test-branch.ps1

Write-Host "🚀 Configurando Branch de Teste para Vercel" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na raiz do projeto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

# Nome da branch
$branchName = "test/vercel-aabb-test"

Write-Host "📋 Passo 1: Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   Branch atual: $currentBranch" -ForegroundColor Gray

# Verificar se a branch já existe
$branchExists = git branch --list $branchName
if ($branchExists) {
    Write-Host "⚠️  Branch '$branchName' já existe!" -ForegroundColor Yellow
    $response = Read-Host "   Deseja mudar para ela? (s/n)"
    if ($response -eq "s") {
        git checkout $branchName
        Write-Host "✅ Mudado para branch existente" -ForegroundColor Green
    }
} else {
    Write-Host "📋 Passo 2: Criando nova branch..." -ForegroundColor Yellow
    git checkout -b $branchName
    Write-Host "✅ Branch '$branchName' criada!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Passo 3: Criando arquivo .env.test..." -ForegroundColor Yellow

$envTestContent = @"
# Supabase - Projeto aabb-test
VITE_SUPABASE_URL=https://wznycskqsavpmejwpksp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8

# Ambiente
NODE_ENV=test
VITE_APP_ENV=test
"@

Set-Content -Path ".env.test" -Value $envTestContent
Write-Host "✅ Arquivo .env.test criado!" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Passo 4: Verificando .gitignore..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch "\.env\.test") {
        Write-Host "   Adicionando .env.test ao .gitignore..." -ForegroundColor Gray
        Add-Content -Path ".gitignore" -Value "`n# Ambiente de teste`n.env.test"
        Write-Host "✅ .gitignore atualizado!" -ForegroundColor Green
    } else {
        Write-Host "✅ .env.test já está no .gitignore" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📋 Passo 5: Preparando commit..." -ForegroundColor Yellow
git add .env.test
git add .gitignore

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Configuração local concluída!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Fazer commit das mudanças:" -ForegroundColor White
Write-Host "   git commit -m 'feat: configurar ambiente de teste (aabb-test)'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Fazer push da branch:" -ForegroundColor White
Write-Host "   git push origin $branchName" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configurar variáveis na Vercel:" -ForegroundColor White
Write-Host "   - Acesse: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   - Vá em Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   - Adicione as variáveis para a branch '$branchName'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Consulte o guia completo:" -ForegroundColor White
Write-Host "   GUIA_DEPLOY_VERCEL_TESTE.md" -ForegroundColor Gray
Write-Host ""

Write-Host "🔑 Credenciais do aabb-test:" -ForegroundColor Cyan
Write-Host "   URL: https://wznycskqsavpmejwpksp.supabase.co" -ForegroundColor Gray
Write-Host "   Anon Key: (já configurada no .env.test)" -ForegroundColor Gray
Write-Host ""

$commitNow = Read-Host "Deseja fazer o commit agora? (s/n)"
if ($commitNow -eq "s") {
    git commit -m "feat: configurar ambiente de teste (aabb-test)"
    Write-Host "✅ Commit realizado!" -ForegroundColor Green
    Write-Host ""
    
    $pushNow = Read-Host "Deseja fazer o push agora? (s/n)"
    if ($pushNow -eq "s") {
        git push origin $branchName
        Write-Host "✅ Push realizado!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Branch de teste configurada e enviada!" -ForegroundColor Green
        Write-Host "   Agora configure as variáveis na Vercel." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✨ Script concluído!" -ForegroundColor Green
