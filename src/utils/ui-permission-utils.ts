/**
 * Utilitários de Permissões para Componentes UI
 * 
 * Fornece funções utilitárias para integrar o sistema de permissões
 * com componentes de interface do usuário existentes.
 * 
 * @version 1.0.0
 */

import {
  BarRole,
  SystemModule,
  PermissionAction,
  ModulePermissions,
} from '../types/permissions';

import {
  hasPermission,
  canAccessModule,
  canManageUser,
} from './permission-utils';

// ============================================================================
// INTERFACES PARA UI
// ============================================================================

interface MenuItemPermission {
  module: SystemModule;
  action?: PermissionAction;
  requiredRole?: BarRole[];
}

interface UIMenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  permission?: MenuItemPermission;
  children?: UIMenuItem[];
}

interface ButtonPermission {
  module: SystemModule;
  action: PermissionAction;
  fallbackText?: string;
  fallbackIcon?: string;
  hideWhenDenied?: boolean;
}

interface UIButton {
  id: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  permission?: ButtonPermission;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

interface TableColumnPermission {
  module: SystemModule;
  action: PermissionAction;
}

interface UITableColumn {
  id: string;
  label: string;
  field: string;
  permission?: TableColumnPermission;
  render?: (value: any, row: any) => React.ReactNode;
}

interface FormFieldPermission {
  module: SystemModule;
  action: PermissionAction;
  readOnlyWhenDenied?: boolean;
}

interface UIFormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  permission?: FormFieldPermission;
  validation?: any;
}

// ============================================================================
// FUNÇÕES PARA MENUS
// ============================================================================

/**
 * Filtra itens de menu baseado nas permissões do usuário
 */
export function filterMenuItems(
  menuItems: UIMenuItem[],
  userRole: BarRole,
  customPermissions?: ModulePermissions
): UIMenuItem[] {
  return menuItems
    .map(item => {
      // Verificar permissão do item atual
      if (item.permission) {
        const { module, action = 'visualizar', requiredRole } = item.permission;
        
        // Verificar função específica se definida
        if (requiredRole && !requiredRole.includes(userRole)) {
          return null;
        }
        
        // Verificar permissão de módulo
        if (!hasPermission(userRole, module, action, customPermissions)) {
          return null;
        }
      }
      
      // Filtrar filhos recursivamente
      const filteredChildren = item.children 
        ? filterMenuItems(item.children, userRole, customPermissions)
        : undefined;
      
      // Se tem filhos mas nenhum passou no filtro, remover o item pai
      if (item.children && filteredChildren && filteredChildren.length === 0) {
        return null;
      }
      
      return {
        ...item,
        children: filteredChildren,
      };
    })
    .filter((item): item is UIMenuItem => item !== null);
}

/**
 * Gera menu de navegação baseado nas permissões
 */
export function generateNavigationMenu(
  userRole: BarRole,
  customPermissions?: ModulePermissions
): UIMenuItem[] {
  const baseMenu: UIMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      path: '/dashboard',
      permission: { module: 'dashboard' }
    },
    {
      id: 'operacional',
      label: 'Operacional',
      icon: 'work',
      children: [
        {
          id: 'atendimento',
          label: 'Atendimento',
          icon: 'restaurant_menu',
          path: '/atendimento',
          permission: { module: 'atendimento_bar' }
        },
        {
          id: 'cozinha',
          label: 'Cozinha',
          icon: 'restaurant',
          path: '/cozinha',
          permission: { module: 'monitor_cozinha' }
        },
        {
          id: 'bar',
          label: 'Bar',
          icon: 'local_bar',
          path: '/bar',
          permission: { module: 'monitor_bar' }
        },
        {
          id: 'caixa',
          label: 'Caixa',
          icon: 'point_of_sale',
          path: '/caixa',
          permission: { module: 'gestao_caixa' }
        }
      ]
    },
    {
      id: 'gestao',
      label: 'Gestão',
      icon: 'business',
      children: [
        {
          id: 'clientes',
          label: 'Clientes',
          icon: 'people',
          path: '/clientes',
          permission: { module: 'clientes' }
        },
        {
          id: 'funcionarios',
          label: 'Funcionários',
          icon: 'badge',
          path: '/funcionarios',
          permission: { module: 'funcionarios' }
        },
        {
          id: 'estoque',
          label: 'Estoque',
          icon: 'inventory',
          path: '/estoque',
          permission: { module: 'estoque' }
        },
        {
          id: 'cardapio',
          label: 'Cardápio',
          icon: 'menu_book',
          path: '/cardapio',
          permission: { module: 'cardapio' }
        }
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: 'analytics',
      path: '/relatorios',
      permission: { module: 'relatorios' }
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: 'settings',
      path: '/configuracoes',
      permission: { module: 'configuracoes', requiredRole: ['gerente'] }
    }
  ];
  
  return filterMenuItems(baseMenu, userRole, customPermissions);
}

