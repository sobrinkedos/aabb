import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wine, 
  ChefHat, 
  Package, 
  Users, 
  UserCheck,
  Settings,
  LogOut,
  Zap,
  Coffee,
  DollarSign,
  Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { motion } from 'framer-motion';
import { loadUserPermissions, hasModuleAccess, UserPermissions } from '../../middleware/authMiddleware';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar permissões do usuário
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const userPermissions = await loadUserPermissions();
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPermissions();
    }
  }, [user]);

  const allMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', module: 'dashboard' as const },
    { name: 'Monitor Bar', icon: Wine, path: '/bar', module: 'monitor_bar' as const },
    { name: 'Atendimento Bar', icon: Coffee, path: '/bar/attendance', module: 'atendimento_bar' as const },
    { name: 'Monitor Cozinha', icon: ChefHat, path: '/kitchen', module: 'monitor_cozinha' as const },
    { name: 'Gestão de Caixa', icon: DollarSign, path: '/cash', module: 'gestao_caixa' as const },
    { name: 'Clientes', icon: Users, path: '/bar-customers', module: 'clientes' as const },
    { name: 'Funcionários', icon: UserCheck, path: '/bar-employees', module: 'funcionarios' as const },
    { name: 'Estoque', icon: Package, path: '/inventory', module: 'funcionarios' as const }, // Estoque é gerenciado por funcionários
    { name: 'Sócios', icon: Users, path: '/members', module: 'clientes' as const }, // Sócios são um tipo de cliente
    { name: 'Configurações', icon: Settings, path: '/settings', module: 'configuracoes' as const },
    { name: 'Ambiente', icon: Database, path: '/environment', module: 'configuracoes' as const },
  ];

  // Filtrar itens de menu baseado nas permissões
  const menuItems = allMenuItems.filter(item => {
    if (loading || !permissions) return false;
    return hasModuleAccess(permissions, item.module, 'visualizar');
  });

  const isDemoUser = user?.email === 'demo@clubmanager.com';

  return (
    <motion.aside 
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-900 text-white w-64 h-full p-4 flex flex-col overflow-y-auto scrollbar-hide"
      style={{ overscrollBehavior: 'contain' }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-400">ClubManager</h1>
        <p className="text-slate-400 text-sm">Sistema de Gestão</p>
        {isDemoUser && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-green-400">
            <Zap size={12} />
            <span>Modo Demo</span>
          </div>
        )}
      </div>

      {user && (
        <div className={`mb-6 p-3 rounded-lg ${isDemoUser ? 'bg-green-800 border border-green-600' : 'bg-slate-800'}`}>
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-slate-400 text-xs capitalize">{user.role}</p>
              {user.department && (
                <p className="text-slate-300 text-xs">{user.department}</p>
              )}
            </div>
          </div>
          {isDemoUser && (
            <div className="mt-2 text-xs text-green-300">
              🚀 Explorando funcionalidades
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <ul className="space-y-2">
            {menuItems.length > 0 ? (
              menuItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))
            ) : (
              <li className="p-3 text-slate-400 text-sm text-center">
                Sem permissões de acesso
              </li>
            )}
          </ul>
        )}
      </nav>

      {isDemoUser && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg border border-blue-700">
          <h4 className="text-sm font-semibold text-blue-200 mb-2">🎯 Teste Agora:</h4>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Criar pedidos no Bar</li>
            <li>• Sistema de Atendimento</li>
            <li>• Gerenciar cozinha</li>
            <li>• Ver métricas em tempo real</li>
            <li>• Controlar estoque</li>
          </ul>
        </div>
      )}

      <button
        onClick={logout}
        className="flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mt-4"
      >
        <LogOut size={20} />
        <span>{isDemoUser ? 'Sair do Demo' : 'Sair'}</span>
      </button>
    </motion.aside>
  );
};

export default Sidebar;
