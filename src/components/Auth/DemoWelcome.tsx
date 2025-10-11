import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextSimple';
import { isDemoUser } from '../../utils/auth';
import { 
  Zap, 
  X, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  CreditCard,
  ChefHat,
  Package,
  Settings,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DemoWelcome: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!isDemoUser(user) || !isVisible) {
    return null;
  }

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Dashboard Completo',
      description: 'Métricas em tempo real, gráficos e relatórios detalhados',
      path: '/dashboard',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: 'Gestão do Bar',
      description: 'Comandas, pedidos e atendimento de mesas',
      path: '/bar',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <ChefHat className="w-6 h-6" />,
      title: 'Módulo Cozinha',
      description: 'Controle de pedidos, cardápio e tempo de preparo',
      path: '/kitchen',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Controle de Estoque',
      description: 'Inventário, fornecedores e alertas de estoque baixo',
      path: '/inventory',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Gestão de Caixa',
      description: 'Vendas, pagamentos e fechamento de caixa',
      path: '/cash',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Gestão de Clientes',
      description: 'Cadastro de sócios, dependentes e histórico',
      path: '/members',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const stats = [
    { label: 'Módulos Ativos', value: '6+', icon: <Settings className="w-5 h-5" /> },
    { label: 'Funcionalidades', value: '50+', icon: <Zap className="w-5 h-5" /> },
    { label: 'Relatórios', value: '15+', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 shadow-xl border border-blue-100 mb-8"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                🎉 Bem-vindo ao ClubManager Pro!
              </h2>
              <p className="text-gray-600">
                Você está no modo demonstração com acesso completo ao sistema
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
            >
              <div className="flex items-center justify-center mb-2 text-blue-600">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🚀 Explore os Módulos Disponíveis:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.a
                key={feature.path}
                href={feature.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/30 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h4>
                
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:text-blue-700">
                  <span>Explorar módulo</span>
                  <motion.div
                    className="ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    →
                  </motion.div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Modo Demonstração:</strong> Todos os dados são fictícios e as alterações são temporárias. 
                Explore livremente todas as funcionalidades do sistema!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoWelcome;