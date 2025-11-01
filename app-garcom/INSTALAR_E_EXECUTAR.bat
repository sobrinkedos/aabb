@echo off
echo ========================================
echo   App Garcom - Instalacao e Execucao
echo ========================================
echo.

echo [1/4] Verificando pasta...
cd /d "%~dp0"
echo Pasta atual: %CD%
echo.

echo [2/4] Instalando dependencias...
echo Isso pode demorar alguns minutos...
call npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)
echo.

echo [3/4] Instalando dependencia adicional...
call npm install @react-native-community/netinfo
if errorlevel 1 (
    echo ERRO: Falha ao instalar @react-native-community/netinfo
    pause
    exit /b 1
)
echo.

echo [4/4] Iniciando aplicacao...
echo.
echo ========================================
echo   Aplicacao iniciando!
echo ========================================
echo.
echo Pressione 'w' para abrir no navegador
echo Ou escaneie o QR code com Expo Go
echo.
call npm start

pause
