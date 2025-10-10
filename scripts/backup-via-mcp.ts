/**
 * Script de Backup via MCP (Model Context Protocol)
 * 
 * Este script usa o MCP do Supabase para fazer backup das tabelas
 * Útil quando você não tem acesso direto ao banco de dados
 */

import * as fs from 'fs';
import * as path from 'path';

// ID do projeto Supabase (aabb-producao)
const PROJECT_ID = 'jtfdzjmravketpkwjkvp';

// Lista de tabelas para backup
const TABLES_TO_BACKUP = [
  'empresas',
  'usuarios_empresa',
  'permissoes_usuario',
  'employees',
  'comandas',
  'comanda_items',
  'balcao_orders',
  'balcao_order_items',
  'inventory_items',
  'inventory_categories',
  'inventory_movements',
  'menu_items',
  'cash_sessions',
  'cash_transactions',
  'payment_reconciliation',
  'bar_tables',
  'bar_customers',
  'bar_employees',
  'customers',
  'profiles',
  'departments',
  'positions'
];

interface BackupResult {
  table: string;
  records: number;
  success: boolean;
  error?: string;
  file?: string;
}

/**
 * Cria diretório de backup
 */
function ensureBackupDirectory(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `${timestamp}_${time}_mcp`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return backupDir;
}

/**
 * Salva dados em arquivo JSON
 */
function saveToFile(backupDir: string, tableName: string, data: any[]): string {
  const filename = path.join(backupDir, `${tableName}.json`);
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  return filename;
}

/**
 * Gera relatório do backup
 */
function generateReport(backupDir: string, results: BackupResult[]): void {
  const timestamp = new Date().toISOString();
  const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  const report = {
    timestamp,
    method: 'MCP (Model Context Protocol)',
    project_id: PROJECT_ID,
    summary: {
      totalTables: results.length,
      successfulBackups: successCount,
      failedBackups: failureCount,
      totalRecords
    },
    tables: results.map(r => ({
      table: r.table,
      records: r.records,
      status: r.success ? 'success' : 'failed',
      file: r.file,
      error: r.error
    }))
  };
  
  const reportFile = path.join(backupDir, '_backup_report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('\n📊 Relatório do Backup:');
  console.log(`   Total de tabelas: ${results.length}`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas: ${failureCount}`);
  console.log(`   📝 Total de registros: ${totalRecords}`);
  console.log(`   📄 Relatório salvo em: ${reportFile}\n`);
}

/**
 * Instruções para executar o backup
 */
function printInstructions(): void {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         BACKUP VIA MCP - INSTRUÇÕES                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log('Este script requer o uso do MCP (Model Context Protocol) do Supabase.');
  console.log('Como o MCP não pode ser chamado diretamente de scripts Node.js,');
  console.log('você precisa executar os comandos manualmente via Kiro IDE.\n');
  console.log('📋 COMANDOS PARA EXECUTAR NO KIRO:\n');
  
  TABLES_TO_BACKUP.forEach((table, index) => {
    console.log(`${index + 1}. Backup da tabela "${table}":`);
    console.log(`   mcp_supabase_execute_sql`);
    console.log(`   project_id: ${PROJECT_ID}`);
    console.log(`   query: SELECT * FROM ${table}\n`);
  });
  
  console.log('\n💡 DICA: Peça ao Kiro para fazer o backup usando MCP!');
  console.log('   Exemplo: "Faça backup das tabelas usando MCP"\n');
}

// Executar
console.log('🚀 Iniciando backup via MCP...\n');
const backupDir = ensureBackupDirectory();
console.log(`📁 Diretório de backup: ${backupDir}\n`);

printInstructions();

console.log('\n✅ Script de backup via MCP preparado!');
console.log('   Use o Kiro IDE para executar os comandos MCP listados acima.\n');
