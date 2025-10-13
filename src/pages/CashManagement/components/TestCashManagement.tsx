import React from 'react';
import { useCashManagement } from '../../hooks/useCashManagement';
import { formatCurrency } from '../../types/cash-management';

// Teste básico de importação e funcionalidade
export const TestCashManagement: React.FC = () => {
  const { 
    currentSession, 
    loading, 
    error,
    openCashSession 
  } = useCashManagement();

  const testValue = formatCurrency(123.45);

  if (loading) {
    return <div>Carregando sistema de caixa...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className=\"p-4\">
      <h2 className=\"text-xl font-bold mb-4\">Teste do Sistema de Caixa</h2>
      <p>Status da sessão: {currentSession ? 'Aberta' : 'Fechada'}</p>
      <p>Teste de formatação: {testValue}</p>
      <p>✅ Sistema de caixa carregado com sucesso!</p>
    </div>
  );
};

export default TestCashManagement;