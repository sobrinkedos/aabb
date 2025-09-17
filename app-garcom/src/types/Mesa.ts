export interface Mesa {
  id: string;
  numero: number;
  status: 'livre' | 'ocupada' | 'aguardando' | 'limpeza';
  posicaoX: number;
  posicaoY: number;
  capacidade: number;
  garcomResponsavel?: string;
  tempoOcupacao?: Date;
  comandaAtiva?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LayoutConfig {
  largura: number;
  altura: number;
  escala: number;
}