// ============================================================================
// FUNÇÕES PARA BOTÕES
// ============================================================================

/**
 * Filtra botões baseado nas permissões do usuário
 */
export function filterButtons(
  buttons: UIButton[],
  userRole: BarRole,
  customPermissions?: ModulePermissions
): UIButton[] {
  return buttons
    .map(button => {
      if (!button.permission) {
        return button;
      }
      
      const { module, action, fallbackText, fallbackIcon, hideWhenDenied = false } = button.permission;
      
      if (!hasPermission(userRole, module, action, customPermissions)) {
        if (hideWhenDenied) {
          return null;
        }
        
        // Retornar versão desabilitada
        return {
          ...button,
          label: fallbackText || button.label,
          icon: fallbackIcon || button.icon,
          onClick: undefined,
          variant: 'secondary' as const,
        };
      }
      
      return button;
    })
    .filter((button): button is UIButton => button !== null);
}

/**
 * Gera botões de ação para uma tela específica
 */
export function generateActionButtons(
  module: SystemModule,
  userRole: BarRole,
  customPermissions?: ModulePermissions,
  callbacks?: {
    onCreate?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onExport?: () => void;
  }
): UIButton[] {
  const buttons: UIButton[] = [
    {
      id: 'create',
      label: 'Criar',
      icon: 'add',
      onClick: callbacks?.onCreate,
      permission: { module, action: 'criar' },
      variant: 'primary'
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'edit',
      onClick: callbacks?.onEdit,
      permission: { module, action: 'editar' },
      variant: 'secondary'
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: 'delete',
      onClick: callbacks?.onDelete,
      permission: { module, action: 'excluir' },
      variant: 'danger'
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: 'download',
      onClick: callbacks?.onExport,
      permission: { module, action: 'visualizar' },
      variant: 'secondary'
    }
  ];
  
  return filterButtons(buttons, userRole, customPermissions);
}

// ============================================================================
// FUNÇÕES PARA TABELAS
// ============================================================================

/**
 * Filtra colunas de tabela baseado nas permissões
 */
export function filterTableColumns(
  columns: UITableColumn[],
  userRole: BarRole,
  customPermissions?: ModulePermissions
): UITableColumn[] {
  return columns.filter(column => {
    if (!column.permission) {
      return true;
    }
    
    const { module, action } = column.permission;
    return hasPermission(userRole, module, action, customPermissions);
  });
}

/**
 * Gera colunas de ação para tabela
 */
export function generateTableActionColumn(
  module: SystemModule,
  userRole: BarRole,
  customPermissions?: ModulePermissions,
  callbacks?: {
    onView?: (row: any) => void;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
  }
): UITableColumn | null {
  const actions = [];
  
  if (hasPermission(userRole, module, 'visualizar', customPermissions) && callbacks?.onView) {
    actions.push({
      label: 'Ver',
      icon: 'visibility',
      onClick: callbacks.onView,
      color: '#2196F3'
    });
  }
  
  if (hasPermission(userRole, module, 'editar', customPermissions) && callbacks?.onEdit) {
    actions.push({
      label: 'Editar',
      icon: 'edit',
      onClick: callbacks.onEdit,
      color: '#FF9800'
    });
  }
  
  if (hasPermission(userRole, module, 'excluir', customPermissions) && callbacks?.onDelete) {
    actions.push({
      label: 'Excluir',
      icon: 'delete',
      onClick: callbacks.onDelete,
      color: '#F44336'
    });
  }
  
  if (actions.length === 0) {
    return null;
  }
  
  return {
    id: 'actions',
    label: 'Ações',
    field: 'actions',
    render: (_, row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => action.onClick(row)}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '4px',
              background: action.color,
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
    )
  };
}

// ============================================================================
// FUNÇÕES PARA FORMULÁRIOS
// ============================================================================

/**
 * Filtra campos de formulário baseado nas permissões
 */
export function filterFormFields(
  fields: UIFormField[],
  userRole: BarRole,
  customPermissions?: ModulePermissions,
  isEditMode: boolean = false
): UIFormField[] {
  return fields
    .map(field => {
      if (!field.permission) {
        return field;
      }
      
      const { module, action, readOnlyWhenDenied = false } = field.permission;
      const requiredAction = isEditMode ? 'editar' : 'criar';
      
      if (!hasPermission(userRole, module, requiredAction, customPermissions)) {
        if (readOnlyWhenDenied) {
          // Tornar campo somente leitura
          return {
            ...field,
            type: 'text',
            required: false,
            // Adicionar propriedade readOnly se suportada
          };
        } else {
          // Remover campo
          return null;
        }
      }
      
      return field;
    })
    .filter((field): field is UIFormField => field !== null);
}

/**
 * Determina se um formulário pode ser submetido
 */
export function canSubmitForm(
  module: SystemModule,
  userRole: BarRole,
  isEditMode: boolean,
  customPermissions?: ModulePermissions
): boolean {
  const requiredAction = isEditMode ? 'editar' : 'criar';
  return hasPermission(userRole, module, requiredAction, customPermissions);
}

