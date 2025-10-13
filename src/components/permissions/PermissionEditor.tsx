/**
 * Editor Visual de Permissões
 * 
 * Componente para editar permissões de usuários de forma visual e intuitiva.
 * Permite configurar permissões por módulo e ação com validação em tempo real.
 * 
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  BarRole,
  SystemModule,
  PermissionAction,
  ModulePermission,
  ModulePermissions,
  PermissionPreset,
} from '../../types/permissions';

import { usePermissions, usePermissionPresets } from '../../hooks/usePermissions';
import { MODULE_DESCRIPTIONS } from '../../services/permission-presets';
import { formatPermissionsForDisplay } from '../../utils/permission-utils';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermissionEditorProps {
  /** Função do usuário */
  userRole: BarRole;
  
  /** Permissões iniciais */
  initialPermissions?: ModulePermissions;
  
  /** Callback quando permissões mudam */
  onPermissionsChange?: (permissions: ModulePermissions) => void;
  
  /** Callback quando permissões são salvas */
  onSave?: (permissions: ModulePermissions) => void;
  
  /** Se deve mostrar presets */
  showPresets?: boolean;
  
  /** Se deve permitir criação de presets customizados */
  allowCustomPresets?: boolean;
  
  /** Se está em modo somente leitura */
  readOnly?: boolean;
  
  /** Classe CSS customizada */
  className?: string;
  
  /** Estilo customizado */
  style?: React.CSSProperties;
}

interface ModulePermissionRowProps {
  module: SystemModule;
  permission: ModulePermission;
  onPermissionChange: (module: SystemModule, permission: ModulePermission) => void;
  readOnly?: boolean;
}

