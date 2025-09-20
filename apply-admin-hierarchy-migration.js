#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Script de Aplicação da Migração de Hierarquia Administrativa');
console.log('============================================================');

// Localizar o arquivo de migração
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250119000001_add_admin_hierarchy.sql');

if (!fs.existsSync(migrationPath)) {
  console.log('❌ Arquivo de migração não encontrado!');
  console.log(`📁 Procurado em: ${migrationPath}`);
  process.exit(1);
}

console.log('✅ Arquivo de migração encontrado');
console.log(`📁 Localização: ${migrationPath}`);

// Ler o conteúdo da migração
const migrationContent = fs.readFileSync(migrationPath, 'utf8');
const lines = migrationContent.split('\n').length;
const chars = migrationContent.length;

console.log('📊 Informações da Migração:');
console.log(`   📏 Linhas: ${lines.toLocaleString()}`);
console.log(`   📝 Caracteres: ${chars.toLocaleString()}`);
console.log('');

console.log('🎯 STATUS: MCP do Supabase em modo somente leitura');
console.log('💡 SOLUÇÃO: Aplicação manual via dashboard');
console.log('');

console.log('📋 INSTRUÇÕES PASSO A PASSO:');
console.log('');
console.log('1️⃣  ACESSE O DASHBOARD DO SUPABASE:');
console.log('    🔗 https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql');
console.log('');
console.log('2️⃣  ABRA O SQL EDITOR:');
console.log('    • Clique na aba "SQL Editor" no menu lateral');
console.log('    • Clique em "New Query" para criar uma nova consulta');
console.log('');
console.log('3️⃣  COPIE E COLE A MIGRAÇÃO:');
console.log(`    • Abra o arquivo: ${migrationPath}`);
console.log('    • Copie TODO o conteúdo (Ctrl+A → Ctrl+C)');
console.log('    • Cole no SQL Editor do Supabase (Ctrl+V)');
console.log('');
console.log('4️⃣  EXECUTE A MIGRAÇÃO:');
console.log('    • Clique no botão "RUN" (ou Ctrl+Enter)');
console.log('    • Aguarde a execução (pode levar alguns segundos)');
console.log('    • Verifique se não há erros na saída');
console.log('');
console.log('5️⃣  VERIFIQUE O RESULTADO:');
console.log('    • Execute: node check-admin-hierarchy.js');
console.log('    • Deve mostrar "✅ Sistema de hierarquia configurado!"');
console.log('');

console.log('🏗️  O QUE SERÁ CRIADO/ATUALIZADO:');
console.log('');
console.log('📊 CAMPOS ADICIONADOS:');
console.log('   • papel                 - Hierarquia (SUPER_ADMIN, ADMIN, MANAGER, USER)');
console.log('   • is_primeiro_usuario   - Flag para identificar primeiro usuário');
console.log('');
console.log('⚙️  RECURSOS AUTOMÁTICOS:');
console.log('   • 🔄 Triggers para validação de primeiro usuário');
console.log('   • 🔄 Triggers para configuração automática');
console.log('   • 🔒 Políticas RLS atualizadas para hierarquia');
console.log('   • 🚀 Funções para verificação de privilégios');
console.log('');
console.log('🔐 SEGURANÇA:');
console.log('   • 👤 SUPER_ADMIN tem acesso total');
console.log('   • 👥 ADMIN tem acesso limitado (sem configurações críticas)');
console.log('   • 📝 MANAGER pode gerenciar usuários e relatórios');
console.log('   • ✅ USER tem acesso apenas aos módulos permitidos');
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('');
console.log('🔄 APÓS APLICAR A MIGRAÇÃO:');
console.log('   1. Execute: node check-admin-hierarchy.js');
console.log('   2. Atualize os hooks de autenticação');
console.log('   3. Reinicie o servidor: npm run dev');
console.log('   4. Teste o registro de nova empresa');
console.log('');
console.log('🐛 EM CASO DE PROBLEMAS:');
console.log('   • Verifique se a tabela "usuarios_empresa" existe');
console.log('   • Confirme se as colunas básicas estão presentes');
console.log('   • Execute linha por linha para identificar erros específicos');
console.log('');

console.log('💬 SUPORTE:');
console.log('   • Se encontrar erros, copie a mensagem completa');
console.log('   • Verifique a documentação do Supabase sobre triggers');
console.log('   • Execute queries de diagnóstico se necessário');
console.log('');

console.log('🎉 BOA SORTE COM A MIGRAÇÃO!');
console.log('============================================================');
console.log('');

// Mostrar o conteúdo da migração para facilitar a cópia
console.log('📄 CONTEÚDO DA MIGRAÇÃO (para copiar):');
console.log('============================================================');
console.log(migrationContent);
console.log('============================================================');