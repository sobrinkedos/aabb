import { InventoryItem, InventoryCategory } from '../types';

interface ExportData {
  inventory: InventoryItem[];
  categories: InventoryCategory[];
}

export const exportInventoryReport = ({ inventory, categories }: ExportData) => {
  // Criar mapeamento de categorias
  const categoryMap = categories.reduce((map, category) => {
    map[category.id] = category.name;
    return map;
  }, {} as Record<string, string>);

  // Calcular totais
  const totalCostValue = inventory.reduce((sum, item) => sum + ((item.cost || 0) * item.currentStock), 0);
  const totalSaleValue = inventory.reduce((sum, item) => sum + ((item.salePrice || 0) * item.currentStock), 0);
  const potentialProfit = totalSaleValue - totalCostValue;

  // Preparar dados para CSV
  const csvData = inventory.map(item => ({
    'Nome do Produto': item.name,
    'Categoria': categoryMap[item.categoryId || ''] || 'Sem categoria',
    'Estoque Atual': item.currentStock,
    'Estoque Mínimo': item.minStock,
    'Unidade': item.unit,
    'Custo Unitário': `R$ ${(item.cost || 0).toFixed(2)}`,
    'Preço de Venda': `R$ ${(item.salePrice || 0).toFixed(2)}`,
    'Valor Total (Custo)': `R$ ${((item.cost || 0) * item.currentStock).toFixed(2)}`,
    'Valor Total (Venda)': `R$ ${((item.salePrice || 0) * item.currentStock).toFixed(2)}`,
    'Margem Unitária': item.marginPercentage ? `${item.marginPercentage.toFixed(1)}%` : 'N/A',
    'Disponível p/ Venda': item.availableForSale ? 'Sim' : 'Não',
    'Fornecedor': item.supplier || 'N/A',
    'Status Estoque': item.currentStock <= item.minStock ? 'Baixo' : 'Normal',
    'Última Atualização': item.lastUpdated.toLocaleDateString('pt-BR')
  }));

  // Converter para CSV
  const headers = Object.keys(csvData[0] || {});
  const csvContent = [
    // Cabeçalho do relatório
    ['RELATÓRIO DE ESTOQUE'],
    [`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`],
    [''],
    ['RESUMO GERAL'],
    [`Total de Itens: ${inventory.length}`],
    [`Valor Total (Custo): R$ ${totalCostValue.toFixed(2)}`],
    [`Valor Total (Venda): R$ ${totalSaleValue.toFixed(2)}`],
    [`Lucro Potencial: R$ ${potentialProfit.toFixed(2)}`],
    [`Margem Média: ${totalCostValue > 0 ? ((potentialProfit / totalCostValue) * 100).toFixed(1) : '0'}%`],
    [''],
    ['DETALHAMENTO POR ITEM'],
    headers,
    ...csvData.map(row => headers.map(header => row[header as keyof typeof row]))
  ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

  // Fazer download do arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-estoque-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportInventoryReportExcel = ({ inventory, categories }: ExportData) => {
  // Para uma versão mais avançada, podemos usar uma biblioteca como xlsx
  // Por enquanto, vamos usar CSV que é compatível com Excel
  exportInventoryReport({ inventory, categories });
};

export const printInventoryReport = ({ inventory, categories }: ExportData) => {
  const categoryMap = categories.reduce((map, category) => {
    map[category.id] = category.name;
    return map;
  }, {} as Record<string, string>);

  const totalCostValue = inventory.reduce((sum, item) => sum + ((item.cost || 0) * item.currentStock), 0);
  const totalSaleValue = inventory.reduce((sum, item) => sum + ((item.salePrice || 0) * item.currentStock), 0);
  const potentialProfit = totalSaleValue - totalCostValue;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Relatório de Estoque</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .summary h3 { margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .low-stock { background-color: #fff3cd; }
        .no-sale { background-color: #f8d7da; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Estoque</h1>
        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>
      
      <div class="summary">
        <h3>Resumo Geral</h3>
        <p><strong>Total de Itens:</strong> ${inventory.length}</p>
        <p><strong>Valor Total (Custo):</strong> R$ ${totalCostValue.toFixed(2)}</p>
        <p><strong>Valor Total (Venda):</strong> R$ ${totalSaleValue.toFixed(2)}</p>
        <p><strong>Lucro Potencial:</strong> R$ ${potentialProfit.toFixed(2)}</p>
        <p><strong>Margem Média:</strong> ${totalCostValue > 0 ? ((potentialProfit / totalCostValue) * 100).toFixed(1) : '0'}%</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Estoque</th>
            <th>Custo Unit.</th>
            <th>Preço Venda</th>
            <th>Valor Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${inventory.map(item => {
            const isLowStock = item.currentStock <= item.minStock;
            const isNotForSale = !item.availableForSale;
            const rowClass = isLowStock ? 'low-stock' : (isNotForSale ? 'no-sale' : '');
            
            return `
              <tr class="${rowClass}">
                <td>${item.name}</td>
                <td>${categoryMap[item.categoryId || ''] || 'Sem categoria'}</td>
                <td>${item.currentStock} ${item.unit}</td>
                <td>R$ ${(item.cost || 0).toFixed(2)}</td>
                <td>R$ ${(item.salePrice || 0).toFixed(2)}</td>
                <td>R$ ${((item.salePrice || 0) * item.currentStock).toFixed(2)}</td>
                <td>${isLowStock ? 'Estoque Baixo' : (isNotForSale ? 'Não p/ Venda' : 'Normal')}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Imprimir Relatório
        </button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
};