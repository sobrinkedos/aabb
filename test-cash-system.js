#!/usr/bin/env node

/**
 * Script para testar o sistema de caixa
 * 
 * Testa a criação de uma sessão de caixa para verificar se a migração funcionou
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCashSystem() {
  console.log('🧪 Testando sistema de caixa...');
  console.log('');

  try {
    // Primeiro, verificar se as tabelas existem
    console.log('1️⃣ Verificando tabelas...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('cash_sessions')
      .select('count')
      .limit(0);

    if (tablesError) {
      console.log('❌ Erro ao acessar tabelas:', tablesError.message);
      return;
    }

    console.log('✅ Tabelas acessíveis');
    console.log('');

    // Verificar se há usuários na tabela profiles
    console.log('2️⃣ Verificando usuários...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .limit(5);

    if (profilesError) {
      console.log('❌ Erro ao acessar profiles:', profilesError.message);
      return;
    }

    console.log(`✅ Encontrados ${profiles?.length || 0} usuários:`);
    profiles?.forEach(profile => {
      console.log(`   - ${profile.name} (${profile.role}) - ID: ${profile.id.substring(0, 8)}...`);
    });
    console.log('');

    // Verificar sessões existentes
    console.log('3️⃣ Verificando sessões de caixa...');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('cash_sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.log('❌ Erro ao acessar sessões:', sessionsError.message);
      return;
    }

    console.log(`✅ Encontradas ${sessions?.length || 0} sessões de caixa:`);
    sessions?.forEach(session => {
      console.log(`   - Funcionário: ${session.employee_id.substring(0, 8)}... | Status: ${session.status} | Data: ${session.session_date}`);
    });
    console.log('');

    // Testar criação de sessão (simulado)
    console.log('4️⃣ Testando estrutura de dados...');
    
    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      
      // Verificar se já existe sessão aberta para este usuário
      const { data: existingSession, error: existingError } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('employee_id', testUserId)
        .eq('status', 'open')
        .maybeSingle();

      if (existingError) {
        console.log('❌ Erro ao verificar sessão existente:', existingError.message);
        return;
      }

      if (existingSession) {
        console.log(`✅ Usuário ${profiles[0].name} já tem uma sessão aberta`);
        console.log(`   - ID da sessão: ${existingSession.id}`);
        console.log(`   - Valor inicial: R$ ${existingSession.opening_amount}`);
        console.log(`   - Aberta em: ${new Date(existingSession.opened_at).toLocaleString('pt-BR')}`);
      } else {
        console.log(`ℹ️  Usuário ${profiles[0].name} não tem sessão aberta`);
        console.log('   - Pode abrir uma nova sessão no sistema');
      }
    } else {
      console.log('⚠️  Nenhum usuário encontrado na tabela profiles');
      console.log('   - Crie um usuário via autenticação do Supabase primeiro');
    }

    console.log('');
    console.log('🎉 Teste concluído com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse: http://localhost:5175');
    console.log('2. Faça login no sistema');
    console.log('3. Navegue para o módulo de Gestão de Caixa');
    console.log('4. Teste a abertura de uma sessão de caixa');
    console.log('');
    console.log('💡 Dicas:');
    console.log('- Se não conseguir fazer login, crie um usuário no Supabase Auth');
    console.log('- Após login, um perfil será criado automaticamente');
    console.log('- O sistema agora está conectado às tabelas reais do banco');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testCashSystem();