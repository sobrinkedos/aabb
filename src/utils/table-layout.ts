/**
 * Utilitários para layout e posicionamento de mesas
 */

export interface TablePosition {
  x: number;
  y: number;
}

export interface LayoutConfig {
  tableSize: number;
  margin: number;
  layoutWidth: number;
  layoutHeight: number;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  tableSize: 120, // 80px da mesa + 40px de espaçamento
  margin: 50,
  layoutWidth: 800,
  layoutHeight: 600
};

/**
 * Calcula a posição automática de uma mesa baseada no seu índice
 */
export const calculateAutoPosition = (
  index: number, 
  config: Partial<LayoutConfig> = {}
): TablePosition => {
  const { tableSize, margin, layoutWidth } = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  
  const cols = Math.floor((layoutWidth - margin) / tableSize);
  const col = index % cols;
  const row = Math.floor(index / cols);
  
  return {
    x: margin + (col * tableSize),
    y: margin + (row * tableSize)
  };
};

/**
 * Calcula posições para todas as mesas de forma organizada
 */
export const calculateAllTablePositions = (
  tableCount: number,
  config: Partial<LayoutConfig> = {}
): TablePosition[] => {
  const positions: TablePosition[] = [];
  
  for (let i = 0; i < tableCount; i++) {
    positions.push(calculateAutoPosition(i, config));
  }
  
  return positions;
};

/**
 * Verifica se uma posição está dentro dos limites do layout
 */
export const isPositionValid = (
  position: TablePosition,
  config: Partial<LayoutConfig> = {}
): boolean => {
  const { tableSize, layoutWidth, layoutHeight } = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + tableSize <= layoutWidth &&
    position.y + tableSize <= layoutHeight
  );
};

/**
 * Encontra a próxima posição disponível para uma nova mesa
 */
export const findNextAvailablePosition = (
  existingPositions: TablePosition[],
  config: Partial<LayoutConfig> = {}
): TablePosition => {
  const { tableSize, margin, layoutWidth, layoutHeight } = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  
  const cols = Math.floor((layoutWidth - margin) / tableSize);
  const rows = Math.floor((layoutHeight - margin) / tableSize);
  
  // Criar um mapa das posições ocupadas
  const occupiedPositions = new Set(
    existingPositions.map(pos => `${pos.x},${pos.y}`)
  );
  
  // Procurar a primeira posição livre
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = margin + (col * tableSize);
      const y = margin + (row * tableSize);
      const positionKey = `${x},${y}`;
      
      if (!occupiedPositions.has(positionKey)) {
        return { x, y };
      }
    }
  }
  
  // Se não encontrar posição livre, retornar posição padrão
  return calculateAutoPosition(existingPositions.length, config);
};

/**
 * Organiza mesas em um grid uniforme
 */
export const organizeTablesInGrid = (
  tables: Array<{ id: string; position_x?: number | null; position_y?: number | null }>,
  config: Partial<LayoutConfig> = {}
): Array<{ id: string; position: TablePosition }> => {
  const finalConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  
  // Calcular quantas colunas e linhas cabem no layout
  const maxCols = Math.floor((finalConfig.layoutWidth - finalConfig.margin) / finalConfig.tableSize);
  const maxRows = Math.floor((finalConfig.layoutHeight - finalConfig.margin) / finalConfig.tableSize);
  const maxCapacity = maxCols * maxRows;
  
  console.log('Grid Organization:', {
    layoutWidth: finalConfig.layoutWidth,
    layoutHeight: finalConfig.layoutHeight,
    tableSize: finalConfig.tableSize,
    margin: finalConfig.margin,
    maxCols,
    maxRows,
    maxCapacity,
    tablesCount: tables.length
  });
  
  // Se há mais mesas do que capacidade, ajustar o tamanho das mesas
  let adjustedTableSize = finalConfig.tableSize;
  let adjustedMargin = finalConfig.margin;
  
  if (tables.length > maxCapacity) {
    // Calcular novo tamanho baseado no número de mesas
    const idealCols = Math.ceil(Math.sqrt(tables.length));
    const idealRows = Math.ceil(tables.length / idealCols);
    
    adjustedTableSize = Math.min(
      Math.floor((finalConfig.layoutWidth - 40) / idealCols),
      Math.floor((finalConfig.layoutHeight - 40) / idealRows)
    );
    adjustedMargin = 20;
    
    console.log('Adjusted for capacity:', {
      idealCols,
      idealRows,
      adjustedTableSize,
      adjustedMargin
    });
  }
  
  return tables.map((table, index) => {
    const cols = Math.floor((finalConfig.layoutWidth - adjustedMargin) / adjustedTableSize);
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const position = {
      x: adjustedMargin + (col * adjustedTableSize),
      y: adjustedMargin + (row * adjustedTableSize)
    };
    
    console.log(`Mesa ${index + 1}:`, { col, row, position });
    
    return {
      id: table.id,
      position
    };
  });
};

/**
 * Calcula o número máximo de colunas baseado na largura do layout
 */
export const calculateMaxColumns = (config: Partial<LayoutConfig> = {}): number => {
  const { tableSize, margin, layoutWidth } = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  return Math.floor((layoutWidth - margin) / tableSize);
};

/**
 * Calcula o número máximo de linhas baseado na altura do layout
 */
export const calculateMaxRows = (config: Partial<LayoutConfig> = {}): number => {
  const { tableSize, margin, layoutHeight } = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  return Math.floor((layoutHeight - margin) / tableSize);
};

/**
 * Calcula a capacidade máxima de mesas no layout
 */
export const calculateMaxTableCapacity = (config: Partial<LayoutConfig> = {}): number => {
  return calculateMaxColumns(config) * calculateMaxRows(config);
};