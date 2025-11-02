@echo off
echo ========================================
echo   Instalacao do Redesign Moderno
echo   App Garcom - Sistema de Mesas
echo ========================================
echo.

echo [1/4] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)
echo.

echo [2/4] Limpando cache do Metro Bundler...
call npx expo start -c --no-dev --minify
timeout /t 3 /nobreak >nul
echo.

echo [3/4] Verificando instalacao...
echo Verificando pacotes instalados:
call npm list moti --depth=0
call npm list react-native-reanimated --depth=0
call npm list expo-linear-gradient --depth=0
echo.

echo [4/4] Instalacao concluida!
echo.
echo ========================================
echo   Proximos Passos:
echo ========================================
echo 1. Execute: npm start
echo 2. Abra o app no dispositivo/emulador
echo 3. Consulte REDESIGN_GUIDE.md para uso
echo ========================================
echo.

pause
