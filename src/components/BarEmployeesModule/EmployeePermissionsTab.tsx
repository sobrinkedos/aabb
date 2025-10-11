/**
 * Aba de Permissões para o Módulo de Funcionários
 * 
 * Integra o UserPermissionManager ao módulo principal de funcionários,
 * permitindo configurar permissões específicas diretamente da interface.
 */

import React, { useState } from 'react';
import { Shield, Users, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { UserPermissionManager } from '../permissions/UserPermissionManager';

interface EmployeePermissionsTabProps {
  /** ID da empresa atual */
  empresaId?: string;
  
  /** Callback quando permissões são alteradas */
  onPermissionsChanged?: () => void;
}

export const EmployeePermissionsTab: React.FC<EmployeePermissionsTabProps> = ({
  empresaId,
  onPermissionsChanged
}) => {
  const [lastSavedUser, setLastSavedUser] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handlePermissionsSaved = (userId: string, permissions: any[]) => {
    setLastSavedUser(userId);
    setShowSuccessMessage(true);
    
    // Esconder mensagem após 3 segundos
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);

    // Notificar componente pai
    if (onPermissionsChanged) {
      onPermissionsChanged();
    }

    console.log(`✅ Permissões salvas para usuário ${userId}: ${permissions.length} módulos configurados`);
  };

  return (
    <div className="employee-permissions-tab">
      {/* Header da aba */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Permissões de Usuários</h2>
        </div>
        
        <p className="text-gray-600">
          Configure permissões específicas para cada funcionário. As permissões específicas 
          substituem as permissões padrão do cargo.
        </p>
      </div>

      {/* Mensagem de sucesso */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-medium">Permissões salvas com sucesso!</p>
            <p className="text-green-700 text-sm">
              As novas permissões entrarão em vigor no próximo login do usuário.
            </p>
          </div>
        </div>
      )}

      {/* Informações importantes */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-900 font-medium mb-2">Como funciona o sistema de permissões:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Permissões específicas:</strong> Substituem completamente as permissões do cargo</li>
              <li>• <strong>Sem permissões específicas:</strong> Usuário usa as permissões padrão do seu cargo</li>
              <li>• <strong>Efeito imediato:</strong> Mudanças são aplicadas no próximo login</li>
              <li>• <strong>Presets disponíveis:</strong> Use os presets para configurações rápidas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gerenciador de Permissões */}
      <UserPermissionManager
        empresaId={empresaId}
        onPermissionsSaved={handlePermissionsSaved}
        showOnlyActive={true}
        className="border-0 shadow-none"
      />

      {/* Rodapé com informações adicionais */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-gray-900 font-medium mb-2">Dicas de uso:</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Use o preset "Apenas Caixa" para operadores que só devem acessar o caixa</li>
              <li>• O preset "Atendimento Completo" é ideal para garçons e atendentes</li>
              <li>• Permissões administrativas devem ser concedidas com cuidado</li>
              <li>• Remova todas as permissões específicas para usar as padrões do cargo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePermissionsTab;