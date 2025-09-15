/**
 * Utilitário para debug de transações
 * Execute no console do navegador para diagnosticar problemas
 */

import { supabase } from '../lib/supabase';

// Função para verificar transações no banco
export const debugTransactions = async () => {
  console.log('🔍 INICIANDO DEBUG DE TRANSAÇÕES');
  console.log('================================');

  try {
    // 1. Verificar todas as transações
    const { data: allTransactions, error: allError } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('📊 Últimas 10 transações no banco:', allTransactions?.length || 0);
    if (allTransactions && allTransactions.length > 0) {
      console.table(allTransactions.map(t => ({
        id: t.id.slice(-8),
        tipo: t.transaction_type,
        metodo: t.payment_method,
        valor: t.amount,
        data: new Date(t.created_at).toLocaleString('pt-BR')
      })));
    }

    // 2. Verificar transações de hoje
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTransactions, error: todayError } = await supabase
      .from('cash_transactions')
      .select('*')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    console.log(`📅 Transações de hoje (${today}):`, todayTransactions?.length || 0);
    if (todayTransactions && todayTransactions.length > 0) {
      console.table(todayTransactions.map(t => ({
        id: t.id.slice(-8),
        tipo: t.transaction_type,
        metodo: t.payment_method,
        valor: t.amount,
        hora: new Date(t.created_at).toLocaleTimeString('pt-BR')
      })));

      // Calcular totais por método
      const totaisPorMetodo = todayTransactions.reduce((acc: any, t: any) => {
        if (t.transaction_type === 'sale') {
          if (!acc[t.payment_method]) {
            acc[t.payment_method] = { valor: 0, quantidade: 0 };
          }
          acc[t.payment_method].valor += t.amount;
          acc[t.payment_method].quantidade += 1;
        }
        return acc;
      }, {});

      console.log('💰 Totais por método de pagamento:', totaisPorMetodo);
    }

    // 3. Verificar sessões de caixa
    const { data: sessions, error: sessionsError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('session_date', today)
      .order('opened_at', { ascending: false });

    console.log(`🏦 Sessões de caixa de hoje:`, sessions?.length || 0);
    if (sessions && sessions.length > 0) {
      console.table(sessions.map(s => ({
        id: s.id.slice(-8),
        funcionario: s.employee_id.slice(-8),
        status: s.status,
        abertura: s.opening_amount,
        esperado: s.expected_amount,
        aberto_em: new Date(s.opened_at).toLocaleTimeString('pt-BR')
      })));
    }

    // 4. Verificar comandas
    const { data: comandas, error: comandasError } = await supabase
      .from('comandas')
      .select('*')
      .eq('status', 'pending_payment')
      .limit(5);

    console.log('📋 Comandas pendentes de pagamento:', comandas?.length || 0);

    console.log('✅ DEBUG CONCLUÍDO');
    console.log('==================');

    return {
      allTransactions: allTransactions?.length || 0,
      todayTransactions: todayTransactions?.length || 0,
      sessions: sessions?.length || 0,
      comandas: comandas?.length || 0
    };

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return null;
  }
};

// Função para criar uma transação de teste
export const createTestTransaction = async () => {
  console.log('🧪 Criando transação de teste...');

  try {
    const testTransaction = {
      transaction_type: 'sale',
      payment_method: 'dinheiro',
      amount: 50.00,
      processed_by: 'test-user-id',
      notes: 'Transação de teste para debug'
    };

    const { data, error } = await supabase
      .from('cash_transactions')
      .insert(testTransaction)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Transação de teste criada:', data);
    return data;

  } catch (error) {
    console.error('❌ Erro ao criar transação de teste:', error);
    return null;
  }
};

// Disponibilizar no window para uso no console
if (typeof window !== 'undefined') {
  (window as any).debugTransactions = debugTransactions;
  (window as any).createTestTransaction = createTestTransaction;
}