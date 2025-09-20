import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Zap, 
  BarChart3, 
  FileText,
  ChevronDown,
  Crown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PapelUsuario } from '../../types/multitenant';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  privilege?: keyof import('../../types/multitenant').PrivilegiosAdmin;
  role?: PapelUsuario[];
  children?: NavItem[];
  badge?: string;
}

export function AdminNavigation() {
  const { papel, verificarPrivilegio, isPrimeiroUsuario } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['main']);

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/admin'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: <Users className="w-5 h-5" />,
      privilege: 'gerenciar_usuarios',
      children: [
        {
          id: 'users-list',
          label: 'Listar Usuários',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/users'
        },
        {
          id: 'users-add',
          label: 'Adicionar Usuário',
          icon: <Users className="w-4 h-4" />,
          path: '/admin/users/new'
        }
      ]
    },
    {
      id: 'company',
      label: 'Empresa',
      icon: <Settings className="w-5 h-5" />,
      privilege: 'configuracoes_empresa',
      children: [
        {
          id: 'company-settings',
          label: 'Configurações Gerais',
          icon: <Settings className="w-4 h-4" />,
          path: '/admin/company'
        },
        {
          id: 'company-notifications',
          label: 'Notificações',
          icon: <Bell className="w-4 h-4" />,
          path: '/admin/notifications'
        }
      ]
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: <Shield className="w-5 h-5" />,
      privilege: 'configuracoes_seguranca',
      badge: 'SUPER_ADMIN',
      children: [
        {
          id: 'security-settings',
          label: 'Configurações de Segurança',
          icon: <Shield className="w-4 h-4" />,
          path: '/admin/security'
        },
        {
          id: 'security-audit',
          label: 'Auditoria',
          icon: <FileText className="w-4 h-4" />,
          path: '/admin/audit',
          privilege: 'auditoria_completa'
        }
      ]
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: <Database className="w-5 h-5" />,
      privilege: 'configuracoes_sistema',
      badge: 'SUPER_ADMIN',
      children: [
        {
          id: 'system-settings',
          label: 'Configurações do Sistema',
          icon: <Database className="w-4 h-4" />,
          path: '/admin/system'
        },
        {
          id: 'system-integrations',
          label: 'Integrações',
          icon: <Zap className="w-4 h-4" />,
          path: '/admin/integrations',
          privilege: 'integracao_externa'
        }
      ]
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: <BarChart3 className="w-5 h-5" />,
      privilege: 'relatorios_avancados',
      children: [
        {
          id: 'reports-list',
          label: 'Visualizar Relatórios',
          icon: <BarChart3 className="w-4 h-4" />,
          path: '/admin/reports'
        },
        {
          id: 'reports-new',
          label: 'Gerar Relatório',
          icon: <BarChart3 className="w-4 h-4" />,
          path: '/admin/reports/new'
        }
      ]
    }
  ];

  const hasAccess = (item: NavItem): boolean => {
    if (item.privilege) {
      return verificarPrivilegio(item.privilege);
    }
    if (item.role) {
      return papel ? item.role.includes(papel) : false;
    }
    return true;
  };

  const filterAccessibleItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (!hasAccess(item)) return false;
      
      if (item.children) {
        item.children = filterAccessibleItems(item.children);
        return item.children.length > 0;
      }
      
      return true;
    });
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isParentActive = (item: NavItem): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.path));
    }
    return false;
  };

  const accessibleItems = filterAccessibleItems(navigationItems);

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {isPrimeiroUsuario && (
            <Crown className="w-6 h-6 text-yellow-500" />
          )}
          <div>
            <h2 className="font-semibold text-gray-900">
              Painel Admin
            </h2>
            {papel && (
              <p className="text-xs text-gray-600">
                {papel === PapelUsuario.SUPER_ADMIN && 'Super Administrador'}
                {papel === PapelUsuario.ADMIN && 'Administrador'}
                {papel === PapelUsuario.MANAGER && 'Gerente'}
                {isPrimeiroUsuario && ' (Principal)'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-2">
        {accessibleItems.map((item) => (
          <div key={item.id} className="mb-1">
            {item.children ? (
              // Item com submenu
              <div>
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors
                    ${isParentActive(item) 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={isParentActive(item) ? 'text-blue-600' : 'text-gray-400'}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`
                    w-4 h-4 transition-transform
                    ${expandedItems.includes(item.id) ? 'transform rotate-180' : ''}
                    ${isParentActive(item) ? 'text-blue-600' : 'text-gray-400'}
                  `} />
                </button>
                
                {/* Submenu */}
                {expandedItems.includes(item.id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        to={child.path || '#'}
                        className={`
                          flex items-center space-x-3 p-2 rounded-lg transition-colors
                          ${isActive(child.path)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className={isActive(child.path) ? 'text-blue-600' : 'text-gray-400'}>
                          {child.icon}
                        </div>
                        <span className="text-sm font-medium">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Item simples
              <Link
                to={item.path || '#'}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-colors
                  ${isActive(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className={isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer com informações do usuário */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">Privilégios Ativos:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries({
              'Usuários': verificarPrivilegio('gerenciar_usuarios'),
              'Empresa': verificarPrivilegio('configuracoes_empresa'),
              'Segurança': verificarPrivilegio('configuracoes_seguranca'),
              'Sistema': verificarPrivilegio('configuracoes_sistema'),
              'Relatórios': verificarPrivilegio('relatorios_avancados'),
              'Auditoria': verificarPrivilegio('auditoria_completa')
            }).map(([name, hasPriv]) => (
              hasPriv && (
                <span
                  key={name}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800"
                >
                  {name}
                </span>
              )
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}