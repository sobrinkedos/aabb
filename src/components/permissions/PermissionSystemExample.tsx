/**
 * Exemplo Completo do Sistema de Permissões
 * 
 * Demonstra como integrar todos os componentes e hooks do sistema
 * de permissões em uma aplicação React real.
 */

import React, { useState } from 'react';
import {
  BarRole,
  SystemModule,
  ModulePermissions,
} from '../../types/permissions';

import { usePermissions, usePermissionCheck } from '../../hooks/usePermissions';
import {
  PermissionGuard,
  ViewGuard,
  CreateGuard,
  EditGuard,
  DeleteGuard,
  AdminGuard,
  RoleGuard,
  ManagementGuard,
  ManagerOnlyGuard,
  OperationalGuard,
} from './PermissionGuard';

import PermissionEditor from './PermissionEditor';

import {
  generateNavigationMenu,
  generateActionButtons,
  filterTableColumns,
  generateTableActionColumn,
  canAccessRoute,
  generateAccessDeniedMessage,
} from '../../utils/ui-permission-utils';

// ============================================================================
// COMPONENTE DE EXEMPLO
// ============================================================================

interface PermissionSystemExampleProps {
  currentUserRole: BarRole;
  customPermissions?: ModulePermissions;
}

export const PermissionSystemExample: React.FC<PermissionSystemExampleProps> = ({
  currentUserRole,
  customPermissions,
}) => {
  const [selectedModule, setSelectedModule] = useState<SystemModule>('funcionarios');
  const [showPermissionEditor, setShowPermissionEditor] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<ModulePermissions | undefined>();

  // Hook de verificação de permissões
  const { hasPermission, canAccess, canManage } = usePermissionCheck(currentUserRole, customPermissions);

  // Hook completo de permissões (para demonstração)
  const {
    permissions,
    permissionSummary,
    isDefaultPermissions,
    updatePermissions,
    resetToDefault,
  } = usePermissions({
    role: currentUserRole,
    customPermissions,
    enableLogging: true,
  });

  // Gerar menu de navegação baseado nas permissões
  const navigationMenu = generateNavigationMenu(currentUserRole, customPermissions);

  // Gerar botões de ação para o módulo selecionado
  const actionButtons = generateActionButtons(
    selectedModule,
    currentUserRole,
    customPermissions,
    {
      onCreate: () => alert('Criar novo item'),
      onEdit: () => alert('Editar item'),
      onDelete: () => alert('Excluir item'),
      onExport: () => alert('Exportar dados'),
    }
  );

  // Exemplo de colunas de tabela
  const tableColumns = [
    { id: 'name', label: 'Nome', field: 'name' },
    { id: 'email', label: 'Email', field: 'email' },
    { 
      id: 'salary', 
      label: 'Salário', 
      field: 'salary',
      permission: { module: 'funcionarios' as SystemModule, action: 'administrar' as const }
    },
    { 
      id: 'performance', 
      label: 'Performance', 
      field: 'performance',
      permission: { module: 'relatorios' as SystemModule, action: 'visualizar' as const }
    },
  ];

  const filteredColumns = filterTableColumns(tableColumns, currentUserRole, customPermissions);

  const actionColumn = generateTableActionColumn(
    selectedModule,
    currentUserRole,
    customPermissions,
    {
      onView: (row) => alert(`Ver ${row.name}`),
      onEdit: (row) => alert(`Editar ${row.name}`),
      onDelete: (row) => alert(`Excluir ${row.name}`),
    }
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Sistema de Permissões - Exemplo Completo</h1>
      
      {/* Informações do usuário atual */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Usuário Atual</h3>
        <p><strong>Função:</strong> {currentUserRole}</p>
        <p><strong>Permissões:</strong> {isDefaultPermissions ? 'Padrão' : 'Customizadas'}</p>
        <p><strong>Resumo:</strong> {permissionSummary.accessibleModules} módulos acessíveis, 
           nível {permissionSummary.permissionLevel}</p>
        
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowPermissionEditor(!showPermissionEditor)}
            style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px',
            }}
          >
            {showPermissionEditor ? 'Ocultar' : 'Mostrar'} Editor de Permissões
          </button>
          
          <button
            onClick={resetToDefault}
            style={{
              padding: '8px 16px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Resetar Permissões
          </button>
        </div>
      </div>

      {/* Editor de permissões */}
      {showPermissionEditor && (
        <div style={{ marginBottom: '20px' }}>
          <PermissionEditor
            userRole={currentUserRole}
            initialPermissions={editingPermissions}
            onPermissionsChange={setEditingPermissions}
            onSave={(perms) => {
              console.log('Permissões salvas:', perms);
              alert('Permissões salvas com sucesso!');
            }}
            showPresets={true}
            allowCustomPresets={true}
            style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Menu de navegação */}
        <div style={{ flex: '0 0 250px' }}>
          <h3>Menu de Navegação</h3>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px' }}>
            {navigationMenu.map(item => (
              <div key={item.id} style={{ marginBottom: '8px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  padding: '8px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                }}>
                  {item.icon} {item.label}
                </div>
                {item.children && (
                  <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                    {item.children.map(child => (
                      <div 
                        key={child.id}
                        style={{ 
                          padding: '4px 8px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          ':hover': { background: '#e9ecef' }
                        }}
                        onClick={() => setSelectedModule(child.id as SystemModule)}
                      >
                        {child.icon} {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div style={{ flex: 1 }}>
          <h3>Módulo: {selectedModule}</h3>
          
          {/* Verificação de acesso ao módulo */}
          <ViewGuard
            userRole={currentUserRole}
            customPermissions={customPermissions}
            module={selectedModule}
            fallback={
              <div style={{ 
                color: '#F44336', 
                background: '#ffebee', 
                padding: '16px', 
                borderRadius: '8px' 
              }}>
                {generateAccessDeniedMessage(selectedModule, 'visualizar', currentUserRole)}
              </div>
            }
            hideWhenDenied={false}
          >
            {/* Botões de ação */}
            <div style={{ marginBottom: '16px' }}>
              <h4>Ações Disponíveis</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {actionButtons.map(button => (
                  <button
                    key={button.id}
                    onClick={button.onClick}
                    disabled={!button.onClick}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: button.onClick ? 'pointer' : 'not-allowed',
                      background: button.variant === 'primary' ? '#4CAF50' :
                                 button.variant === 'danger' ? '#F44336' : '#2196F3',
                      color: 'white',
                      opacity: button.onClick ? 1 : 0.5,
                    }}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exemplo de tabela com colunas filtradas */}
            <div style={{ marginBottom: '16px' }}>
              <h4>Tabela de Dados</h4>
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ 
                  display: 'flex', 
                  background: '#f8f9fa', 
                  padding: '12px',
                  fontWeight: 'bold',
                }}>
                  {filteredColumns.map(col => (
                    <div key={col.id} style={{ flex: 1, padding: '0 8px' }}>
                      {col.label}
                    </div>
                  ))}
                  {actionColumn && (
                    <div style={{ flex: '0 0 120px', padding: '0 8px' }}>
                      {actionColumn.label}
                    </div>
                  )}
                </div>
                
                {/* Dados de exemplo */}
                {[
                  { name: 'João Silva', email: 'joao@exemplo.com', salary: 'R$ 3.000', performance: '85%' },
                  { name: 'Maria Santos', email: 'maria@exemplo.com', salary: 'R$ 3.500', performance: '92%' },
                ].map((row, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    padding: '12px',
                    borderTop: '1px solid #eee',
                  }}>
                    {filteredColumns.map(col => (
                      <div key={col.id} style={{ flex: 1, padding: '0 8px' }}>
                        {row[col.field as keyof typeof row]}
                      </div>
                    ))}
                    {actionColumn && (
                      <div style={{ flex: '0 0 120px', padding: '0 8px' }}>
                        {actionColumn.render?.(null, row)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Exemplos de guards específicos */}
            <div>
              <h4>Exemplos de Proteção por Permissão</h4>
              
              <CreateGuard
                userRole={currentUserRole}
                customPermissions={customPermissions}
                module={selectedModule}
              >
                <div style={{ color: '#4CAF50', marginBottom: '8px' }}>
                  ✅ Você pode CRIAR neste módulo
                </div>
              </CreateGuard>

              <EditGuard
                userRole={currentUserRole}
                customPermissions={customPermissions}
                module={selectedModule}
              >
                <div style={{ color: '#FF9800', marginBottom: '8px' }}>
                  ✅ Você pode EDITAR neste módulo
                </div>
              </EditGuard>

              <DeleteGuard
                userRole={currentUserRole}
                customPermissions={customPermissions}
                module={selectedModule}
              >
                <div style={{ color: '#F44336', marginBottom: '8px' }}>
                  ✅ Você pode EXCLUIR neste módulo
                </div>
              </DeleteGuard>

              <AdminGuard
                userRole={currentUserRole}
                customPermissions={customPermissions}
                module={selectedModule}
              >
                <div style={{ color: '#9C27B0', marginBottom: '8px' }}>
                  ✅ Você pode ADMINISTRAR este módulo
                </div>
              </AdminGuard>

              <ManagerOnlyGuard userRole={currentUserRole}>
                <div style={{ color: '#673AB7', marginBottom: '8px' }}>
                  ✅ Conteúdo exclusivo para GERENTES
                </div>
              </ManagerOnlyGuard>

              <OperationalGuard userRole={currentUserRole}>
                <div style={{ color: '#607D8B', marginBottom: '8px' }}>
                  ✅ Conteúdo para funcionários OPERACIONAIS
                </div>
              </OperationalGuard>

              {/* Exemplo de gerenciamento */}
              <div style={{ marginTop: '16px' }}>
                <h5>Capacidade de Gerenciamento</h5>
                {(['atendente', 'garcom', 'cozinheiro', 'barman', 'gerente'] as BarRole[]).map(role => (
                  <ManagementGuard
                    key={role}
                    managerRole={currentUserRole}
                    targetRole={role}
                  >
                    <div style={{ color: '#795548', marginBottom: '4px' }}>
                      ✅ Você pode gerenciar: {role}
                    </div>
                  </ManagementGuard>
                ))}
              </div>
            </div>
          </ViewGuard>
        </div>
      </div>

      {/* Informações de debug */}
      <div style={{ 
        marginTop: '20px', 
        padding: '16px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '12px',
      }}>
        <h4>Debug - Verificações Rápidas</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <div>Pode ver dashboard: {canAccess('dashboard') ? '✅' : '❌'}</div>
          <div>Pode criar funcionários: {hasPermission('funcionarios', 'criar') ? '✅' : '❌'}</div>
          <div>Pode ver relatórios: {canAccess('relatorios') ? '✅' : '❌'}</div>
          <div>Pode gerenciar garçom: {canManage('garcom') ? '✅' : '❌'}</div>
          <div>Pode acessar /configuracoes: {canAccessRoute('/configuracoes', currentUserRole, customPermissions) ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
};

export default PermissionSystemExample;