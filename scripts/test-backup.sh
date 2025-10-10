#!/bin/bash

# Script de teste de backup
# Este script testa se o backup está funcionando corretamente

echo "🧪 Testando sistema de backup..."
echo ""

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Copie .env.example para .env e configure as variáveis"
    exit 1
fi

echo "✅ Arquivo .env encontrado"

# Verificar se tsx está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ npx não encontrado! Instale Node.js"
    exit 1
fi

echo "✅ npx disponível"

# Criar diretório de backups se não existir
mkdir -p backups

echo "✅ Diretório de backups criado"
echo ""

# Executar backup
echo "🚀 Executando backup de teste..."
npm run backup:db

# Verificar se backup foi criado
LATEST_BACKUP=$(ls -t backups/ | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ Nenhum backup foi criado!"
    exit 1
fi

echo ""
echo "✅ Backup criado com sucesso!"
echo "📁 Localização: backups/$LATEST_BACKUP"
echo ""

# Listar arquivos do backup
echo "📋 Arquivos no backup:"
ls -lh "backups/$LATEST_BACKUP"

echo ""
echo "✅ Teste de backup concluído com sucesso!"
