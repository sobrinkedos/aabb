/**
 * Modal de Fechamento de Conta
 * 
 * Componente responsável por exibir os itens consumidos,
 * calcular comissão e processar o fechamento da conta
 */

import React, { useState, useEffect } from 'react';
import { X, Calculator, CreditCard } from 'lucide-react';
import { 
  Command, 
  CloseAccountData, 
  DEFAULT_COMMISSION_PERCENTAGE 
} from '../../types/sales-management';
import { CommissionCalculator } from '../../utils/commission-calculator';
import { getComandaNumber } from '../../utils/comanda-formatter';

interface CloseAccountModalProps {
  isOpen: boolean;
  comanda: Command;
  onClose: () => void;
  onConfirm: (dados: CloseAccountData) => Promise<void>;
  loading?: boolean;
}



export const CloseAccountModal: React.FC<CloseAccountModalProps> = ({
  isOpen,
  comanda,
  onClose,
  onConfirm,
  loading = false
}) => {
  const [percentualComissao, setPercentualComissao] = useState(DEFAULT_COMMISSION_PERCENTAGE);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | undefined>();

  // Calcular valores baseados no percentual de comissão
  const calculoComissao = CommissionCalculator.calculateWithValidation(
    comanda.total, 
    percentualComissao
  );

  // Reset do estado quando o modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setPercentualComissao(DEFAULT_COMMISSION_PERCENTAGE);
      setObservacoes('');
      setErro(undefined);
    }
  }, [isOpen]);

  const handlePercentualChange = (value: string) => {
    const percentual = parseFloat(value) || 0;
    setPercentualComissao(percentual);
    setErro(undefined);
  };

  const handleConfirm = async () => {
    try {
      setErro(undefined);

      // Validar percentual de comissão
      if (!calculoComissao.percentual_valido) {
        setErro(calculoComissao.erro);
        return;
      }

      const dadosFechamento: CloseAccountData = {
        comanda_id: comanda.id,
        valor_base: comanda.total,
        percentual_comissao: percentualComissao,
        valor_comissao: calculoComissao.valor_comissao,
        valor_total: calculoComissao.valor_total,
        metodo_pagamento: 'dinheiro', // Será definido no caixa
        observacoes: observacoes.trim() || undefined
      };

      await onConfirm(dadosFechamento);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao processar fechamento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Fechamento de Conta
              </h2>
              <p className="text-sm text-gray-500">
                Comanda #{getComandaNumber(comanda.id)}
                {comanda.mesa?.numero && ` - Mesa ${comanda.mesa.numero}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Lista de Itens Consumidos */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span>Itens Consumidos</span>
              {comanda.itens && comanda.itens.length > 0 && (
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {comanda.itens.length} {comanda.itens.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              {comanda.itens && comanda.itens.length > 0 ? (
                <div className="space-y-3">
                  {comanda.itens.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-start bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            {index + 1}
                          </span>
                          <div className="font-medium text-gray-900">
                            {item.nome_produto}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">{item.quantidade}x</span> {CommissionCalculator.formatCurrency(item.preco_unitario)}
                          {item.observacoes && (
                            <div className="text-xs text-gray-400 italic mt-1">
                              Obs: {item.observacoes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {CommissionCalculator.formatCurrency(item.preco_total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.quantidade > 1 && `${item.quantidade} unidades`}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Subtotal */}
                  <div className="border-t pt-3 mt-3 bg-white rounded-lg p-3">
                    <div className="flex justify-between items-center font-semibold text-gray-900">
                      <span>Subtotal dos Itens</span>
                      <span className="text-lg">{CommissionCalculator.formatCurrency(comanda.total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Calculator className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">
                    Nenhum item encontrado na comanda
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Verifique se a comanda possui itens adicionados
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuração de Comissão */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Comissão do Garçom
            </h3>
            <div className="bg-blue-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentual de Comissão (0% - 30%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={percentualComissao}
                    onChange={(e) => handlePercentualChange(e.target.value)}
                    disabled={loading}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !calculoComissao.percentual_valido 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="10.0"
                  />
                  <span className="text-sm text-gray-500">%</span>
                  <button
                    type="button"
                    onClick={() => setPercentualComissao(0)}
                    disabled={loading}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Zerar
                  </button>
                </div>
                {!calculoComissao.percentual_valido && calculoComissao.erro && (
                  <p className="text-sm text-red-600 mt-1">{calculoComissao.erro}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Você pode ajustar o percentual ou zerá-lo completamente
                </p>
              </div>

              {/* Cálculo da Comissão */}
              {calculoComissao.percentual_valido && (
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor da comissão:</span>
                    <span className="font-medium">
                      {CommissionCalculator.formatCurrency(calculoComissao.valor_comissao)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Percentual aplicado:</span>
                    <span className="font-medium">
                      {CommissionCalculator.formatPercentage(calculoComissao.percentual_comissao)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Adicione observações sobre o fechamento..."
            />
          </div>

          {/* Informação sobre Pendência de Pagamento */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Envio para Caixa
                </h4>
                <p className="text-sm text-blue-700">
                  Esta comanda será enviada como <strong>pendente de pagamento</strong> para o caixa. 
                  O operador do caixa escolherá o método de pagamento (dinheiro, cartão, PIX, etc.) no momento do processamento.
                </p>
              </div>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Erro no Processamento</h4>
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Totalizador */}
        <div className="border-t bg-gray-50 p-6">
          <div className="space-y-4">
            {/* Resumo dos Valores */}
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor dos itens:</span>
                <span>{CommissionCalculator.formatCurrency(comanda.total)}</span>
              </div>
              {calculoComissao.percentual_valido && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Comissão ({CommissionCalculator.formatPercentage(percentualComissao)}):
                  </span>
                  <span>{CommissionCalculator.formatCurrency(calculoComissao.valor_comissao)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {CommissionCalculator.formatCurrency(
                      calculoComissao.percentual_valido 
                        ? calculoComissao.valor_total 
                        : comanda.total
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || !calculoComissao.percentual_valido}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando para Caixa...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Fechar e Enviar para Caixa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloseAccountModal;