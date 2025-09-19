import React from 'react';
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
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Monitor Bar', icon: Wine, path: '/bar' },
    { name: 'Atendimento Bar', icon: Coffee, path: '/bar/attendance' },
    { name: 'Monitor Cozinha', icon: ChefHat, path: '/kitchen' },
    { name: 'Gestão de Caixa', icon: DollarSign, path: '/cash' },
    { name: 'Clientes', icon: Users, path: '/bar-customers' },
    { name: 'Funcionários', icon: UserCheck, path: '/bar-employees' },
    { name: 'Estoque', icon: Package, path: '/inventory' },
    { name: 'Sócios', icon: Users, path: '/members' },
    { name: 'Configurações', icon: Settings, path: '/settings' },
  ];

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
        <ul className="space-y-2">
          {menuItems.map((item) => (
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
          ))}
        </ul>
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
