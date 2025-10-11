import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  Bell, 
  Zap, 
  BarChart3, 
  FileText,
  Crown,
  ChevronRight
} from 'lucide-react';
import { usePrivileges } from '../../contexts/PrivilegeContext';
import { PapelUsuario } from '../../types/multitenant';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  privilege?: string;
  roles?: PapelUsuario[];
  category?: string;
}

export function AdminMenu() {
  const { 
    papel, 
    verificarPrivilegio, 
    podeAcessarConfiguracao,
    getDescricaoPapel,
    getCorPapel,
    isPrimeiroUsuario
  } = usePrivileges();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      id: 'users',
      title: 'Gerenciar Usuários',
      description: 'Criar, editar e gerenciar usuários da empresa',
      icon: <Users className="w-6 h-6" />,
      path: '/admin/usuarios',
      privilege: 'gerenciar_usuarios'
    },
    {
      id: 'company-config',
      title: 'Configurações da Empresa',
      description: 'Configurações gerais, tema e informações básicas',
      icon: <Settings className="w-6 h-6" />,
      path: '/admin/configuracoes/geral',
      category: 'geral'
    },
    {
      id: 'security-config',
      title: 'Configurações de Segurança',
      description: 'Políticas de senha, 2FA e controles de acesso',
      icon: <Shield className="w-6 h-6" />,
      path: '/admin/configuracoes/seguranca',
      category: 'seguranca'
    },
    {
      id: 'system-config',
      title: 'Configurações do Sistema',
      description: 'Backup, logs, limites e configurações técnicas',
      icon: <Database className="w-6 h-6" />,
      path: '/admin/configuracoes/sistema',
      category: 'sistema'
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Configurar alertas e notificações por email',
      icon: <Bell className="w-6 h-6" />,
      path: '/admin/configuracoes/notificacoes',
      category: 'notificacoes'
    },
    {
      id: 'integrations',
      title: 'Integrações Externas',
      description: 'APIs, webhooks e integrações com sistemas externos',
      icon: <Zap className="w-6 h-6" />,
      path: '/admin/configuracoes/integracoes',
      category: 'integracao'
    },
    {
      id: 'reports',
      title: 'Relatórios Avançados',
      description: 'Relatórios detalhados e análises do sistema',
      icon: <BarChart3 className="w-6 h-6" />,
      path: '/admin/relatorios',
      privilege: 'relatorios_avancados'
    },
    {
      id: 'audit',
      title: 'Auditoria Completa',
      description: 'Logs detalhados e auditoria de segurança',
      icon: <FileText className="w-6 h-6" />,
      path: '/admin/auditoria',
      privilege: 'auditoria_completa'
    }
  ];

  const hasAccess = (item: MenuItem): boolean => {
    // Verificar por privilégio
    if (item.privilege) {
      return verificarPrivilegio(item.privilege as any);
    }
    
    // Verificar por categoria de configuração
    if (item.category) {
      return podeAcessarConfiguracao(item.category);
    }
    
    // Verificar por papéis específicos
    if (item.roles) {
      return papel ? item.roles.includes(papel) : false;
    }
    
    return true;
  };

  const getAccessibleItems = (): MenuItem[] => {
    return menuItems.filter(hasAccess);
  };

  const isCurrentPath = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  const getRoleColor = () => {
    if (!papel) return 'gray';
    return getCorPapel(papel);
  };

  const getRoleColorClasses = () => {
    const color = getRoleColor();
    switch (color) {
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const accessibleItems = getAccessibleItems();

  if (accessibleItems.length === 0) {
    return (
      <div className="p-6 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sem Acesso Administrativo
        </h3>
        <p className="text-gray-600">
          Você não tem privilégios para acessar funcionalidades administrativas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com informações do usuário */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Painel Administrativo
          </h1>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColorClasses()}`}>
            {isPrimeiroUsuario && <Crown className="w-4 h-4 mr-1" />}
            {papel && getDescricaoPapel(papel)}
          </div>
        </div>
        
        <p className="text-gray-600">
          Gerencie configurações e usuários da sua empresa. Seu nível de acesso determina quais funcionalidades estão disponíveis.
        </p>
      </div>

      {/* Grid de itens do menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`
              group relative bg-white rounded-lg border-2 p-6 hover:border-blue-300 transition-all duration-200
              ${isCurrentPath(item.path) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`
                  inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4
                  ${isCurrentPath(item.path) 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }
                `}>
                  {item.icon}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {item.description}
                </p>
              </div>
              
              <ChevronRight className={`
                w-5 h-5 transition-transform duration-200
                ${isCurrentPath(item.path) 
                  ? 'text-blue-600 transform translate-x-1' 
                  : 'text-gray-400 group-hover:text-blue-600 group-hover:transform group-hover:translate-x-1'
                }
              `} />
            </div>
            
            {/* Indicador de acesso especial */}
            {(item.category === 'seguranca' || item.category === 'sistema' || item.category === 'integracao') && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Acesso restrito"></div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Informações sobre restrições */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-1">Sobre os Níveis de Acesso</h4>
            <p className="mb-2">
              As funcionalidades disponíveis dependem do seu papel na empresa:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Administrador Principal:</strong> Acesso total a todas as configurações</li>
              <li><strong>Administrador:</strong> Acesso limitado (sem configurações críticas)</li>
              <li><strong>Gerente:</strong> Gerenciamento de usuários e relatórios</li>
              <li><strong>Usuário:</strong> Sem acesso administrativo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}