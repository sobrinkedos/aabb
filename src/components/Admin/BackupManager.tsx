import React, { useState, useEffect } from 'react';
import { useBackupSecurity } from '../../hooks/useBackupSecurity';
import { RestoreWizard } from './RestoreWizard';
import { SecuritySettings } from './SecuritySettings';
import { SecurityAudit } from './SecurityAudit';
import { 
  BackupJob, 
  BackupStatus, 
  BackupType,
  RestorePoint,
  SecurityPolicy 
} from '../../types/backup-security';

interface BackupManagerProps {
  className?: string;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ className }) => {
  const {
    backupJobs,
    restorePoints,
    securityPolicies,
    isLoading,
    error,
    createBackupJob,
    updateBackupJob,
    deleteBackupJob,
    executeBackup,
    scheduleBackup,
    getBackupHistory,
    validateBackupIntegrity
  } = useBackupSecurity();

  const [activeTab, setActiveTab] = useState<'backups' | 'restore' | 'security' | 'audit'>('backups');
  const [showRestoreWizard, setShowRestoreWizard] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupJob | null>(null);
  const [newBackupForm, setNewBackupForm] = useState({
    name: '',
    type: 'full' as BackupType,
    schedule: '',
    retention: 30,
    compression: true,
    encryption: true,
    includeFiles: true,
    includeDatabase: true
  });

  const getStatusColor = (status: BackupStatus): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: BackupStatus) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'running':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCreateBackup = async () => {
    try {
      await createBackupJob(newBackupForm);
      setNewBackupForm({
        name: '',
        type: 'full',
        schedule: '',
        retention: 30,
        compression: true,
        encryption: true,
        includeFiles: true,
        includeDatabase: true
      });
    } catch (error) {
      console.error('Erro ao criar backup:', error);
    }
  };

  const handleExecuteBackup = async (job: BackupJob) => {
    try {
      await executeBackup(job.id);
    } catch (error) {
      console.error('Erro ao executar backup:', error);
    }
  };

  const handleValidateIntegrity = async (job: BackupJob) => {
    try {
      const result = await validateBackupIntegrity(job.id);
      if (result.isValid) {
        alert('Backup íntegro e válido!');
      } else {
        alert(`Problemas encontrados: ${result.issues?.join(', ')}`);
      }
    } catch (error) {
      console.error('Erro ao validar integridade:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backup e Segurança</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie backups, restaurações e políticas de segurança
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSecuritySettings(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Configurações de Segurança
            </button>
            <button
              onClick={() => setShowRestoreWizard(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Restaurar Backup
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'backups', label: 'Backups' },
            { id: 'restore', label: 'Pontos de Restauração' },
            { id: 'security', label: 'Políticas de Segurança' },
            { id: 'audit', label: 'Auditoria' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'backups' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Total de Backups</p>
                    <p className="text-2xl font-semibold text-blue-600">{backupJobs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Bem-sucedidos</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {backupJobs.filter(b => b.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Falharam</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {backupJobs.filter(b => b.status === 'failed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Agendados</p>
                    <p className="text-2xl font-semibold text-yellow-600">
                      {backupJobs.filter(b => b.status === 'scheduled').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Novo Backup Form */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Backup</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Backup
                  </label>
                  <input
                    type="text"
                    value={newBackupForm.name}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Backup diário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Backup
                  </label>
                  <select
                    value={newBackupForm.type}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, type: e.target.value as BackupType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full">Completo</option>
                    <option value="incremental">Incremental</option>
                    <option value="differential">Diferencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agendamento (Cron)
                  </label>
                  <input
                    type="text"
                    value={newBackupForm.schedule}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, schedule: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0 2 * * *"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newBackupForm.includeDatabase}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, includeDatabase: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Incluir Banco de Dados</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newBackupForm.includeFiles}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, includeFiles: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Incluir Arquivos</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newBackupForm.compression}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, compression: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Compressão</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newBackupForm.encryption}
                    onChange={(e) => setNewBackupForm(prev => ({ ...prev, encryption: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Criptografia</span>
                </label>

                <button
                  onClick={handleCreateBackup}
                  disabled={!newBackupForm.name}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Criar Backup
                </button>
              </div>
            </div>

            {/* Lista de Backups */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Backups Configurados</h3>
              <div className="space-y-3">
                {backupJobs.map(job => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{job.name}</h4>
                          <p className="text-sm text-gray-600">
                            Tipo: {job.type} | Retenção: {job.retention} dias
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                            {job.lastRun && (
                              <span className="text-xs text-gray-500">
                                Último: {new Date(job.lastRun).toLocaleString('pt-BR')}
                              </span>
                            )}
                            {job.nextRun && (
                              <span className="text-xs text-gray-500">
                                Próximo: {new Date(job.nextRun).toLocaleString('pt-BR')}
                              </span>
                            )}
                            {job.size && (
                              <span className="text-xs text-gray-500">
                                Tamanho: {formatFileSize(job.size)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExecuteBackup(job)}
                          disabled={job.status === 'running'}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Executar Agora
                        </button>
                        <button
                          onClick={() => handleValidateIntegrity(job)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Validar
                        </button>
                        <button
                          onClick={() => setSelectedBackup(job)}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteBackupJob(job.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {job.error && (
                      <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>Erro:</strong> {job.error}
                      </div>
                    )}
                  </div>
                ))}

                {backupJobs.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum backup configurado</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Crie seu primeiro backup para proteger os dados do sistema
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'restore' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Pontos de Restauração</h3>
              <button
                onClick={() => setShowRestoreWizard(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Restaurar Sistema
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restorePoints.map(point => (
                <div key={point.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{point.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {point.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{point.description}</p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div>Criado: {new Date(point.createdAt).toLocaleString('pt-BR')}</div>
                    <div>Tamanho: {formatFileSize(point.size)}</div>
                    <div>Versão: {point.version}</div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => setShowRestoreWizard(true)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Restaurar
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <SecuritySettings policies={securityPolicies} />
        )}

        {activeTab === 'audit' && (
          <SecurityAudit />
        )}
      </div>

      {/* Modals */}
      {showRestoreWizard && (
        <RestoreWizard
          restorePoints={restorePoints}
          onClose={() => setShowRestoreWizard(false)}
        />
      )}

      {showSecuritySettings && (
        <SecuritySettings
          policies={securityPolicies}
          onClose={() => setShowSecuritySettings(false)}
        />
      )}
    </div>
  );
};