/**
 * Utilitários para formatação de comandas
 */

/**
 * Gera um número mais amigável para exibição da comanda
 * @param id ID da comanda
 * @returns Número formatado para exibição
 */
export const getComandaNumber = (id: string): string => {
  if (!id) return '000';
  
  // Se o ID tem um padrão específico com hífen, extrair o número
  if (id.includes('-')) {
    const parts = id.split('-');
    const lastPart = parts[parts.length - 1];
    
    // Se a última parte é um número, usar ela
    if (/^\d+$/.test(lastPart)) {
      return lastPart.padStart(3, '0'); // Garantir pelo menos 3 dígitos
    }
    
    // Se tem uma parte que parece ser um número sequencial
    for (const part of parts.reverse()) {
      if (/^\d+$/.test(part) && part.length >= 3) {
        return part;
      }
    }
  }
  
  // Se é um UUID ou ID longo, usar os últimos 6 caracteres
  if (id.length > 10) {
    return id.slice(-6).toUpperCase();
  }
  
  // Caso contrário, usar o ID como está
  return id.toUpperCase();
};

/**
 * Gera um número de referência curto para pendências
 * @param id ID da pendência
 * @returns Número de referência formatado
 */
export const getPendingReference = (id: string): string => {
  if (!id) return '000';
  
  // Para pendências, usar os primeiros 6 caracteres
  if (id.length > 6) {
    return id.slice(0, 6).toUpperCase();
  }
  
  return id.toUpperCase();
};

/**
 * Formata o nome da mesa de forma amigável
 * @param tableNumber Número da mesa
 * @returns Nome formatado da mesa
 */
export const formatTableName = (tableNumber?: number | string): string => {
  if (!tableNumber) return 'Mesa';
  return `Mesa ${tableNumber}`;
};

/**
 * Formata a exibição de mesa ou balcão
 * @param tableNumber - Número da mesa (pode ser null/undefined)
 * @returns String formatada ("Mesa X" ou "Balcão")
 */
export const formatTableDisplay = (tableNumber?: string | number | null): string => {
  if (tableNumber) {
    return `Mesa ${tableNumber}`;
  }
  return 'Balcão';
};

/**
 * Formata o número do pedido de balcão para exibição amigável
 * @param orderNumber - Número do pedido de balcão
 * @returns Número formatado (ex: #0001, #0123)
 */
export const formatBalcaoOrderNumber = (orderNumber: number | string): string => {
  const num = typeof orderNumber === 'string' ? parseInt(orderNumber) : orderNumber;
  return `#${num.toString().padStart(4, '0')}`;
};

/**
 * Extrai o número do pedido de uma nota de transação
 * @param notes - Nota da transação (ex: "Pedido Balcão #0123 - Cliente" ou "Pedido de balcão #uuid")
 * @returns Número extraído ou formatado
 */
export const extractOrderNumberFromNotes = (notes: string): string | null => {
  // Tentar formato novo primeiro: "Pedido Balcão #0123"
  let match = notes.match(/Pedido Balcão #(\d+)/);
  if (match) {
    return `#${match[1]}`;
  }
  
  // Tentar formato antigo: "Pedido de balcão #uuid"
  match = notes.match(/Pedido de balcão #([a-f0-9-]+)/);
  if (match) {
    // Converter UUID para número amigável usando os últimos 4 caracteres
    const uuid = match[1];
    const lastFour = uuid.replace(/-/g, '').slice(-4);
    const number = parseInt(lastFour, 16) % 10000;
    return `#${number.toString().padStart(4, '0')}`;
  }
  
  return null;
};

/**
 * Formata informações da comanda para exibição
 * @param comanda Dados da comanda
 * @returns Objeto com informações formatadas
 */
export const formatComandaInfo = (comanda: any) => {
  return {
    number: getComandaNumber(comanda.id),
    tableName: formatTableName(comanda.mesa?.numero || comanda.table?.number),
    customerName: comanda.nome_cliente || comanda.customer_name || 'Cliente',
    totalFormatted: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(comanda.total || 0)
  };
};