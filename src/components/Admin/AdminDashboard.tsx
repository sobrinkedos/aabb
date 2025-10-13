import React from 'react';
import { 
  Users, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Database
} from 'lucide-react';
import { usePrivileges } from '../../contexts/PrivilegeContext';
import { PapelUsuario } from '../../types/multitenant';

interface DashboardCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function AdminDashboard() {
  const { papel, verificarPrivilegio, isPrimeiroUsuario } = usePrivileges();

  // Cards baseados no papel do usuário
  const getCardsForRole = (): DashboardCard[] => {
    const baseCards: DashboardCard[] = [
      {
        title: 'Usuários Ativos',
        value: 12,
        description: 'Usuários com acesso ao sistema',
        icon: <Users className="w-6 h-6" />,
        color: 'blue',
        trend: { value: 2, isPositive: true }
      },
      {
        title: 'Último Login',
        value: '2 min atrás',
        description: 'Atividade mais recente',
        icon: <Activity className="w-6 h-6" />,
        color: 'green'
      }
    ];

    // Cards específicos para SUPER_ADMIN
    if (papel === PapelUsuario.SUPER_ADMIN) {
      baseCards.push(
        {
          title: 'Configurações Críticas',
          value: 'Seguras',
          description: 'Status das configurações de segurança',
          icon: <Shield className="w-6 h-6" />,
          color: 'green'
        },
        {
          title: 'Backup Sistema',
          value: 'Ativo',
          description: 'Último backup há 2 horas',
          icon: <Database className="w-6 h-6" />,
          color: 'blue'
        },
        {
          title: 'Alertas Segurança',
          value: 0,
          description: 'Tentativas de acesso suspeitas',
          icon: <AlertTriangle className="w-6 h-6" />,
          color: 'green'
        }
      );
    }

    // Cards para ADMIN
    if (papel === PapelUsuario.ADMIN) {
      baseCards.push(
        {
          title: 'Permissões Ativas',
          value: 45,
          description: 'Permissões configuradas',
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'blue'
        }
      );
    }

    // Cards para MANAGER
    if (papel === PapelUsuario.MANAGER) {
      baseCards.push(
        {
          title: 'Relatórios Gerados',
          value: 8,
          description: 'Este mês',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'purple',
          trend: { value: 3, isPositive: true }
        }
      );
    }

    return baseCards;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'green':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'red':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const cards = getCardsForRole();

  return (
    <div className="space-y-6">
      {/* Header com saudação personalizada */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {isPrimeiroUsuario ? '👑 ' : ''}
              Dashboard Administrativo
            </h1>
            <p className="text-blue-100">
              {papel === PapelUsuario.SUPER_ADMIN && 'Você tem acesso total ao sistema como Administrador Principal'}
              {papel === PapelUsuario.ADMIN && 'Você tem privilégios administrativos com algumas restrições'}
              {papel === PapelUsuario.MANAGER && 'Você pode gerenciar usuários e acessar relatórios'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Seu papel</div>
            <div className="text-lg font-semibold">
              {papel === PapelUsuario.SUPER_ADMIN && 'Administrador Principal'}
              {papel === PapelUsuario.ADMIN && 'Administrador'}
              {papel === PapelUsuario.MANAGER && 'Gerente'}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg border ${getColorClasses(card.color)}`}>
                {card.icon}
              </div>
              {card.trend && (
                <div className={`flex items-center text-sm ${
                  card.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${
                    card.trend.isPositive ? '' : 'transform rotate-180'
                  }`} />
                  +{card.trend.value}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {card.value}
              </h3>
              <p className="text-sm font-medium text-gray-700">
                {card.title}
              </p>
              <p className="text-xs text-gray-500">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ações rápidas baseadas no papel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verificarPrivilegio('gerenciar_usuarios') && (
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Users className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Adicionar Usuário</div>
                <div className="text-sm text-gray-500">Criar novo usuário na empresa</div>
              </div>
            </button>
          )}
          
          {verificarPrivilegio('configuracoes_empresa') && (
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Shield className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Configurações</div>
                <div className="text-sm text-gray-500">Ajustar configurações da empresa</div>
              </div>
            </button>
          )}
          
          {verificarPrivilegio('relatorios_avancados') && (
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Relatórios</div>
                <div className="text-sm text-gray-500">Gerar relatórios avançados</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Alertas e notificações baseadas no papel */}
      {papel === PapelUsuario.SUPER_ADMIN && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-medium text-yellow-800">Lembrete de Segurança</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Como Administrador Principal, revise regularmente as configurações de segurança e os logs de auditoria.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}    // 
Todos os administradores podem ver usuários se têm privilégio
    if (verificarPrivilegio('gerenciar_usuarios')) {
      cards.push(
        <DashboardCard
          key="total-users"
          title="Total de Usuários"
          value={stats.total_usuarios}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          description="Usuários ativos na empresa"
        />,
        <DashboardCard
          key="active-users"
          title="Usuários Ativos"
          value={stats.usuarios_ativos}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          description="Usuários com acesso ativo"
        />
      );

      // Mostrar distribuição por papel apenas para SUPER_ADMIN e ADMIN
      if (papel === PapelUsuario.SUPER_ADMIN || papel === PapelUsuario.ADMIN) {
        cards.push(
          <DashboardCard
            key="admins"
            title="Administradores"
            value={stats.usuarios_por_papel[PapelUsuario.SUPER_ADMIN] + stats.usuarios_por_papel[PapelUsuario.ADMIN]}
            icon={<Shield className="w-6 h-6" />}
            color="red"
            description="Super Admins e Admins"
          />
        );
      }

      if (stats.usuarios_inativos > 0) {
        cards.push(
          <DashboardCard
            key="inactive-users"
            title="Usuários Inativos"
            value={stats.usuarios_inativos}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="yellow"
            description="Usuários desativados"
          />
        );
      }
    }

    // Cards específicos para SUPER_ADMIN
    if (papel === PapelUsuario.SUPER_ADMIN) {
      cards.push(
        <DashboardCard
          key="security-score"
          title="Score de Segurança"
          value="85%"
          icon={<Shield className="w-6 h-6" />}
          color="green"
          description="Baseado nas configurações de segurança"
          trend={{ value: 5, isPositive: true }}
        />
      );
    }

    // Cards para relatórios (se tem privilégio)
    if (verificarPrivilegio('relatorios_avancados')) {
      cards.push(
        <DashboardCard
          key="reports"
          title="Relatórios Gerados"
          value="12"
          icon={<BarChart3 className="w-6 h-6" />}
          color="purple"
          description="Este mês"
          trend={{ value: 20, isPositive: true }}
        />
      );
    }

    return cards;
  };

  const getQuickActions = () => {
    const actions = [];

    if (verificarPrivilegio('gerenciar_usuarios')) {
      actions.push({
        id: 'add-user',
        label: 'Adicionar Usuário',
        icon: <Users className="w-5 h-5" />,
        path: '/admin/users/new',
        color: 'blue'
      });
    }

    if (verificarPrivilegio('configuracoes_empresa')) {
      actions.push({
        id: 'company-settings',
        label: 'Configurações',
        icon: <Settings className="w-5 h-5" />,
        path: '/admin/company',
        color: 'gray'
      });
    }

    if (verificarPrivilegio('relatorios_avancados')) {
      actions.push({
        id: 'generate-report',
        label: 'Gerar Relatório',
        icon: <BarChart3 className="w-5 h-5" />,
        path: '/admin/reports/new',
        color: 'purple'
      });
    }

    return actions;
  };

  const getRecentActivities = () => {
    // Simulação de atividades recentes - em produção viria da API
    return [
      {
        id: 1,
        action: 'Usuário criado',
        user: 'João Silva',
        timestamp: '2 horas atrás',
        type: 'user_created'
      },
      {
        id: 2,
        action: 'Configuração alterada',
        user: 'Maria Santos',
        timestamp: '4 horas atrás',
        type: 'config_changed'
      },
      {
        id: 3,
        action: 'Login realizado',
        user: 'Pedro Costa',
        timestamp: '6 horas atrás',
        type: 'login'
      }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Administrativo
          </h1>
          <p className="text-gray-600">
            Visão geral das atividades e estatísticas da empresa
          </p>
        </div>
        
        {isPrimeiroUsuario && (
          <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Administrador Principal
            </span>
          </div>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getAvailableCards()}
      </div>

      {/* Ações Rápidas e Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ações Rápidas */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              {getQuickActions().map((action) => (
                <Link
                  key={action.id}
                  to={action.path}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className={`
                    p-2 rounded-lg
                    ${action.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                    ${action.color === 'gray' ? 'bg-gray-100 text-gray-600' : ''}
                    ${action.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                  `}>
                    {action.icon}
                  </div>
                  <span className="font-medium text-gray-900">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Atividades Recentes
              </h3>
              <Link
                to="/admin/audit"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver todas
              </Link>
            </div>
            
            <div className="space-y-3">
              {getRecentActivities().map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    <div className={`
                      w-2 h-2 rounded-full
                      ${activity.type === 'user_created' ? 'bg-green-500' : ''}
                      ${activity.type === 'config_changed' ? 'bg-yellow-500' : ''}
                      ${activity.type === 'login' ? 'bg-blue-500' : ''}
                    `} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      por {activity.user}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alertas e Notificações (apenas para SUPER_ADMIN) */}
      {papel === PapelUsuario.SUPER_ADMIN && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas do Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Backup Pendente
                </p>
                <p className="text-sm text-yellow-700">
                  O último backup foi realizado há 3 dias. Considere executar um novo backup.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Atualização Disponível
                </p>
                <p className="text-sm text-blue-700">
                  Uma nova versão do sistema está disponível com melhorias de segurança.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}