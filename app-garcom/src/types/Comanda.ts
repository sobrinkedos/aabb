export interface Comanda {
  id: string;
  numeroSequencial: number;
  mesaId: string;
  garcomId: string;
  clienteNome?: string;
  status: 'aberta' | 'fechada' | 'cancelada';
  dataAbertura: Date;
  dataFechamento?: Date;
  subtotal: number;
  taxaServico: number;
  desconto: number;
  total: number;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  itens: ItemComanda[];
}

export interface ItemComanda {
  id: string;
  comandaId: string;
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  observacoes?: string;
  status: 'pendente' | 'preparando' | 'pronto' | 'servido' | 'cancelado';
  tempoSolicitacao: Date;
  tempoPreparoInicio?: Date;
  tempoPreparoFim?: Date;
}

export interface FormaPagamento {
  tipo: 'dinheiro' | 'cartao' | 'pix' | 'conta_clube';
  valor: number;
  gorjeta?: number;
  detalhes?: Record<string, unknown>;
}