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
  Database,
  Tag,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { motion, AnimatePresence } from 'framer-motion';
import { loadUserPermissions, hasModuleAccess, UserPermissions } from '../../middleware/authMiddleware';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktopOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDesktopOpen }) => {
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

  // Conteúdo da sidebar completa
  const SidebarContent = () => (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-blue-400">ClubManager</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Sistema de Gestão</p>
        {isDemoUser && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-green-400">
            <Zap size={12} />
            <span>Modo Demo</span>
          </div>
        )}
      </div>

      {user && (
        <div className={`mb-4 sm:mb-6 p-2 sm:p-3 rounded-lg ${isDemoUser ? 'bg-green-800 border border-green-600' : 'bg-slate-800'}`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
              alt={user.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-xs sm:text-sm truncate">{user.name}</p>
              <p className="text-slate-400 text-xs capitalize truncate">{user.role}</p>
              {user.department && (
                <p className="text-slate-300 text-xs truncate">{user.department}</p>
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
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    <span className="text-sm sm:text-base truncate">{item.name}</span>
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
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-900 rounded-lg border border-blue-700">
          <h4 className="text-xs sm:text-sm font-semibold text-blue-200 mb-1 sm:mb-2">🎯 Teste Agora:</h4>
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
        onClick={() => {
          logout();
          onClose();
        }}
        className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mt-3 sm:mt-4"
      >
        <LogOut size={18} className="flex-shrink-0" />
        <span className="text-sm sm:text-base">{isDemoUser ? 'Sair do Demo' : 'Sair'}</span>
      </button>
    </>
  );

  // Conteúdo da sidebar minimizada (apenas ícones)
  const SidebarMinimized = () => (
    <>
      {/* Avatar do usuário */}
      {user && (
        <div className="mb-6 flex justify-center">
          <img
            src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
            alt={user.name}
            className="w-10 h-10 rounded-full"
            title={user.name}
          />
        </div>
      )}

      {/* Menu de navegação - apenas ícones */}
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
                      `flex items-center justify-center p-3 rounded-lg transition-colors group relative ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                    title={item.name}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    
                    {/* Tooltip ao passar o mouse */}
                    <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.name}
                    </span>
                  </NavLink>
                </li>
              ))
            ) : null}
          </ul>
        )}
      </nav>

      {/* Botão de logout */}
      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="flex items-center justify-center p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mt-4 group relative"
        title={isDemoUser ? 'Sair do Demo' : 'Sair'}
      >
        <LogOut size={20} className="flex-shrink-0" />
        
        {/* Tooltip */}
        <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {isDemoUser ? 'Sair do Demo' : 'Sair'}
        </span>
      </button>
    </>
  );

  return (
    <>
      {/* Sidebar Desktop - expandida */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isDesktopOpen ? 256 : 72,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex bg-slate-900 text-white h-full p-4 flex-col overflow-y-auto scrollbar-hide"
        style={{ overscrollBehavior: 'contain' }}
      >
        {isDesktopOpen ? <SidebarContent /> : <SidebarMinimized />}
      </motion.aside>

      {/* Sidebar Mobile - com animação */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden fixed inset-y-0 left-0 bg-slate-900 text-white w-64 p-4 flex flex-col overflow-y-auto scrollbar-hide z-30"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* Botão de fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
            
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
