/**
 * Script de Restauração do Banco de Dados Supabase
 * 
 * Este script restaura dados de backup para o banco de dados
 * ATENÇÃO: Use com cuidado em produção!
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface RestoreResult {
  table: string;
  records: number;
  success: boolean;
  error?: string;
}

/**
 * Pergunta ao usuário se deseja continuar
 */
async function confirmRestore(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER dados existentes. Deseja continuar? (sim/não): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'sim');
    });
  });
}

/**
 * Lista diretórios de backup disponíveis
 */
function listBackupDirectories(): string[] {
  const backupsDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    console.log('❌ Nenhum backup encontrado. Execute o script de backup primeiro.');
    return [];
  }
  
  return fs.readdirSync(backupsDir)
    .filter(dir => fs.statSync(path.join(backupsDir, dir)).isDirectory())
    .sort()
    .reverse(); // Mais recente primeiro
}

/**
 * Restaura uma tabela específica
 */
async function restoreTable(backupDir: string, tableName: string): Promise<RestoreResult> {
  try {
    const filename = path.join(backupDir, `${tableName}.json`);
    
    if (!fs.existsSync(filename)) {
      console.log(`⚠️  Arquivo de backup não encontrado para ${tableName}, pulando...`);
      return {
        table: tableName,
        records: 0,
        success: true
      };
    }
    
    const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
    
    if (!data || data.length === 0) {
      console.log(`⚠️  Tabela ${tableName} está vazia no backup, pulando...`);
      return {
        table: tableName,
        records: 0,
        success: true
      };
    }
    
    console.log(`📥 Restaurando ${tableName} (${data.length} registros)...`);
    
    // Inserir dados em lotes de 100
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Erro ao restaurar lote de ${tableName}:`, error.message);
        return {
          table: tableName,
          records: totalInserted,
          success: false,
          error: error.message
        };
      }
      
      totalInserted += batch.length;
    }
    
    console.log(`✅ ${tableName} restaurado com sucesso (${totalInserted} registros)`);
    
    return {
      table: tableName,
      records: totalInserted,
      success: true
    };
  } catch (error: any) {
    console.error(`❌ Erro ao restaurar ${tableName}:`, error.message);
    return {
      table: tableName,
      records: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Gera relatório da restauração
 */
function generateRestoreReport(results: RestoreResult[]): void {
  const totalRecords = results.reduce((sum, r) => sum + r.records, 0);
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log('\n📊 Relatório da Restauração:');
  console.log(`   Total de tabelas: ${results.length}`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Falhas: ${failureCount}`);
  console.log(`   📝 Total de registros restaurados: ${totalRecords}\n`);
  
  if (failureCount > 0) {
    console.log('❌ Tabelas com falha:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }
}

/**
 * Executa a restauração
 */
async function runRestore(): Promise<void> {
  console.log('🔄 Iniciando restauração do banco de dados...\n');
  
  const backupDirs = listBackupDirectories();
  
  if (backupDirs.length === 0) {
    return;
  }
  
  console.log('📁 Backups disponíveis:');
  backupDirs.forEach((dir, index) => {
    console.log(`   ${index + 1}. ${dir}`);
  });
  
  // Por padrão, usar o backup mais recente
  const selectedBackup = backupDirs[0];
  const backupDir = path.join(process.cwd(), 'backups', selectedBackup);
  
  console.log(`\n📂 Usando backup: ${selectedBackup}`);
  
  // Confirmar com usuário
  const confirmed = await confirmRestore();
  
  if (!confirmed) {
    console.log('❌ Restauração cancelada pelo usuário.');
    return;
  }
  
  console.log('\n🚀 Iniciando restauração...\n');
  
  // Ler relatório do backup para saber quais tabelas restaurar
  const reportFile = path.join(backupDir, '_backup_report.json');
  let tablesToRestore: string[] = [];
  
  if (fs.existsSync(reportFile)) {
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf-8'));
    tablesToRestore = report.tables
      .filter((t: any) => t.status === 'success' && t.records > 0)
      .map((t: any) => t.table);
  } else {
    // Se não houver relatório, tentar restaurar todos os arquivos JSON
    tablesToRestore = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json') && !file.startsWith('_'))
      .map(file => file.replace('.json', ''));
  }
  
  const results: RestoreResult[] = [];
  
  for (const tableName of tablesToRestore) {
    const result = await restoreTable(backupDir, tableName);
    results.push(result);
  }
  
  generateRestoreReport(results);
  
  console.log('✅ Restauração concluída!\n');
}

// Executar restauração
runRestore().catch(error => {
  console.error('❌ Erro fatal ao executar restauração:', error);
  process.exit(1);
});
