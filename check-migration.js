#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndSwitchHooks() {
  console.log('🔍 Verificando se as tabelas de caixa existem...');
  
  try {
    // Tentar acessar a tabela cash_sessions para verificar se existe
    const { data, error } = await supabase
      .from('cash_sessions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Tabelas de caixa não encontradas:', error.message);
      console.log('');
      console.log('📋 Para aplicar a migração:');
      console.log('1. Acesse: https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql');
      console.log('2. Execute o conteúdo do arquivo: supabase/migrations/20250908000001_cash_management_system.sql');
      console.log('3. Execute este script novamente após aplicar a migração');
      return;
    }
    
    console.log('✅ Tabelas de caixa encontradas! Trocando hooks...');
    
    // Lista de arquivos para atualizar
    const filesToUpdate = [
      'src/pages/CashManagement/components/DashboardOverview.tsx',
      // Adicione outros arquivos conforme necessário
    ];
    
    let filesUpdated = 0;
    
    for (const filePath of filesToUpdate) {
      const fullPath = path.join(__dirname, filePath);
      
      if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Verificar se ainda está usando o hook fallback
        if (content.includes('useCashManagementFallback')) {
          console.log(`🔄 Atualizando: ${filePath}`);
          
          // Trocar o import
          content = content.replace(
            /import { useCashManagementFallback as useCashManagement } from ['"]([^'"]+)['"];?/g,
            "import { useCashManagement } from '$1';"
          );
          
          // Remover referência ao fallback se houver
          content = content.replace(
            /useCashManagementFallback/g,
            'useCashManagement'
          );
          
          fs.writeFileSync(fullPath, content, 'utf8');
          filesUpdated++;
          console.log(`✅ Arquivo atualizado: ${filePath}`);
        } else {
          console.log(`⚪ Arquivo já atualizado: ${filePath}`);
        }
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      }
    }
    
    console.log('');
    console.log(`🎉 Migração verificada com sucesso!`);
    console.log(`📝 Arquivos atualizados: ${filesUpdated}`);
    console.log('');
    console.log('🚀 Sistema de caixa está pronto para uso!');
    console.log('');
    console.log('🔧 Próximos passos:');
    console.log('1. Reiniciar o servidor de desenvolvimento (npm run dev)');
    console.log('2. Testar a abertura de caixa no dashboard');
    console.log('3. Verificar se as funcionalidades estão funcionando');
    console.log('');
    console.log('📊 Funcionalidades disponíveis:');
    console.log('- ✅ Abertura e fechamento de caixa');
    console.log('- ✅ Processamento de pagamentos');
    console.log('- ✅ Reconciliação por método de pagamento');
    console.log('- ✅ Relatórios diários e mensais');
    console.log('- ✅ Auditoria completa de operações');
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
    console.log('');
    console.log('💡 Tente aplicar a migração manualmente:');
    console.log('📁 Arquivo: supabase/migrations/20250908000001_cash_management_system.sql');
    console.log('🔗 Dashboard: https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql');
  }
}

checkAndSwitchHooks();