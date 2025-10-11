/**
 * Gerenciador de Acesso ao Sistema
 * 
 * Interface para gerenciar acesso ao sistema, reset de credenciais e monitoramento
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, ShieldX, Key, RefreshCw, 
  Eye, EyeOff, AlertTriangle, CheckCircle, 
  Clock, User, Mail, Phone, Calendar
} from 'lucide-react';
import { useBarEmployees } from '../../hooks/useBarEmployees';
import { supabase, supabaseAdmin } from '../../lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

interface SystemAccessManagerProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface AccessInfo {
  hasSystemAccess: boolean;
  isActive: boolean;
  lastLogin?: string;
  loginAttempts: number;
  passwordNeedsReset: boolean;
  accountLocked: boolean;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AccessLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  success: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const SystemAccessManager: React.FC<SystemAccessManagerProps> = ({
  employeeId,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { getEmployeeById } = useBarEmployees();
  const [employee, setEmployee] = useState<any>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'access' | 'credentials' | 'logs'>('access');

  // Estados para geração de credenciais
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      loadEmployeeData();
    }
  }, [isOpen, employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados do funcionário
      const employeeData = await getEmployeeById(employeeId);
      if (!employeeData) {
        throw new Error('Funcionário não encontrado');
      }
      setEmployee(employeeData);

      // Carregar informações de acesso
      await loadAccessInfo(employeeData);
      await loadAccessLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessInfo = async (employeeData: any) => {
    try {
      // Buscar dados do usuário na empresa
      const { data: usuarioEmpresa, error } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('user_id', employeeData.employee_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (usuarioEmpresa) {
        setAccessInfo({
          hasSystemAccess: usuarioEmpresa.tem_acesso_sistema,
          isActive: usuarioEmpresa.ativo,
          lastLogin: usuarioEmpresa.ultimo_login,
          loginAttempts: usuarioEmpresa.tentativas_login_falhadas || 0,
          passwordNeedsReset: usuarioEmpresa.senha_provisoria || false,
          accountLocked: usuarioEmpresa.tentativas_login_falhadas >= 5,
          email: usuarioEmpresa.email,
          createdAt: usuarioEmpresa.created_at,
          updatedAt: usuarioEmpresa.updated_at
        });
      } else {
        setAccessInfo({
          hasSystemAccess: false,
          isActive: false,
          loginAttempts: 0,
          passwordNeedsReset: false,
          accountLocked: false
        });
      }
    } catch (err) {
      console.error('Erro ao carregar informações de acesso:', err);
    }
  };

  const loadAccessLogs = async () => {
    // Por enquanto, logs simulados - implementar com tabela de auditoria real
    const mockLogs: AccessLog[] = [
      {
        id: '1',
        action: 'Login realizado',
        timestamp: new Date().toISOString(),
        details: 'Login bem-sucedido via web',
        success: true
      },
      {
        id: '2',
        action: 'Tentativa de login falhada',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        details: 'Senha incorreta',
        success: false
      }
    ];
    setAccessLogs(mockLogs);
  };

  // ============================================================================
  // AÇÕES DE GERENCIAMENTO
  // ============================================================================

  const toggleSystemAccess = async () => {
    try {
      setProcessing(true);
      setError(null);

      const newAccessState = !accessInfo?.hasSystemAccess;

      if (newAccessState && !accessInfo?.email) {
        // Criar acesso ao sistema
        await createSystemAccess();
      } else {
        // Apenas toggle do acesso
        await updateSystemAccess(newAccessState);
      }

      await loadEmployeeData();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar acesso');
    } finally {
      setProcessing(false);
    }
  };

  const createSystemAccess = async () => {
    if (!employee) return;

    const employeeData = employee.employee || employee.usuario_empresa;
    const name = employeeData?.name || employeeData?.nome_completo || 'Funcionário';
    const email = employeeData?.email || `${employee.id}@empresa.com`;

    // Gerar senha temporária
    const tempPassword = generateTempPassword();

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name,
          role: employee.bar_role
        }
      });

      if (authError) throw authError;

      // Criar registro na tabela usuarios_empresa
      const { error: dbError } = await supabase
        .from('usuarios_empresa')
        .insert({
          user_id: authData.user.id,
          empresa_id: '00000000-0000-0000-0000-000000000001', // Default empresa
          nome_completo: name,
          email,
          telefone: employeeData?.phone || employeeData?.telefone,
          cargo: employee.bar_role,
          tipo_usuario: 'funcionario',
          status: 'ativo',
          senha_provisoria: true,
          ativo: true,
          tem_acesso_sistema: true,
          papel: 'USER'
        });

      if (dbError) throw dbError;

      // Atualizar employee_id na tabela bar_employees
      await supabase
        .from('bar_employees')
        .update({ employee_id: authData.user.id })
        .eq('id', employee.id);

      // Mostrar credenciais geradas
      setGeneratedCredentials({
        email,
        password: tempPassword
      });
      setShowCredentials(true);

    } catch (error) {
      console.error('Erro ao criar acesso ao sistema:', error);
      throw error;
    }
  };

  const updateSystemAccess = async (hasAccess: boolean) => {
    const { error } = await supabase
      .from('usuarios_empresa')
      .update({ 
        tem_acesso_sistema: hasAccess,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', employee?.employee_id);

    if (error) throw error;
  };

  const resetPassword = async () => {
    try {
      setProcessing(true);
      setError(null);

      if (!accessInfo?.email) {
        throw new Error('Email não encontrado');
      }

      // Gerar nova senha temporária
      const newPassword = generateTempPassword();

      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        employee.employee_id,
        { password: newPassword }
      );

      if (authError) throw authError;

      // Marcar como senha provisória
      const { error: dbError } = await supabase
        .from('usuarios_empresa')
        .update({ 
          senha_provisoria: true,
          tentativas_login_falhadas: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', employee.employee_id);

      if (dbError) throw dbError;

      // Mostrar nova senha
      setGeneratedCredentials({
        email: accessInfo.email,
        password: newPassword
      });
      setShowCredentials(true);

      await loadEmployeeData();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resetar senha');
    } finally {
      setProcessing(false);
    }
  };

  const unlockAccount = async () => {
    try {
      setProcessing(true);
      setError(null);

      const { error } = await supabase
        .from('usuarios_empresa')
        .update({ 
          tentativas_login_falhadas: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', employee?.employee_id);

      if (error) throw error;

      await loadEmployeeData();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desbloquear conta');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  const employeeData = employee?.employee || employee?.usuario_empresa;
  const name = employeeData?.name || employeeData?.nome_completo || 'Funcionário';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gerenciar Acesso ao Sistema</h2>
              <p className="text-gray-600">{name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['access', 'credentials', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'access' && 'Controle de Acesso'}
                {tab === 'credentials' && 'Credenciais'}
                {tab === 'logs' && 'Logs de Acesso'}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && accessInfo && (
            <>
              {/* Tab: Access Control */}
              {activeTab === 'access' && (
                <div className="space-y-6">
                  {/* Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {accessInfo.hasSystemAccess ? (
                          <ShieldCheck className="h-5 w-5 text-green-600" />
                        ) : (
                          <ShieldX className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">Acesso ao Sistema</span>
                      </div>
                      <p className={`text-sm ${
                        accessInfo.hasSystemAccess ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {accessInfo.hasSystemAccess ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Status da Conta</span>
                      </div>
                      <p className={`text-sm ${
                        accessInfo.isActive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {accessInfo.isActive ? 'Ativa' : 'Inativa'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium">Tentativas de Login</span>
                      </div>
                      <p className={`text-sm ${
                        accessInfo.loginAttempts >= 5 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {accessInfo.loginAttempts}/5
                        {accessInfo.accountLocked && ' (Bloqueada)'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Acesso ao Sistema</h3>
                        <p className="text-sm text-gray-600">
                          {accessInfo.hasSystemAccess 
                            ? 'Funcionário pode fazer login no sistema'
                            : 'Funcionário não pode acessar o sistema'
                          }
                        </p>
                      </div>
                      <button
                        onClick={toggleSystemAccess}
                        disabled={processing}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          accessInfo.hasSystemAccess
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        } disabled:opacity-50`}
                      >
                        {processing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          accessInfo.hasSystemAccess ? 'Remover Acesso' : 'Conceder Acesso'
                        )}
                      </button>
                    </div>

                    {accessInfo.accountLocked && (
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-red-900">Conta Bloqueada</h3>
                          <p className="text-sm text-red-600">
                            Muitas tentativas de login falhadas
                          </p>
                        </div>
                        <button
                          onClick={unlockAccount}
                          disabled={processing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Desbloquear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Credentials */}
              {activeTab === 'credentials' && (
                <div className="space-y-6">
                  {accessInfo.email ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Informações de Login</h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">Email: {accessInfo.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              Senha: {accessInfo.passwordNeedsReset ? 'Temporária (deve ser alterada)' : 'Definida pelo usuário'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={resetPassword}
                          disabled={processing}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                        >
                          <Key className="h-4 w-4" />
                          <span>Resetar Senha</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShieldX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Sem Acesso ao Sistema
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Este funcionário ainda não possui credenciais de acesso.
                      </p>
                      <button
                        onClick={toggleSystemAccess}
                        disabled={processing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Criar Acesso ao Sistema
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Access Logs */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Histórico de Acessos</h3>
                  
                  {accessLogs.length > 0 ? (
                    <div className="space-y-2">
                      {accessLogs.map((log) => (
                        <div key={log.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            log.success ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{log.action}</p>
                            <p className="text-xs text-gray-500">{log.details}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum log de acesso disponível</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Credentials Modal */}
        {showCredentials && generatedCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="text-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-gray-900">Credenciais Geradas</h3>
                <p className="text-sm text-gray-600">
                  Anote estas informações com segurança
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-sm bg-white px-2 py-1 rounded border">
                      {generatedCredentials.email}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedCredentials.email)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Senha Temporária
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-sm bg-white px-2 py-1 rounded border">
                      {generatedCredentials.password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedCredentials.password)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  ⚠️ O funcionário deve alterar a senha no primeiro login
                </p>
              </div>

              <button
                onClick={() => setShowCredentials(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAccessManager;