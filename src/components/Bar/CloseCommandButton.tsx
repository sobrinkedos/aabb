/**
 * Botão para Fechar Comanda - Integração Real
 * 
 * Componente que integra o modal de fechamento com o sistema real
 */

import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { CloseAccountModal } from '../sales/CloseAccountModal';
import { useCloseAccountModal } from '../../hooks/useCloseAccountModal';
import { Command } from '../../types/sales-management';

interface CloseCommandButtonProps {
  comanda: Command;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CloseCommandButton: React.FC<CloseCommandButtonProps> = ({
  comanda,
  onSuccess,
  onError,
  disabled = false,
  className = ''
}) => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    isOpen,
    selectedComanda,
    loading,
    error,
    openModal,
    closeModal,
    handleConfirm,
    clearError
  } = useCloseAccountModal({
    onSuccess: (result) => {
      console.log('✅ Comanda fechada com sucesso:', result);
      setShowSuccessMessage(true);
      
      // Esconder mensagem após 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error('❌ Erro ao fechar comanda:', error);
      if (onError) {
        onError(error.message);
      }
    }
  });

  const handleClick = () => {
    clearError();
    openModal(comanda);
  };

  // Verificar se a comanda pode ser fechada
  const canClose = comanda.status === 'aberta' && comanda.itens && comanda.itens.length > 0;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || !canClose || loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${canClose && !disabled
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          ${className}
        `}
        title={
          !canClose 
            ? 'Comanda deve estar aberta e ter itens para ser fechada'
            : 'Fechar comanda e enviar para caixa'
        }
      >
        <CreditCard className="w-4 h-4" />
        {loading ? 'Processando...' : 'Fechar Comanda'}
      </button>

      {/* Mensagem de Sucesso */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Comanda enviada para o caixa!</span>
          </div>
        </div>
      )}

      {/* Modal de Fechamento */}
      {selectedComanda && (
        <CloseAccountModal
          isOpen={isOpen}
          comanda={selectedComanda}
          onClose={closeModal}
          onConfirm={handleConfirm}
          loading={loading}
        />
      )}

      {/* Erro */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Erro: {error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CloseCommandButton;