// ============================================================================
// FUNÇÕES PARA DASHBOARDS
// ============================================================================

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  permission?: {
    module: SystemModule;
    action?: PermissionAction;
  };
  size?: 'small' | 'medium' | 'large';
  order?: number;
}

/**
 * Filtra widgets de dashboard baseado nas permissões
 */
export function filterDashboardWidgets(
  widgets: DashboardWidget[],
  userRole: BarRole,
  customPermissions?: ModulePermissions
): DashboardWidget[] {
  return widgets
    .filter(widget => {
      if (!widget.permission) {
        return true;
      }
      
      const { module, action = 'visualizar' } = widget.permission;
      return hasPermission(userRole, module, action, customPermissions);
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Gera widgets padrão baseado na função do usuário
 */
export function generateDefaultDashboardWidgets(
  userRole: BarRole,
  customPermissions?: ModulePermissions
): DashboardWidget[] {
  const allWidgets: DashboardWidget[] = [
    {
      id: 'sales-summary',
      title: 'Resumo de Vendas',
      component: () => <div>Widget de Vendas</div>,
      permission: { module: 'gestao_caixa' },
      size: 'large',
      order: 1
    },
    {
      id: 'orders-queue',
      title: 'Fila de Pedidos',
      component: () => <div>Widget de Pedidos</div>,
      permission: { module: 'atendimento_bar' },
      size: 'medium',
      order: 2
    },
    {
      id: 'kitchen-status',
      title: 'Status da Cozinha',
      component: () => <div>Widget da Cozinha</div>,
      permission: { module: 'monitor_cozinha' },
      size: 'medium',
      order: 3
    },
    {
      id: 'bar-status',
      title: 'Status do Bar',
      component: () => <div>Widget do Bar</div>,
      permission: { module: 'monitor_bar' },
      size: 'medium',
      order: 4
    },
    {
      id: 'employee-summary',
      title: 'Resumo de Funcionários',
      component: () => <div>Widget de Funcionários</div>,
      permission: { module: 'funcionarios' },
      size: 'small',
      order: 5
    },
    {
      id: 'reports-quick',
      title: 'Relatórios Rápidos',
      component: () => <div>Widget de Relatórios</div>,
      permission: { module: 'relatorios' },
      size: 'small',
      order: 6
    }
  ];
  
  return filterDashboardWidgets(allWidgets, userRole, customPermissions);
}

// ============================================================================
// FUNÇÕES DE UTILIDADE GERAL
// ============================================================================

/**
 * Gera mensagem de acesso negado personalizada
 */
export function generateAccessDeniedMessage(
  module: SystemModule,
  action: PermissionAction,
  userRole: BarRole
): string {
  const moduleNames: Record<SystemModule, string> = {
    dashboard: 'Dashboard',
    monitor_bar: 'Monitor do Bar',
    atendimento_bar: 'Atendimento do Bar',
    monitor_cozinha: 'Monitor da Cozinha',
    gestao_caixa: 'Gestão de Caixa',
    clientes: 'Gestão de Clientes',
    funcionarios: 'Gestão de Funcionários',
    relatorios: 'Relatórios',
    configuracoes: 'Configurações',
    estoque: 'Controle de Estoque',
    cardapio: 'Gestão de Cardápio',
    promocoes: 'Promoções',
    financeiro: 'Financeiro'
  };
  
  const actionNames: Record<PermissionAction, string> = {
    visualizar: 'visualizar',
    criar: 'criar',
    editar: 'editar',
    excluir: 'excluir',
    administrar: 'administrar'
  };
  
  const moduleName = moduleNames[module] || module;
  const actionName = actionNames[action];
  
  return `Sua função (${userRole}) não possui permissão para ${actionName} no módulo ${moduleName}.`;
}

/**
 * Verifica se o usuário tem acesso a uma rota específica
 */
export function canAccessRoute(
  route: string,
  userRole: BarRole,
  customPermissions?: ModulePermissions
): boolean {
  // Mapeamento de rotas para módulos
  const routeModuleMap: Record<string, SystemModule> = {
    '/dashboard': 'dashboard',
    '/atendimento': 'atendimento_bar',
    '/cozinha': 'monitor_cozinha',
    '/bar': 'monitor_bar',
    '/caixa': 'gestao_caixa',
    '/clientes': 'clientes',
    '/funcionarios': 'funcionarios',
    '/relatorios': 'relatorios',
    '/configuracoes': 'configuracoes',
    '/estoque': 'estoque',
    '/cardapio': 'cardapio',
    '/promocoes': 'promocoes',
    '/financeiro': 'financeiro'
  };
  
  const module = routeModuleMap[route];
  if (!module) {
    return true; // Rota não mapeada, permitir acesso
  }
  
  return canAccessModule(userRole, module, customPermissions);
}