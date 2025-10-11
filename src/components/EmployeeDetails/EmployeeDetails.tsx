/**
 * Componente de Detalhes do Funcionário
 * 
 * Visualização completa dos dados do funcionário com histórico e trilha de auditoria
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, Clock, Shield, 
  Edit, Save, X, History, Award, AlertCircle,
  MapPin, CreditCard, FileText, Settings, Key, Trash2
} from 'lucide-react';
import { useBarEmployees } from '../../hooks/useBarEmployees';
import { SystemAccessManager } from '../SystemAccess/SystemAccessManager';
import { RemovalModal } from '../EmployeeLifecycle/RemovalModal';
import { AuditLogsViewer } from '../AuditLogs/AuditLogsViewer';

// ============================================================================
// INTERFACES
// ============================================================================

interface Employee {
  id: string;
  employee_id?: string;
  bar_role: string;
  shift_preference?: string;
  specialties?: string[];
  commission_rate?: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  notes?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  employee?: {
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    avatar?: string;
  };
  usuario_empresa?: {
    nome_completo: string;
    email: string;
    telefone?: string;
    cargo: string;
    tem_acesso_sistema: boolean;
    status: string;
    created_at?: string;
    updated_at?: string;
  };
}

interface EmployeeDetailsProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children, className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
    <div className="flex items-center space-x-2 mb-3">
      {icon}
      <h3 className="font-medium text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, className = '' }) => (
  <div className={`flex justify-between py-2 ${className}`}>
    <span className="text-sm text-gray-600">{label}:</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({
  employeeId,
  isOpen,
  onClose,
  onEdit
}) => {
  const { getEmployeeById } = useBarEmployees();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'permissions' | 'audit'>('details');
  const [showSystemAccessManager, setShowSystemAccessManager] = useState(false);
  const [showRemovalModal, setShowRemovalModal] = useState(false);

  // Carregar dados do funcionário
  useEffect(() => {
    if (isOpen && employeeId) {
      loadEmployeeData();
    }
  }, [isOpen, employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployeeById(employeeId);
      setEmployee(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar funcionário');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const employeeData = employee?.employee || employee?.usuario_empresa;
  const name = employeeData?.name || employeeData?.nome_completo || 'Nome não informado';
  const email = employeeData?.email || 'Email não informado';
  const phone = employeeData?.phone || employeeData?.telefone;
  const cpf = employeeData?.cpf;

  const roleLabels: Record<string, string> = {
    'atendente': 'Atendente',
    'garcom': 'Garçom',
    'cozinheiro': 'Cozinheiro',
    'barman': 'Barman',
    'gerente': 'Gerente'
  };

  const shiftLabels: Record<string, string> = {
    'manha': 'Manhã',
    'tarde': 'Tarde',
    'noite': 'Noite',
    'qualquer': 'Qualquer'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-lg">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{name}</h2>
              <p className="text-gray-600">
                {employee ? (roleLabels[employee.bar_role] || employee.bar_role) : 'Carregando...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {employee && (
              <>
                <button
                  onClick={() => setShowSystemAccessManager(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Key className="h-4 w-4" />
                  <span>Gerenciar Acesso</span>
                </button>
                <button
                  onClick={() => setShowRemovalModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remover</span>
                </button>
              </>
            )}
            {employee && onEdit && (
              <button
                onClick={() => onEdit(employee)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Detalhes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Permissões
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Auditoria
            </button>
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
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <div className="text-red-600 mb-2">Erro ao carregar funcionário</div>
              <div className="text-sm text-gray-500">{error}</div>
            </div>
          )}

          {employee && !loading && !error && (
            <>
              {/* Tab: Details */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Informações Pessoais */}
                  <InfoCard
                    title="Informações Pessoais"
                    icon={<User className="h-5 w-5 text-gray-500" />}
                  >
                    <div className="space-y-1">
                      <DetailRow label="Nome Completo" value={name} />
                      <DetailRow label="Email" value={email} />
                      {phone && <DetailRow label="Telefone" value={phone} />}
                      {cpf && <DetailRow label="CPF" value={cpf} />}
                      <DetailRow 
                        label="Status" 
                        value={
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            employee.is_active || employee.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.is_active || employee.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        }
                      />
                    </div>
                  </InfoCard>

                  {/* Informações Profissionais */}
                  <InfoCard
                    title="Informações Profissionais"
                    icon={<Award className="h-5 w-5 text-gray-500" />}
                  >
                    <div className="space-y-1">
                      <DetailRow 
                        label="Função" 
                        value={roleLabels[employee.bar_role] || employee.bar_role} 
                      />
                      {employee.shift_preference && (
                        <DetailRow 
                          label="Turno Preferido" 
                          value={shiftLabels[employee.shift_preference] || employee.shift_preference} 
                        />
                      )}
                      {employee.commission_rate && (
                        <DetailRow 
                          label="Taxa de Comissão" 
                          value={`${employee.commission_rate}%`} 
                        />
                      )}
                      {employee.start_date && (
                        <DetailRow 
                          label="Data de Contratação" 
                          value={new Date(employee.start_date).toLocaleDateString('pt-BR')} 
                        />
                      )}
                      {employee.end_date && (
                        <DetailRow 
                          label="Data de Saída" 
                          value={new Date(employee.end_date).toLocaleDateString('pt-BR')} 
                        />
                      )}
                    </div>
                  </InfoCard>

                  {/* Especialidades */}
                  {employee.specialties && employee.specialties.length > 0 && (
                    <InfoCard
                      title="Especialidades"
                      icon={<Award className="h-5 w-5 text-gray-500" />}
                      className="lg:col-span-2"
                    >
                      <div className="flex flex-wrap gap-2">
                        {employee.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </InfoCard>
                  )}

                  {/* Acesso ao Sistema */}
                  {employee.usuario_empresa && (
                    <InfoCard
                      title="Acesso ao Sistema"
                      icon={<Shield className="h-5 w-5 text-gray-500" />}
                      className="lg:col-span-2"
                    >
                      <div className="space-y-1">
                        <DetailRow 
                          label="Tem Acesso" 
                          value={
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              employee.usuario_empresa.tem_acesso_sistema
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {employee.usuario_empresa.tem_acesso_sistema ? 'Sim' : 'Não'}
                            </span>
                          }
                        />
                        <DetailRow 
                          label="Cargo no Sistema" 
                          value={employee.usuario_empresa.cargo} 
                        />
                        <DetailRow 
                          label="Status do Usuário" 
                          value={employee.usuario_empresa.status} 
                        />
                      </div>
                    </InfoCard>
                  )}

                  {/* Observações */}
                  {employee.notes && (
                    <InfoCard
                      title="Observações"
                      icon={<FileText className="h-5 w-5 text-gray-500" />}
                      className="lg:col-span-2"
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {employee.notes}
                      </p>
                    </InfoCard>
                  )}
                </div>
              )}

              {/* Tab: History */}
              {activeTab === 'history' && (
                <InfoCard
                  title="Histórico de Atividades"
                  icon={<History className="h-5 w-5 text-gray-500" />}
                >
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Funcionário criado
                        </p>
                        <p className="text-xs text-gray-500">
                          {employee.created_at ? 
                            new Date(employee.created_at).toLocaleString('pt-BR') : 
                            'Data não disponível'
                          }
                        </p>
                      </div>
                    </div>

                    {employee.updated_at && employee.updated_at !== employee.created_at && (
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Última atualização
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(employee.updated_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="text-center py-8 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        Histórico detalhado será implementado em versões futuras
                      </p>
                    </div>
                  </div>
                </InfoCard>
              )}

              {/* Tab: Permissions */}
              {activeTab === 'permissions' && (
                <InfoCard
                  title="Permissões do Sistema"
                  icon={<Settings className="h-5 w-5 text-gray-500" />}
                >
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Gerenciamento de permissões será implementado em versões futuras
                    </p>
                    <p className="text-xs mt-1">
                      Por enquanto, as permissões são baseadas na função do funcionário
                    </p>
                  </div>
                </InfoCard>
              )}

              {/* Tab: Audit */}
              {activeTab === 'audit' && (
                <AuditLogsViewer employeeId={employee.id} limit={20} />
              )}
            </>
          )}
        </div>
      </div>

      {/* System Access Manager Modal */}
      {showSystemAccessManager && employee && (
        <SystemAccessManager
          employeeId={employee.id}
          isOpen={showSystemAccessManager}
          onClose={() => setShowSystemAccessManager(false)}
          onUpdate={loadEmployeeData}
        />
      )}

      {/* Removal Modal */}
      {showRemovalModal && employee && (
        <RemovalModal
          employee={employee}
          isOpen={showRemovalModal}
          onClose={() => setShowRemovalModal(false)}
          onComplete={() => {
            onClose();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default EmployeeDetails;