import React from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Users, 
  Clock, 
  Database, 
  Bell,
  X,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PapelUsuario } from '../../types/multitenant';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  requiredRole?: PapelUsuario[];
  requiredPrivilege?: keyof import('../../types/multitenant').PrivilegiosAdmin;
}

export function AdminAlerts() {
  const { papel, verificarPrivilegio, isPrimeiroUsuario } = useAuth();
  const [dismissedAlerts, setDismissedAlerts] = React.useState<string[]>([]);

  // Simulação de alertas - em produção viria da API
  const alerts: Alert[] = [
    {
      id: 'backup-pending',
      type: 'warning',
      title: 'Backup Pendente',
      message: 'O último backup foi realizado há 3 dias. Recomendamos executar um backup regularmente.',
      icon: <Database className="w-5 h-5" />,
      requiredRole: [PapelUsuario.SUPER_ADMIN],
      action: {
        label: 'Executar Backup',
        onClick: () => console.log('Executar backup')
      },
      dismissible: true
    },
    {
      id: 'security-update',
      type: 'info',
      title: 'Atualização de Segurança',
      message: 'Uma nova versão com melhorias de segurança está disponível.',
      icon: <Shield className="w-5 h-5" />,
      requiredRole: [PapelUsuario.SUPER_ADMIN],
      action: {
        label: 'Ver Detalhes',
        onClick: () => console.log('Ver detalhes da atualização')
      },
      dismissible: true
    },
    {
      id: 'inactive-users',
      type: 'warning',
      title: 'Usuários Inativos',
      message: 'Existem 3 usuários que não fazem login há mais de 30 dias.',
      icon: <Users className="w-5 h-5" />,
      requiredPrivilege: 'gerenciar_usuarios',
      action: {
        label: 'Revisar Usuários',
        onClick: () => console.log('Revisar usuários inativos')
      },
      dismissible: true
    },
    {
      id: 'session-timeout',
      type: 'info',
      title: 'Configuração de Sessão',
      message: 'O tempo limite de sessão está configurado para 24 horas. Considere reduzir para maior segurança.',
      icon: <Clock className="w-5 h-5" />,
      requiredPrivilege: 'configuracoes_seguranca',
      dismissible: true
    },
    {
      id: 'first-user-welcome',
      type: 'success',
      title: 'Bem-vindo, Administrador Principal!',
      message: 'Você é o primeiro usuário desta empresa. Explore as configurações para personalizar o sistema.',
      icon: <CheckCircle className="w-5 h-5" />,
      requiredRole: [PapelUsuario.SUPER_ADMIN],
      dismissible: true
    }
  ];

  const hasAccess = (alert: Alert): boolean => {
    // Verificar papel se especificado
    if (alert.requiredRole && papel) {
      if (!alert.requiredRole.includes(papel)) {
        return false;
      }
    }

    // Verificar privilégio se especificado
    if (alert.requiredPrivilege) {
      if (!verificarPrivilegio(alert.requiredPrivilege)) {
        return false;
      }
    }

    return true;
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-100 text-red-800 hover:bg-red-200'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          title: 'text-green-800',
          message: 'text-green-700',
          button: 'bg-green-100 text-green-800 hover:bg-green-200'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200',
          icon: 'text-gray-600',
          title: 'text-gray-800',
          message: 'text-gray-700',
          button: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        };
    }
  };

  // Filtrar alertas baseado no acesso e alertas dispensados
  const visibleAlerts = alerts.filter(alert => 
    hasAccess(alert) && !dismissedAlerts.includes(alert.id)
  );

  // Mostrar alerta especial para primeiro usuário
  const shouldShowFirstUserAlert = isPrimeiroUsuario && papel === PapelUsuario.SUPER_ADMIN;

  if (visibleAlerts.length === 0 && !shouldShowFirstUserAlert) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alerta especial para primeiro usuário */}
      {shouldShowFirstUserAlert && !dismissedAlerts.includes('first-user-welcome') && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 border border-transparent rounded-lg p-4 text-white">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-white mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">
                🎉 Bem-vindo ao seu novo sistema!
              </h4>
              <p className="text-blue-100 text-sm mb-3">
                Como administrador principal, você tem acesso completo a todas as funcionalidades. 
                Recomendamos começar configurando sua empresa e adicionando os primeiros usuários.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => console.log('Iniciar tour')}
                  className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-md hover:bg-opacity-30 transition-colors"
                >
                  Fazer Tour
                </button>
                <button
                  onClick={() => dismissAlert('first-user-welcome')}
                  className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-md hover:bg-opacity-30 transition-colors"
                >
                  Dispensar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas regulares */}
      {visibleAlerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        
        return (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${styles.container}`}
          >
            <div className="flex items-start space-x-3">
              <div className={`${styles.icon} mt-0.5`}>
                {alert.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${styles.title} mb-1`}>
                  {alert.title}
                </h4>
                <p className={`text-sm ${styles.message} mb-3`}>
                  {alert.message}
                </p>
                
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`
                      inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors
                      ${styles.button}
                    `}
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
              
              {alert.dismissible && (
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className={`${styles.icon} hover:opacity-70 transition-opacity`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Componente para mostrar alertas em formato compacto (para header)
export function AdminAlertsCompact() {
  const { papel, verificarPrivilegio } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Contar alertas não lidos (simulação)
  const unreadCount = 3;

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Alertas Administrativos</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <AdminAlerts />
          </div>
          
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowDropdown(false)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todos os alertas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}