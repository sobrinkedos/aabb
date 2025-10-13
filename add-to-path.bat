@echo off
echo 🚀 Adicionando AABB-system ao PATH do Windows...
echo.

REM Obter o diretório atual
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

echo 📁 Diretório atual: %CURRENT_DIR%
echo.

REM Verificar se já está no PATH
echo %PATH% | findstr /i "%CURRENT_DIR%" >nul
if %errorlevel%==0 (
    echo ✅ Diretório já está no PATH!
    echo.
    goto :show_commands
)

REM Adicionar ao PATH do usuário atual
echo 🔧 Adicionando ao PATH do usuário...
setx PATH "%PATH%;%CURRENT_DIR%"

if %errorlevel%==0 (
    echo ✅ Adicionado ao PATH com sucesso!
    echo.
    echo ⚠️  REINICIE o terminal/prompt para que as mudanças tenham efeito.
    echo.
) else (
    echo ❌ Erro ao adicionar ao PATH.
    echo 💡 Tente executar como Administrador.
    echo.
)

:show_commands
echo 📋 Comandos disponíveis após adicionar ao PATH:
echo.
echo 🌐 configure-riltons-interface.html    - Interface web interativa
echo 🔧 configure-riltons-script.js         - Script Node.js
echo 📊 configure-riltons-primeiro-usuario.sql - Script SQL direto
echo.
echo 💡 Exemplo de uso:
echo    start configure-riltons-interface.html
echo    node configure-riltons-script.js
echo.

pause