interface PermissionToggleProps {
  action: PermissionAction;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

interface PresetSelectorProps {
  userRole: BarRole;
  currentPermissions: ModulePermissions;
  onPresetApply: (permissions: ModulePermissions) => void;
  allowCustomPresets?: boolean;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Toggle para uma ação específica
 */
const PermissionToggle: React.FC<PermissionToggleProps> = ({
  action,
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  const actionLabels: Record<PermissionAction, string> = {
    visualizar: 'Ver',
    criar: 'Criar',
    editar: 'Editar',
    excluir: 'Excluir',
    administrar: 'Admin',
  };

  const actionColors: Record<PermissionAction, string> = {
    visualizar: '#4CAF50',
    criar: '#2196F3',
    editar: '#FF9800',
    excluir: '#F44336',
    administrar: '#9C27B0',
  };

  return (
    <div className="permission-toggle">
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        cursor: readOnly ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => !readOnly && onChange(e.target.checked)}
          disabled={disabled || readOnly}
          style={{ accentColor: actionColors[action] }}
        />
        <span style={{ 
          fontSize: '12px', 
          color: value ? actionColors[action] : '#666',
          fontWeight: value ? 'bold' : 'normal',
        }}>
          {actionLabels[action]}
        </span>
      </label>
    </div>
  );
};

/**
 * Linha de permissões para um módulo
 */
const ModulePermissionRow: React.FC<ModulePermissionRowProps> = ({
  module,
  permission,
  onPermissionChange,
  readOnly = false,
}) => {
  const moduleInfo = MODULE_DESCRIPTIONS[module];
  
  const handleActionChange = useCallback((action: PermissionAction, value: boolean) => {
    const newPermission = { ...permission, [action]: value };
    
    // Aplicar regras de dependência
    if (action === 'administrar' && value) {
      // Se administrar é ativado, ativar todas as outras
      newPermission.visualizar = true;
      newPermission.criar = true;
      newPermission.editar = true;
      newPermission.excluir = true;
    } else if (action === 'excluir' && value) {
      // Se excluir é ativado, ativar visualizar e editar
      newPermission.visualizar = true;
      newPermission.editar = true;
    } else if (action === 'editar' && value) {
      // Se editar é ativado, ativar visualizar
      newPermission.visualizar = true;
    } else if (action === 'criar' && value) {
      // Se criar é ativado, ativar visualizar
      newPermission.visualizar = true;
    }
    
    // Aplicar regras de desativação
    if (action === 'visualizar' && !value) {
      // Se visualizar é desativado, desativar todas as outras
      newPermission.criar = false;
      newPermission.editar = false;
      newPermission.excluir = false;
      newPermission.administrar = false;
    } else if (action === 'editar' && !value) {
      // Se editar é desativado, desativar excluir e administrar
      newPermission.excluir = false;
      newPermission.administrar = false;
    } else if (action === 'excluir' && !value) {
      // Se excluir é desativado, desativar administrar
      newPermission.administrar = false;
    }
    
    onPermissionChange(module, newPermission);
  }, [module, permission, onPermissionChange]);

  const actions: PermissionAction[] = ['visualizar', 'criar', 'editar', 'excluir', 'administrar'];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      borderBottom: '1px solid #eee',
      gap: '16px',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {moduleInfo?.name || module}
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
          {moduleInfo?.description || 'Módulo do sistema'}
        </div>
        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
          Categoria: {moduleInfo?.category || 'geral'}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {actions.map(action => (
          <PermissionToggle
            key={action}
            action={action}
            value={permission[action]}
            onChange={(value) => handleActionChange(action, value)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Seletor de presets
 */
const PresetSelector: React.FC<PresetSelectorProps> = ({
  userRole,
  currentPermissions,
  onPresetApply,
  allowCustomPresets = false,
}) => {
  const { presets, createPreset } = usePermissionPresets();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  const rolePresets = useMemo(() => 
    presets.filter(preset => preset.role === userRole),
    [presets, userRole]
  );

  const handlePresetApply = useCallback((preset: PermissionPreset) => {
    onPresetApply(preset.permissions);
  }, [onPresetApply]);

  const handleCreatePreset = useCallback(() => {
    if (!newPresetName.trim()) return;

    const preset = createPreset(
      newPresetName,
      newPresetDescription,
      userRole,
      currentPermissions
    );

    if (preset) {
      setShowCreateForm(false);
      setNewPresetName('');
      setNewPresetDescription('');
    }
  }, [newPresetName, newPresetDescription, userRole, currentPermissions, createPreset]);

  return (
    <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Presets de Permissões</h4>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {rolePresets.map(preset => (
          <button
            key={preset.id}
            onClick={() => handlePresetApply(preset)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: preset.isDefault ? '#e3f2fd' : '#fff',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title={preset.description}
          >
            {preset.name}
            {preset.isDefault && ' (Padrão)'}
          </button>
        ))}
      </div>

      {allowCustomPresets && (
        <div>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '6px 12px',
                border: '1px solid #2196F3',
                borderRadius: '4px',
                background: '#2196F3',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              + Criar Preset Customizado
            </button>
          ) : (
            <div style={{ marginTop: '12px', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Nome do preset"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', marginBottom: '4px' }}
                />
                <textarea
                  placeholder="Descrição (opcional)"
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  style={{ width: '100%', padding: '4px 8px', height: '60px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreatePreset}
                  disabled={!newPresetName.trim()}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid #4CAF50',
                    borderRadius: '4px',
                    background: '#4CAF50',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    padding: '4px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Editor principal de permissões
 */
export const PermissionEditor: React.FC<PermissionEditorProps> = ({
  userRole,
  initialPermissions,
  onPermissionsChange,
  onSave,
  showPresets = true,
  allowCustomPresets = false,
  readOnly = false,
  className,
  style,
}) => {
  const {
    permissions,
    isLoading,
    error,
    updatePermissions,
    resetToDefault,
    sanitizeCurrentPermissions,
    isValidConfiguration,
    permissionSummary,
    isDefaultPermissions,
  } = usePermissions({
    role: userRole,
    customPermissions: initialPermissions,
    enableLogging: process.env.NODE_ENV === 'development',
  });

  // Notificar mudanças
  React.useEffect(() => {
    if (onPermissionsChange) {
      onPermissionsChange(permissions);
    }
  }, [permissions, onPermissionsChange]);

  const handleModulePermissionChange = useCallback((module: SystemModule, permission: ModulePermission) => {
    updatePermissions({ [module]: permission });
  }, [updatePermissions]);

  const handlePresetApply = useCallback((presetPermissions: ModulePermissions) => {
    updatePermissions(presetPermissions);
  }, [updatePermissions]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(permissions);
    }
  }, [permissions, onSave]);

  const modules = Object.keys(permissions) as SystemModule[];

  return (
    <div className={className} style={{ ...style, opacity: isLoading ? 0.7 : 1 }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>
          Editor de Permissões - {userRole}
        </h3>
        
        {/* Status */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ 
            color: isValidConfiguration ? '#4CAF50' : '#F44336',
            fontWeight: 'bold',
          }}>
            {isValidConfiguration ? '✅ Configuração válida' : '❌ Configuração inválida'}
          </span>
          
          <span>
            Módulos: {permissionSummary.accessibleModules}/{permissionSummary.totalModules}
          </span>
          
          <span>
            Nível: {permissionSummary.permissionLevel}
          </span>
          
          {isDefaultPermissions && (
            <span style={{ color: '#2196F3' }}>
              📋 Permissões padrão
            </span>
          )}
        </div>

        {error && (
          <div style={{ 
            color: '#F44336', 
            background: '#ffebee', 
            padding: '8px', 
            borderRadius: '4px',
            marginTop: '8px',
            fontSize: '12px',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Presets */}
      {showPresets && !readOnly && (
        <PresetSelector
          userRole={userRole}
          currentPermissions={permissions}
          onPresetApply={handlePresetApply}
          allowCustomPresets={allowCustomPresets}
        />
      )}

      {/* Ações */}
      {!readOnly && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={resetToDefault}
            style={{
              padding: '6px 12px',
              border: '1px solid #FF9800',
              borderRadius: '4px',
              background: '#FF9800',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            🔄 Resetar para Padrão
          </button>
          
          <button
            onClick={sanitizeCurrentPermissions}
            style={{
              padding: '6px 12px',
              border: '1px solid #9C27B0',
              borderRadius: '4px',
              background: '#9C27B0',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            🧹 Sanitizar
          </button>
          
          {onSave && (
            <button
              onClick={handleSave}
              disabled={!isValidConfiguration}
              style={{
                padding: '6px 12px',
                border: '1px solid #4CAF50',
                borderRadius: '4px',
                background: isValidConfiguration ? '#4CAF50' : '#ccc',
                color: 'white',
                cursor: isValidConfiguration ? 'pointer' : 'not-allowed',
                fontSize: '12px',
              }}
            >
              💾 Salvar
            </button>
          )}
        </div>
      )}

      {/* Lista de módulos */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        background: '#fff',
      }}>
        <div style={{
          padding: '12px',
          background: '#f8f9fa',
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          fontSize: '14px',
        }}>
          Permissões por Módulo
        </div>
        
        {modules.map(module => (
          <ModulePermissionRow
            key={module}
            module={module}
            permission={permissions[module]!}
            onPermissionChange={handleModulePermissionChange}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Resumo */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '12px',
      }}>
        <strong>Resumo:</strong> {permissionSummary.accessibleModules} módulos acessíveis, 
        {permissionSummary.editableModules} editáveis, {permissionSummary.adminModules} com acesso administrativo
      </div>
    </div>
  );
};

export default PermissionEditor;