# Script PowerShell para adicionar AABB-system ao PATH
# Execute como Administrador para adicionar ao PATH do sistema

Write-Host "🚀 Adicionando AABB-system ao PATH do Windows..." -ForegroundColor Green
Write-Host ""

# Obter o diretório atual
$currentDir = Get-Location
Write-Host "📁 Diretório atual: $currentDir" -ForegroundColor Cyan
Write-Host ""

# Verificar se já está no PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -like "*$currentDir*") {
    Write-Host "✅ Diretório já está no PATH!" -ForegroundColor Green
    Write-Host ""
} else {
    try {
        # Adicionar ao PATH do usuário
        Write-Host "🔧 Adicionando ao PATH do usuário..." -ForegroundColor Yellow
        
        $newPath = "$currentPath;$currentDir"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        
        Write-Host "✅ Adicionado ao PATH com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  REINICIE o terminal/PowerShell para que as mudanças tenham efeito." -ForegroundColor Yellow
        Write-Host ""
        
        # Atualizar PATH da sessão atual
        $env:PATH = "$env:PATH;$currentDir"
        Write-Host "✅ PATH da sessão atual atualizado temporariamente." -ForegroundColor Green
        Write-Host ""
        
    } catch {
        Write-Host "❌ Erro ao adicionar ao PATH: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Tente executar como Administrador." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Verificar se é administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($isAdmin) {
    Write-Host "🔑 Executando como Administrador" -ForegroundColor Green
    
    # Opção para adicionar ao PATH do sistema
    $addToSystem = Read-Host "Deseja adicionar ao PATH do SISTEMA (todos os usuários)? (s/n)"
    
    if ($addToSystem -eq "s" -or $addToSystem -eq "S") {
        try {
            $systemPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
            if ($systemPath -notlike "*$currentDir*") {
                $newSystemPath = "$systemPath;$currentDir"
                [Environment]::SetEnvironmentVariable("PATH", $newSystemPath, "Machine")
                Write-Host "✅ Adicionado ao PATH do sistema!" -ForegroundColor Green
            } else {
                Write-Host "✅ Já está no PATH do sistema!" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Erro ao adicionar ao PATH do sistema: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "💡 Para adicionar ao PATH do sistema, execute como Administrador" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Comandos disponíveis após adicionar ao PATH:" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 configure-riltons-interface.html    - Interface web interativa" -ForegroundColor White
Write-Host "🔧 configure-riltons-script.js         - Script Node.js" -ForegroundColor White
Write-Host "📊 configure-riltons-primeiro-usuario.sql - Script SQL direto" -ForegroundColor White
Write-Host ""
Write-Host "💡 Exemplo de uso:" -ForegroundColor Yellow
Write-Host "   start configure-riltons-interface.html" -ForegroundColor Gray
Write-Host "   node configure-riltons-script.js" -ForegroundColor Gray
Write-Host ""

# Criar aliases para facilitar o uso
Write-Host "🎯 Criando aliases para facilitar o uso..." -ForegroundColor Green

# Verificar se existe perfil do PowerShell
$profilePath = $PROFILE
$profileDir = Split-Path $profilePath -Parent

if (!(Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Adicionar aliases ao perfil
$aliases = @"

# === AABB System Aliases ===
# Adicionado automaticamente pelo script add-to-path.ps1

function Start-RiltonsConfig {
    param([string]`$Mode = "web")
    
    `$basePath = "$currentDir"
    
    switch (`$Mode.ToLower()) {
        "web" { 
            Start-Process "`$basePath\configure-riltons-interface.html"
            Write-Host "🌐 Interface web aberta!" -ForegroundColor Green
        }
        "script" { 
            if (Test-Path "`$basePath\configure-riltons-script.js") {
                Set-Location `$basePath
                node configure-riltons-script.js
            } else {
                Write-Host "❌ Script não encontrado!" -ForegroundColor Red
            }
        }
        "sql" { 
            if (Test-Path "`$basePath\configure-riltons-primeiro-usuario.sql") {
                Get-Content "`$basePath\configure-riltons-primeiro-usuario.sql" | Set-Clipboard
                Write-Host "📋 SQL copiado para a área de transferência!" -ForegroundColor Green
                Write-Host "Cole no SQL Editor do Supabase" -ForegroundColor Yellow
            } else {
                Write-Host "❌ Arquivo SQL não encontrado!" -ForegroundColor Red
            }
        }
        default {
            Write-Host "💡 Modos disponíveis:" -ForegroundColor Yellow
            Write-Host "   riltons web    - Interface web" -ForegroundColor White
            Write-Host "   riltons script - Script Node.js" -ForegroundColor White
            Write-Host "   riltons sql    - Copiar SQL" -ForegroundColor White
        }
    }
}

# Alias simples
Set-Alias -Name riltons -Value Start-RiltonsConfig

# Função para listar arquivos AABB
function Show-AABBFiles {
    `$basePath = "$currentDir"
    Write-Host "📁 Arquivos AABB System em: `$basePath" -ForegroundColor Cyan
    Write-Host ""
    
    Get-ChildItem -Path `$basePath -Name "configure-riltons*" | ForEach-Object {
        Write-Host "📄 `$_" -ForegroundColor White
    }
}

Set-Alias -Name aabb-files -Value Show-AABBFiles

"@

if (Test-Path $profilePath) {
    $currentProfile = Get-Content $profilePath -Raw
    if ($currentProfile -notlike "*AABB System Aliases*") {
        Add-Content -Path $profilePath -Value $aliases
        Write-Host "✅ Aliases adicionados ao perfil do PowerShell!" -ForegroundColor Green
    } else {
        Write-Host "✅ Aliases já existem no perfil!" -ForegroundColor Green
    }
} else {
    Set-Content -Path $profilePath -Value $aliases
    Write-Host "✅ Perfil criado com aliases!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Aliases disponíveis após reiniciar o PowerShell:" -ForegroundColor Green
Write-Host "   riltons web     - Abrir interface web" -ForegroundColor White
Write-Host "   riltons script  - Executar script Node.js" -ForegroundColor White
Write-Host "   riltons sql     - Copiar SQL para clipboard" -ForegroundColor White
Write-Host "   aabb-files      - Listar arquivos do projeto" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")