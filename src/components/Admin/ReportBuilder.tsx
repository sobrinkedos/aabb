import React, { useState } from 'react';

interface ReportField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  table: string;
}

interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

interface ReportConfig {
  name: string;
  description: string;
  fields: string[];
  filters: ReportFilter[];
  groupBy: string[];
  orderBy: string[];
  chartType?: 'bar' | 'line' | 'pie' | 'table';
}

export const ReportBuilder: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    fields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    chartType: 'table'
  });

  const availableFields: ReportField[] = [
    { id: 'user.name', name: 'Nome do Usuário', type: 'string', table: 'users' },
    { id: 'user.email', name: 'Email', type: 'string', table: 'users' },
    { id: 'user.created_at', name: 'Data de Criação', type: 'date', table: 'users' },
    { id: 'backup.name', name: 'Nome do Backup', type: 'string', table: 'backups' },
    { id: 'backup.size', name: 'Tamanho do Backup', type: 'number', table: 'backups' },
    { id: 'audit.action', name: 'Ação de Auditoria', type: 'string', table: 'audit_logs' },
    { id: 'audit.timestamp', name: 'Data da Ação', type: 'date', table: 'audit_logs' }
  ];

  const operators = [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'contains', label: 'Contém' },
    { value: 'starts_with', label: 'Começa com' },
    { value: 'greater_than', label: 'Maior que' },
    { value: 'less_than', label: 'Menor que' },
    { value: 'between', label: 'Entre' }
  ];

  const addFilter = () => {
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, { field: '', operator: 'equals', value: '' }]
    }));
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const generateReport = () => {
    console.log('Gerando relatório:', reportConfig);
    alert('Relatório gerado com sucesso!');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Construtor de Relatórios</h2>
      
      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Relatório
            </label>
            <input
              type="text"
              value={reportConfig.name}
              onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Relatório de Usuários"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Visualização
            </label>
            <select
              value={reportConfig.chartType}
              onChange={(e) => setReportConfig(prev => ({ ...prev, chartType: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="table">Tabela</option>
              <option value="bar">Gráfico de Barras</option>
              <option value="line">Gráfico de Linha</option>
              <option value="pie">Gráfico de Pizza</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={reportConfig.description}
            onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrição do relatório..."
          />
        </div>

        {/* Campos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campos do Relatório
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableFields.map(field => (
              <label key={field.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportConfig.fields.includes(field.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setReportConfig(prev => ({
                        ...prev,
                        fields: [...prev.fields, field.id]
                      }));
                    } else {
                      setReportConfig(prev => ({
                        ...prev,
                        fields: prev.fields.filter(f => f !== field.id)
                      }));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">{field.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Filtros
            </label>
            <button
              onClick={addFilter}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Adicionar Filtro
            </button>
          </div>
          
          <div className="space-y-3">
            {reportConfig.filters.map((filter, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div>
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um campo</option>
                    {availableFields.map(field => (
                      <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    placeholder="Valor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <button
                    onClick={() => removeFilter(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Visualizar Preview
          </button>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};