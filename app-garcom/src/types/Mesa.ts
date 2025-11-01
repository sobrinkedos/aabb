// Tipos alinhados com a tabela bar_tables do banco de dados
export interface Mesa {
  id: string;
  number: string; // VARCHAR(10) - ex: "M01", "BAR01"
  capacity: number;
  position_x: number; // 0-100 (percentual)
  position_y: number; // 0-100 (percentual)
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Tipo estendido com informações da comanda ativa (para UI)
export interface MesaComDetalhes extends Mesa {
  current_comanda_id?: string;
  occupied_since?: string;
  current_total?: number;
  people_count?: number;
}

export interface LayoutConfig {
  largura: number;
  altura: number;
  escala: number;
}

// Status traduzidos para UI
export const MesaStatusLabel: Record<Mesa['status'], string> = {
  available: 'Disponível',
  occupied: 'Ocupada',
  reserved: 'Reservada',
  cleaning: 'Limpeza',
  maintenance: 'Manutenção',
};

// Cores para cada status
export const MesaStatusColor: Record<Mesa['status'], string> = {
  available: '#4CAF50', // Verde
  occupied: '#F44336', // Vermelho
  reserved: '#FF9800', // Laranja
  cleaning: '#FFC107', // Amarelo
  maintenance: '#9E9E9E', // Cinza
};