#!/usr/bin/env node

/**
 * Script de aplicação da migração do sistema de caixa via dashboard do Supabase
 * 
 * Este script orienta o usuário para aplicar a migração manualmente
 * quando o MCP está em modo somente leitura.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Script de Aplicação da Migração do Sistema de Caixa');
console.log('='.repeat(60));
console.log('');

// Verificar se o arquivo de migração existe
const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20250908000001_cash_management_system.sql');

if (!fs.existsSync(migrationFile)) {
  console.error('❌ Arquivo de migração não encontrado:', migrationFile);
  process.exit(1);
}

console.log('✅ Arquivo de migração encontrado');
console.log('📁 Localização:', migrationFile);
console.log('');

// Ler o conteúdo do arquivo
const migrationContent = fs.readFileSync(migrationFile, 'utf8');
const lineCount = migrationContent.split('\n').length;
const charCount = migrationContent.length;

console.log('📊 Informações da Migração:');
console.log(`   📏 Linhas: ${lineCount}`);
console.log(`   📝 Caracteres: ${charCount.toLocaleString()}`);
console.log('');

console.log('🎯 STATUS: MCP do Supabase em modo somente leitura');
console.log('💡 SOLUÇÃO: Aplicação manual via dashboard');
console.log('✅ MIGRAÇÃO CORRIGIDA: Removido erro de foreign key');
console.log('');

console.log('📋 INSTRUÇÕES PASSO A PASSO:');
console.log('');
console.log('1️⃣  ACESSE O DASHBOARD DO SUPABASE:');
console.log('    🔗 https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql');
console.log('');
console.log('2️⃣  ABRA O SQL EDITOR:');
console.log('    • Clique na aba "SQL Editor" no menu lateral');
console.log('    • Clique em "New Query" para criar uma nova consulta');
console.log('');
console.log('3️⃣  COPIE E COLE A MIGRAÇÃO:');
console.log(`    • Abra o arquivo: ${migrationFile}`);
console.log('    • Copie TODO o conteúdo (Ctrl+A → Ctrl+C)');
console.log('    • Cole no SQL Editor do Supabase (Ctrl+V)');
console.log('');
console.log('4️⃣  EXECUTE A MIGRAÇÃO:');
console.log('    • Clique no botão "RUN" (ou Ctrl+Enter)');
console.log('    • Aguarde a execução (pode levar alguns segundos)');
console.log('    • Verifique se não há erros na saída');
console.log('');
console.log('5️⃣  VERIFIQUE O RESULTADO:');
console.log('    • Execute: node check-migration.js');
console.log('    • Deve mostrar "✅ Tabelas de caixa encontradas!"');
console.log('');

console.log('🏗️  O QUE SERÁ CRIADO:');
console.log('');
console.log('📊 TABELAS PRINCIPAIS:');
console.log('   • cash_sessions         - Sessões de caixa diárias');
console.log('   • cash_transactions     - Transações financeiras');
console.log('   • payment_reconciliation - Reconciliação por método');
console.log('   • cash_audit_log        - Log de auditoria');
console.log('');
console.log('⚙️  RECURSOS AUTOMÁTICOS:');
console.log('   • 🔄 Triggers para cálculos automáticos');
console.log('   • 🔒 Row Level Security (RLS) configurado');
console.log('   • 🚀 Índices para performance otimizada');
console.log('   • 📈 Views para relatórios pré-configurados');
console.log('');
console.log('🔐 SEGURANÇA:');
console.log('   • 👤 Funcionários só veem suas próprias sessões');
console.log('   • 👥 Admins/supervisores têm acesso total');
console.log('   • 📝 Log de auditoria completo de todas as ações');
console.log('   • ✅ Validações automáticas de integridade');
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('');
console.log('🔄 APÓS APLICAR A MIGRAÇÃO:');
console.log('   1. Execute: node check-migration.js');
console.log('   2. Os hooks serão trocados automaticamente');
console.log('   3. Reinicie o servidor: npm run dev');
console.log('   4. Teste as funcionalidades no dashboard');
console.log('');
console.log('🐛 EM CASO DE PROBLEMAS:');
console.log('   • Verifique se a tabela "profiles" existe');
console.log('   • Confirme se as colunas "id", "name", "role" existem');
console.log('   • Execute linha por linha para identificar erros específicos');
console.log('');
console.log('💬 SUPORTE:');
console.log('   • Se encontrar erros, copie a mensagem completa');
console.log('   • Verifique a documentação do Supabase sobre migrações');
console.log('   • Execute queries de diagnóstico se necessário');
console.log('');

console.log('🎉 BOA SORTE COM A MIGRAÇÃO!');
console.log('='.repeat(60));