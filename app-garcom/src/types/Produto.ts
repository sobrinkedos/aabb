export interface ProdutoCardapio {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
  tempoPreparoMedio: number;
  ingredientes: string[];
  alergenos: string[];
  imagem?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaCardapio {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativa: boolean;
}