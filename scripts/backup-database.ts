/**
 * Script de Backup do Banco de Dados Supabase
 * 
 * Este script faz backup de todas as tabelas principais do sistema
 * e salva em arquivos JSON com timestamp
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de tabelas para backup
const TABLES_TO_BACKUP = [
  'companies',
  'employees',
  'employee_credentials',
  'user_permissions',
  'comandas',
  'balcao_orders',
  'inventory',
  'inventory_movements',
  'menu_items',
  'cash_registers',
  'cash_movements',
  'payment_methods',
  'bar_tables',
  'customers',
  'categories'
];

interface BackupResult {
  table: string;
  records: number;
  success: boolean;
  error?: string;
}

/**
 * Cria diretório de backup se não existir
 */
function ensureBackupDirectory(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupDir = path.join(process.cwd(), 'backups', timestamp);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return backupDir;
}

/**
 * Faz backup de uma tabela específica
 */
async function backupTable(tableName: string): Promise<BackupResult> {
  try {
    console.log(`📦 Fazendo backup da tabela: ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Erro ao buscar dados de ${tableName}:`, error.message);
      return {
        table: tableName,
        records: 0,
        success: false,
        error: error.message
      };
    }
    
    return {
      table: tableName,
      records: data?.length || 0,
      success: true
    };
  } catch (error: any) {
    console.error(`❌ Erro ao fazer backup de ${tableName}:`, error.message);
    return {
      table: tableName,
      records: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Salva dados do backup em arquivo JSON
 */
function saveBackupToFile(backupDir: string, tableName: string, data: any[]): void {
  const filename = path.join(backupDir, `${tableName}.json`);
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Backup salvo: ${filename} (${data.length} registros)`);
}

/**
 * Gera relatório do backup
 */
function generateBackupReport(backupDir: string, results: BackupResult[]): void {
  const timestamp = new Date().toISOString();
  const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  const report = {
    timestamp,
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
 * Executa o backup completo
 */
async function runBackup(): Promise<void> {
  console.log('🚀 Iniciando backup do banco de dados...\n');
  
  const backupDir = ensureBackupDirectory();
  console.log(`📁 Diretório de backup: ${backupDir}\n`);
  
  const results: BackupResult[] = [];
  
  for (const tableName of TABLES_TO_BACKUP) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`❌ Erro ao buscar dados de ${tableName}:`, error.message);
        results.push({
          table: tableName,
          records: 0,
          success: false,
          error: error.message
        });
        continue;
      }
      
      if (data && data.length > 0) {
        saveBackupToFile(backupDir, tableName, data);
        results.push({
          table: tableName,
          records: data.length,
          success: true
        });
      } else {
        console.log(`⚠️  Tabela ${tableName} está vazia, pulando...`);
        results.push({
          table: tableName,
          records: 0,
          success: true
        });
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar ${tableName}:`, error.message);
      results.push({
        table: tableName,
        records: 0,
        success: false,
        error: error.message
      });
    }
  }
  
  generateBackupReport(backupDir, results);
  
  console.log('✅ Backup concluído com sucesso!\n');
}

// Executar backup
runBackup().catch(error => {
  console.error('❌ Erro fatal ao executar backup:', error);
  process.exit(1);
});
