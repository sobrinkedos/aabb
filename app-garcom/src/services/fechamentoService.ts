import { supabase } from '../lib/supabase';
import { ComandaComDetalhes } from '../types/Comanda';

export interface FechamentoDia {
  data: string;
  garcom_id: string;
  garcom_nome: string;
  comandas: ComandaComDetalhes[];
  total_comandas: number;
  total_vendas: number;
  total_servico: number; // 10% do garçom
  total_comissao: number; // Comissão sobre vendas (se houver)
  taxa_comissao: number; // Percentual de comissão
}

export interface ResumoAtendimento {
  comanda_id: string;
  mesa: string;
  cliente: string;
  horario_abertura: string;
  horario_fechamento?: string;
  total: number;
  servico: number;
  forma_pagamento?: string;
  status: string;
}

/**
 * Busca todas as comandas do garçom no dia
 */
export async function buscarComandasDoDia(
  garcomId: string,
  data?: string
): Promise<ComandaComDetalhes[]> {
  const dataFiltro = data || new Date().toISOString().split('T')[0];
  const dataInicio = `${dataFiltro}T00:00:00`;
  const dataFim = `${dataFiltro}T23:59:59`;

  const { data: comandas, error } = await supabase
    .from('comandas')
    .select(`
      *,
      tables:table_id (
        table_number
      ),
      profiles:employee_id (
        name
      )
    `)
    .eq('employee_id', garcomId)
    .gte('opened_at', dataInicio)
    .lte('opened_at', dataFim)
    .order('opened_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar comandas:', error);
    throw error;
  }

  return (comandas || []).map((comanda: any) => ({
    ...comanda,
    table_number: comanda.tables?.table_number,
    employee_name: comanda.profiles?.name,
  }));
}

/**
 * Calcula o fechamento do dia do garçom
 */
export async function calcularFechamentoDia(
  garcomId: string,
  data?: string
): Promise<FechamentoDia> {
  const comandas = await buscarComandasDoDia(garcomId, data);
  
  // Buscar nome do garçom
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', garcomId)
    .single();

  // Buscar taxa de comissão do garçom (se houver na tabela bar_employees)
  const { data: barEmployee } = await supabase
    .from('bar_employees')
    .select('commission_rate')
    .eq('employee_id', garcomId)
    .single();

  const taxaComissao = barEmployee?.commission_rate || 0;

  // Calcular totais apenas de comandas fechadas
  const comandasFechadas = comandas.filter(c => c.status === 'closed');
  
  const totalVendas = comandasFechadas.reduce((sum, c) => sum + (c.total || 0), 0);
  const totalServico = comandasFechadas.reduce((sum, c) => sum + (c.service_charge_amount || 0), 0);
  const totalComissao = totalVendas * (taxaComissao / 100);

  return {
    data: data || new Date().toISOString().split('T')[0],
    garcom_id: garcomId,
    garcom_nome: profile?.name || 'Garçom',
    comandas,
    total_comandas: comandasFechadas.length,
    total_vendas: totalVendas,
    total_servico: totalServico,
    total_comissao: totalComissao,
    taxa_comissao: taxaComissao,
  };
}

/**
 * Gera resumo de atendimentos para exibição
 */
export function gerarResumoAtendimentos(
  comandas: ComandaComDetalhes[]
): ResumoAtendimento[] {
  return comandas.map(comanda => ({
    comanda_id: comanda.id,
    mesa: comanda.table_number || 'Balcão',
    cliente: comanda.customer_name || 'Cliente',
    horario_abertura: comanda.opened_at,
    horario_fechamento: comanda.closed_at,
    total: comanda.total || 0,
    servico: comanda.service_charge_amount || 0,
    forma_pagamento: comanda.payment_method,
    status: comanda.status,
  }));
}

/**
 * Formata data e hora para exibição
 */
export function formatarDataHora(dataISO: string): string {
  const data = new Date(dataISO);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata apenas hora
 */
export function formatarHora(dataISO: string): string {
  const data = new Date(dataISO);
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
