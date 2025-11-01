// Utilitários para transformação de dados entre banco e aplicação
import { Mesa, MesaComDetalhes } from './Mesa';
import { Comanda, ComandaComDetalhes, ItemComanda, ItemComandaComDetalhes } from './Comanda';
import { MenuItem } from './Produto';

/**
 * Transforma dados do banco (snake_case) para o formato da aplicação
 */

// Transformador para Mesa
export function transformMesaFromDB(data: any): Mesa {
  // Normalizar posições: se valores > 100, assumir que são pixels e converter para percentual
  // Assumindo área de trabalho de ~800x600 pixels
  let position_x = data.position_x ?? 0;
  let position_y = data.position_y ?? 0;
  
  // Se as posições parecem ser em pixels (> 100), normalizar para percentual
  if (position_x > 100 || position_y > 100) {
    // Assumir área máxima de 800x600 para normalização
    position_x = Math.min(100, (position_x / 800) * 100);
    position_y = Math.min(100, (position_y / 600) * 100);
  }
  
  return {
    id: data.id,
    number: data.number,
    capacity: data.capacity,
    position_x,
    position_y,
    status: data.status,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function transformMesaComDetalhesFromDB(data: any): MesaComDetalhes {
  return {
    ...transformMesaFromDB(data),
    current_comanda_id: data.current_comanda_id,
    occupied_since: data.occupied_since,
    current_total: data.current_total ? parseFloat(data.current_total) : undefined,
    people_count: data.people_count,
  };
}

// Transformador para Comanda
export function transformComandaFromDB(data: any): Comanda {
  return {
    id: data.id,
    table_id: data.table_id,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    employee_id: data.employee_id,
    status: data.status,
    total: parseFloat(data.total || 0),
    people_count: data.people_count,
    opened_at: data.opened_at,
    closed_at: data.closed_at,
    payment_method: data.payment_method,
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function transformComandaComDetalhesFromDB(data: any): ComandaComDetalhes {
  return {
    ...transformComandaFromDB(data),
    table_number: data.table_number,
    employee_name: data.employee_name,
    items: data.items ? data.items.map((item: any) => ({
      ...transformItemComandaFromDB(item),
      menu_item_name: item.menu_item_name,
      menu_item_category: item.menu_item_category,
    })) : undefined,
    items_count: data.items_count,
    pending_items: data.pending_items,
  };
}

// Transformador para ItemComanda
export function transformItemComandaFromDB(data: any): ItemComanda {
  return {
    id: data.id,
    comanda_id: data.comanda_id,
    menu_item_id: data.menu_item_id,
    quantity: data.quantity,
    price: parseFloat(data.price),
    status: data.status,
    added_at: data.added_at,
    prepared_at: data.prepared_at,
    delivered_at: data.delivered_at,
    notes: data.notes,
    created_at: data.created_at,
  };
}

export function transformItemComandaComDetalhesFromDB(data: any): ItemComandaComDetalhes {
  const item = transformItemComandaFromDB(data);
  return {
    ...item,
    menu_item_name: data.menu_item_name,
    menu_item_category: data.menu_item_category,
    subtotal: item.quantity * item.price,
  };
}

// Transformador para MenuItem
export function transformMenuItemFromDB(data: any): MenuItem {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: parseFloat(data.price),
    category: data.category,
    available: data.available,
    preparation_time: data.preparation_time,
    created_at: data.created_at,
  };
}

/**
 * Transforma dados da aplicação para o formato do banco (para inserts/updates)
 */

export function transformMesaToDB(mesa: Partial<Mesa>): any {
  return {
    number: mesa.number,
    capacity: mesa.capacity,
    position_x: mesa.position_x,
    position_y: mesa.position_y,
    status: mesa.status,
    notes: mesa.notes,
  };
}

export function transformComandaToDB(comanda: Partial<Comanda> & { empresa_id?: string }): any {
  return {
    table_id: comanda.table_id,
    customer_id: comanda.customer_id,
    customer_name: comanda.customer_name,
    employee_id: comanda.employee_id,
    status: comanda.status,
    total: comanda.total,
    people_count: comanda.people_count,
    opened_at: comanda.opened_at,
    closed_at: comanda.closed_at,
    payment_method: comanda.payment_method,
    notes: comanda.notes,
    empresa_id: comanda.empresa_id,
  };
}

export function transformItemComandaToDB(item: Partial<ItemComanda> & { empresa_id?: string }): any {
  return {
    comanda_id: item.comanda_id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    price: item.price,
    status: item.status,
    added_at: item.added_at,
    prepared_at: item.prepared_at,
    delivered_at: item.delivered_at,
    notes: item.notes,
    empresa_id: item.empresa_id,
  };
}

/**
 * Utilitários de cálculo
 */

export function calcularSubtotalItem(item: ItemComanda): number {
  return item.quantity * item.price;
}

export function calcularTotalComanda(items: ItemComanda[]): number {
  return items
    .filter(item => item.status !== 'cancelled')
    .reduce((total, item) => total + calcularSubtotalItem(item), 0);
}

export function calcularTaxaServico(subtotal: number, percentual: number = 10): number {
  return subtotal * (percentual / 100);
}

export function calcularTotalComTaxaEDesconto(
  subtotal: number,
  taxaServico: number = 0,
  desconto: number = 0
): number {
  return subtotal + taxaServico - desconto;
}

/**
 * Utilitários de formatação
 */

export function formatarMoeda(valor: number): string {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarData(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data));
}

export function formatarDataHora(data: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data));
}

export function formatarTempo(inicio: string, fim?: string): string {
  if (!inicio) return '0min';
  
  const start = new Date(inicio);
  const end = fim ? new Date(fim) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '0min';
  }
  
  const diff = end.getTime() - start.getTime();
  
  if (diff < 0) return '0min';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

/**
 * Utilitários de validação
 */

export function isComandaAberta(comanda: Comanda): boolean {
  return comanda.status === 'open';
}

export function isMesaDisponivel(mesa: Mesa): boolean {
  return mesa.status === 'available';
}

export function isItemPendente(item: ItemComanda): boolean {
  return item.status === 'pending' || item.status === 'preparing';
}

export function hasItensPendentes(items: ItemComanda[]): boolean {
  return items.some(isItemPendente);
}
