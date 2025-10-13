#!/bin/bash

# Script para adicionar AABB-system ao PATH (Linux/macOS)

echo "🚀 Adicionando AABB-system ao PATH..."
echo ""

# Obter o diretório atual
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Diretório atual: $CURRENT_DIR"
echo ""

# Determinar qual arquivo de perfil usar
if [[ "$SHELL" == *"zsh"* ]]; then
    PROFILE_FILE="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [[ "$SHELL" == *"bash"* ]]; then
    PROFILE_FILE="$HOME/.bashrc"
    SHELL_NAME="bash"
else
    PROFILE_FILE="$HOME/.profile"
    SHELL_NAME="shell"
fi

echo "🔧 Configurando para $SHELL_NAME ($PROFILE_FILE)"
echo ""

# Verificar se já está no PATH
if echo "$PATH" | grep -q "$CURRENT_DIR"; then
    echo "✅ Diretório já está no PATH!"
else
    echo "📝 Adicionando ao PATH..."
    
    # Adicionar ao arquivo de perfil
    echo "" >> "$PROFILE_FILE"
    echo "# === AABB System PATH ===" >> "$PROFILE_FILE"
    echo "export PATH=\"\$PATH:$CURRENT_DIR\"" >> "$PROFILE_FILE"
    echo "" >> "$PROFILE_FILE"
    
    # Atualizar PATH da sessão atual
    export PATH="$PATH:$CURRENT_DIR"
    
    echo "✅ Adicionado ao PATH com sucesso!"
    echo ""
    echo "⚠️  Execute 'source $PROFILE_FILE' ou reinicie o terminal para carregar as mudanças."
fi

echo ""
echo "🎯 Criando aliases para facilitar o uso..."

# Criar aliases
ALIASES="
# === AABB System Aliases ===
# Adicionado automaticamente pelo script add-to-path.sh

riltons() {
    local mode=\${1:-web}
    local base_path=\"$CURRENT_DIR\"
    
    case \"\$mode\" in
        \"web\")
            if command -v xdg-open &> /dev/null; then
                xdg-open \"\$base_path/configure-riltons-interface.html\"
            elif command -v open &> /dev/null; then
                open \"\$base_path/configure-riltons-interface.html\"
            else
                echo \"🌐 Abra manualmente: \$base_path/configure-riltons-interface.html\"
            fi
            echo \"🌐 Interface web aberta!\"
            ;;
        \"script\")
            if [[ -f \"\$base_path/configure-riltons-script.js\" ]]; then
                cd \"\$base_path\"
                node configure-riltons-script.js
            else
                echo \"❌ Script não encontrado!\"
            fi
            ;;
        \"sql\")
            if [[ -f \"\$base_path/configure-riltons-primeiro-usuario.sql\" ]]; then
                if command -v pbcopy &> /dev/null; then
                    cat \"\$base_path/configure-riltons-primeiro-usuario.sql\" | pbcopy
                    echo \"📋 SQL copiado para a área de transferência! (macOS)\"
                elif command -v xclip &> /dev/null; then
                    cat \"\$base_path/configure-riltons-primeiro-usuario.sql\" | xclip -selection clipboard
                    echo \"📋 SQL copiado para a área de transferência! (Linux)\"
                else
                    echo \"📄 Conteúdo do SQL:\"
                    cat \"\$base_path/configure-riltons-primeiro-usuario.sql\"
                fi
                echo \"Cole no SQL Editor do Supabase\"
            else
                echo \"❌ Arquivo SQL não encontrado!\"
            fi
            ;;
        *)
            echo \"💡 Modos disponíveis:\"
            echo \"   riltons web    - Interface web\"
            echo \"   riltons script - Script Node.js\"
            echo \"   riltons sql    - Copiar/mostrar SQL\"
            ;;
    esac
}

aabb-files() {
    local base_path=\"$CURRENT_DIR\"
    echo \"📁 Arquivos AABB System em: \$base_path\"
    echo \"\"
    
    ls -la \"\$base_path\"/configure-riltons* 2>/dev/null || echo \"❌ Nenhum arquivo encontrado\"
}
"

# Verificar se aliases já existem
if grep -q "AABB System Aliases" "$PROFILE_FILE" 2>/dev/null; then
    echo "✅ Aliases já existem no perfil!"
else
    echo "$ALIASES" >> "$PROFILE_FILE"
    echo "✅ Aliases adicionados ao perfil!"
fi

echo ""
echo "📋 Comandos disponíveis:"
echo ""
echo "🌐 configure-riltons-interface.html    - Interface web interativa"
echo "🔧 configure-riltons-script.js         - Script Node.js"
echo "📊 configure-riltons-primeiro-usuario.sql - Script SQL direto"
echo ""
echo "🎉 Aliases disponíveis após recarregar o terminal:"
echo "   riltons web     - Abrir interface web"
echo "   riltons script  - Executar script Node.js"
echo "   riltons sql     - Copiar/mostrar SQL"
echo "   aabb-files      - Listar arquivos do projeto"
echo ""

# Criar script de atalho executável
cat > "$CURRENT_DIR/riltons" << 'EOF'
#!/bin/bash
# Atalho para configuração do Riltons

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${1:-web}" in
    "web")
        if command -v xdg-open &> /dev/null; then
            xdg-open "$SCRIPT_DIR/configure-riltons-interface.html"
        elif command -v open &> /dev/null; then
            open "$SCRIPT_DIR/configure-riltons-interface.html"
        else
            echo "🌐 Abra manualmente: $SCRIPT_DIR/configure-riltons-interface.html"
        fi
        ;;
    "script")
        cd "$SCRIPT_DIR"
        node configure-riltons-script.js
        ;;
    "sql")
        if command -v pbcopy &> /dev/null; then
            cat "$SCRIPT_DIR/configure-riltons-primeiro-usuario.sql" | pbcopy
            echo "📋 SQL copiado para a área de transferência!"
        elif command -v xclip &> /dev/null; then
            cat "$SCRIPT_DIR/configure-riltons-primeiro-usuario.sql" | xclip -selection clipboard
            echo "📋 SQL copiado para a área de transferência!"
        else
            cat "$SCRIPT_DIR/configure-riltons-primeiro-usuario.sql"
        fi
        ;;
    *)
        echo "💡 Uso: riltons [web|script|sql]"
        ;;
esac
EOF

chmod +x "$CURRENT_DIR/riltons"
echo "✅ Script executável 'riltons' criado!"

echo ""
echo "💡 Para usar imediatamente:"
echo "   source $PROFILE_FILE"
echo "   riltons web"
echo ""