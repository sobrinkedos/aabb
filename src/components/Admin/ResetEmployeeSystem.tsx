import React, { useState } from 'react';
import { AlertTriangle, Trash2, Shield, Eye } from 'lucide-react';
import { resetEmployeeSystem, simulateReset } from '../../../scripts/reset-employee-system';

interface ResetResult {
  success: boolean;
  message?: string;
  error?: string;
  beforeCounts?: any;
  afterCounts?: any;
  adminPreserved?: string | null;
}

export const ResetEmployeeSystem: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [preserveAdmin, setPreserveAdmin] = useState(true);

  const handleSimulate = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const simulationResult = await simulateReset();
      setResult(simulationResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro na simulação'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setShowConfirmation(false);
    
    try {
      const resetResult = await resetEmployeeSystem({ 
        preserveAdmin,
        dryRun: false 
      });
      setResult(resetResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro no reset'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">
          Reset do Sistema de Funcionários
        </h2>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 mb-2">
              ⚠️ ATENÇÃO - OPERAÇÃO IRREVERSÍVEL
            </h3>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• Remove TODOS os funcionários cadastrados</li>
              <li>• Apaga todas as permissões de usuários</li>
              <li>• Remove credenciais de acesso dos funcionários</li>
              <li>• Limpa histórico de atividades</li>
              <li>• Esta operação NÃO pode ser desfeita</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configurações de Segurança
          </h3>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preserveAdmin}
              onChange={(e) => setPreserveAdmin(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              Preservar usuário administrador principal
            </span>
          </label>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            {preserveAdmin 
              ? "✅ O primeiro usuário administrador será mantido"
              : "❌ TODOS os usuários serão removidos (incluindo admins)"
            }
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Tabelas Afetadas</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• bar_employees</li>
            <li>• usuarios_empresa</li>
            <li>• permissoes_usuario</li>
            <li>• daily_cash_summary</li>
            <li>• menu_itens</li>
            <li>• empresas (apenas no reset completo)</li>
            <li>• auth.users (funcionários)</li>
            <li>• auth.sessions</li>
            <li>• auth.refresh_tokens</li>
          </ul>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleSimulate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Eye className="w-4 h-4" />
          {isLoading ? 'Simulando...' : 'Simular Reset'}
        </button>

        <button
          onClick={handleReset}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
            showConfirmation 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {isLoading 
            ? 'Executando...' 
            : showConfirmation 
              ? 'CONFIRMAR RESET' 
              : 'Executar Reset'
          }
        </button>

        {showConfirmation && (
          <button
            onClick={() => setShowConfirmation(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
        )}
      </div>

      {result && (
        <div className={`rounded-lg p-4 ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? '✅ Operação Concluída' : '❌ Erro na Operação'}
          </h3>
          
          {result.message && (
            <p className={`text-sm mb-3 ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
          )}

          {result.error && (
            <p className="text-sm text-red-700 mb-3">
              Erro: {result.error}
            </p>
          )}

          {result.beforeCounts && result.afterCounts && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-semibold mb-1">Antes:</h4>
                <ul className="space-y-1">
                  <li>Funcionários: {result.beforeCounts.bar_employees}</li>
                  <li>Usuários: {result.beforeCounts.usuarios_empresa}</li>
                  <li>Permissões: {result.beforeCounts.permissoes_usuario}</li>
                  <li>Resumos Caixa: {result.beforeCounts.daily_cash_summary}</li>
                  <li>Menu Itens: {result.beforeCounts.menu_itens}</li>
                  <li>Empresas: {result.beforeCounts.empresas}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Depois:</h4>
                <ul className="space-y-1">
                  <li>Funcionários: {result.afterCounts.bar_employees}</li>
                  <li>Usuários: {result.afterCounts.usuarios_empresa}</li>
                  <li>Permissões: {result.afterCounts.permissoes_usuario}</li>
                  <li>Resumos Caixa: {result.afterCounts.daily_cash_summary}</li>
                  <li>Menu Itens: {result.afterCounts.menu_itens}</li>
                  <li>Empresas: {result.afterCounts.empresas}</li>
                </ul>
              </div>
            </div>
          )}

          {result.adminPreserved && (
            <p className="text-xs text-green-600 mt-2">
              👤 Admin preservado: {result.adminPreserved}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>Recomendações:</strong>
        <ul className="mt-1 space-y-1">
          <li>• Execute primeiro uma simulação para ver o impacto</li>
          <li>• Faça backup do banco antes de executar</li>
          <li>• Use apenas em ambiente de desenvolvimento/teste</li>
          <li>• Confirme que não há dados importantes antes de prosseguir</li>
        </ul>
      </div>
    </div>
  );
};