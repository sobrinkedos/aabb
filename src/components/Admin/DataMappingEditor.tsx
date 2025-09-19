import React, { useState, useEffect } from 'react';
import { Integration } from '../../types/integrations';

interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'object';
}

interface DataMappingEditorProps {
  integration: Integration;
  onSave: (mapping: DataMapping[]) => Promise<void>;
  onCancel: () => void;
}

export const DataMappingEditor: React.FC<DataMappingEditorProps> = ({
  integration,
  onSave,
  onCancel
}) => {
  const [mappings, setMappings] = useState<DataMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Carregar mapeamentos existentes da configuração da integração
    if (integration.config.dataMapping) {
      setMappings(integration.config.dataMapping);
    } else {
      // Inicializar com mapeamentos padrão baseados no tipo de integração
      setMappings(getDefaultMappings(integration.type));
    }
  }, [integration]);

  const getDefaultMappings = (integrationType: string): DataMapping[] => {
    switch (integrationType) {
      case 'erp':
        return [
          { sourceField: 'customer_id', targetField: 'membro_id', required: true, dataType: 'string' },
          { sourceField: 'customer_name', targetField: 'nome', required: true, dataType: 'string' },
          { sourceField: 'customer_email', targetField: 'email', required: false, dataType: 'string' },
          { sourceField: 'customer_phone', targetField: 'telefone', required: false, dataType: 'string' },
          { sourceField: 'membership_status', targetField: 'status_associacao', required: true, dataType: 'string' }
        ];
      case 'crm':
        return [
          { sourceField: 'contact_id', targetField: 'membro_id', required: true, dataType: 'string' },
          { sourceField: 'first_name', targetField: 'nome', required: true, dataType: 'string' },
          { sourceField: 'last_name', targetField: 'sobrenome', required: true, dataType: 'string' },
          { sourceField: 'email_address', targetField: 'email', required: true, dataType: 'string' },
          { sourceField: 'phone_number', targetField: 'telefone', required: false, dataType: 'string' }
        ];
      case 'payment':
        return [
          { sourceField: 'transaction_id', targetField: 'transacao_id', required: true, dataType: 'string' },
          { sourceField: 'amount', targetField: 'valor', required: true, dataType: 'number' },
          { sourceField: 'currency', targetField: 'moeda', required: true, dataType: 'string' },
          { sourceField: 'status', targetField: 'status_pagamento', required: true, dataType: 'string' },
          { sourceField: 'created_at', targetField: 'data_criacao', required: true, dataType: 'date' }
        ];
      default:
        return [
          { sourceField: 'id', targetField: 'id', required: true, dataType: 'string' },
          { sourceField: 'name', targetField: 'nome', required: true, dataType: 'string' },
          { sourceField: 'created_at', targetField: 'data_criacao', required: false, dataType: 'date' }
        ];
    }
  };

  const addMapping = () => {
    const newMapping: DataMapping = {
      sourceField: '',
      targetField: '',
      required: false,
      dataType: 'string'
    };
    setMappings([...mappings, newMapping]);
  };

  const updateMapping = (index: number, field: keyof DataMapping, value: any) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    setMappings(updatedMappings);
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const generatePreview = () => {
    // Simular dados de exemplo baseados nos mapeamentos
    const sampleData = mappings.reduce((acc, mapping) => {
      if (mapping.sourceField) {
        switch (mapping.dataType) {
          case 'string':
            acc[mapping.sourceField] = `exemplo_${mapping.sourceField}`;
            break;
          case 'number':
            acc[mapping.sourceField] = Math.floor(Math.random() * 1000);
            break;
          case 'boolean':
            acc[mapping.sourceField] = Math.random() > 0.5;
            break;
          case 'date':
            acc[mapping.sourceField] = new Date().toISOString();
            break;
          case 'object':
            acc[mapping.sourceField] = { exemplo: 'objeto' };
            break;
        }
      }
      return acc;
    }, {} as any);

    const transformedData = mappings.reduce((acc, mapping) => {
      if (mapping.sourceField && mapping.targetField && sampleData[mapping.sourceField] !== undefined) {
        let value = sampleData[mapping.sourceField];
        
        // Aplicar transformação se definida
        if (mapping.transformation) {
          try {
            // Simulação simples de transformação
            if (mapping.transformation.includes('uppercase')) {
              value = typeof value === 'string' ? value.toUpperCase() : value;
            } else if (mapping.transformation.includes('lowercase')) {
              value = typeof value === 'string' ? value.toLowerCase() : value;
            }
          } catch (error) {
            console.warn('Erro na transformação:', error);
          }
        }
        
        acc[mapping.targetField] = value;
      }
      return acc;
    }, {} as any);

    setPreviewData({ source: sampleData, transformed: transformedData });
    setShowPreview(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onSave(mappings);
    } catch (error) {
      console.error('Erro ao salvar mapeamento:', error);
      alert('Erro ao salvar mapeamento de dados');
    } finally {
      setIsLoading(false);
    }
  };

  const dataTypes = [
    { value: 'string', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'boolean', label: 'Booleano' },
    { value: 'date', label: 'Data' },
    { value: 'object', label: 'Objeto' }
  ];

  const commonTransformations = [
    { value: '', label: 'Nenhuma' },
    { value: 'uppercase', label: 'Maiúsculo' },
    { value: 'lowercase', label: 'Minúsculo' },
    { value: 'trim', label: 'Remover espaços' },
    { value: 'format_date', label: 'Formatar data' },
    { value: 'format_currency', label: 'Formatar moeda' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Mapeamento de Dados - {integration.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure como os dados serão mapeados entre os sistemas
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Controles */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={addMapping}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + Adicionar Mapeamento
            </button>
            <button
              onClick={generatePreview}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Visualizar Preview
            </button>
          </div>

          {/* Tabela de Mapeamentos */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campo Origem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campo Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Dado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transformação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obrigatório
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.map((mapping, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={mapping.sourceField}
                        onChange={(e) => updateMapping(index, 'sourceField', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="campo_origem"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={mapping.targetField}
                        onChange={(e) => updateMapping(index, 'targetField', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="campo_destino"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={mapping.dataType}
                        onChange={(e) => updateMapping(index, 'dataType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {dataTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={mapping.transformation || ''}
                        onChange={(e) => updateMapping(index, 'transformation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {commonTransformations.map(transform => (
                          <option key={transform.value} value={transform.value}>
                            {transform.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={mapping.required}
                        onChange={(e) => updateMapping(index, 'required', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => removeMapping(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mappings.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mt-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum mapeamento configurado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adicione mapeamentos para definir como os dados serão transformados
                </p>
              </div>
            </div>
          )}

          {/* Preview Modal */}
          {showPreview && previewData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900">Preview do Mapeamento</h4>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Dados de Origem</h5>
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(previewData.source, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Dados Transformados</h5>
                      <pre className="bg-blue-50 p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(previewData.transformed, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Salvando...' : 'Salvar Mapeamento'}
          </button>
        </div>
      </div>
    </div>
  );
};