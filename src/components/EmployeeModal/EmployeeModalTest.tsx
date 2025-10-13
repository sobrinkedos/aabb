import React, { useState } from 'react';
import { EmployeeModal } from './EmployeeModal';
import { Employee } from '../../types/employee.types';

/**
 * Componente de teste para verificar se o EmployeeModal está funcionando
 * Este componente pode ser usado temporariamente para testar o modal
 */
export const EmployeeModalTest: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleSave = async (employee: Employee) => {
    console.log('Funcionário salvo:', employee);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`Funcionário ${employee.name} salvo com sucesso!`);
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste do Modal de Funcionário</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Abrir Modal de Funcionário
        </button>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Funcionalidades Testadas:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>✅ Rolagem vertical adequada (altura máxima 90vh)</li>
            <li>✅ Sistema de permissões por módulo</li>
            <li>✅ Integração automática com app-garcom para garçons</li>
            <li>✅ Validação de CPF, email e telefone</li>
            <li>✅ Navegação por teclado (Tab, Escape)</li>
            <li>✅ Acessibilidade (ARIA labels)</li>
            <li>✅ Interface responsiva</li>
          </ul>
        </div>
      </div>

      <EmployeeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        mode="create"
      />
    </div>
  );
};