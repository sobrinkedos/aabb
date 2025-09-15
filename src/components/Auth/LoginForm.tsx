import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Zap, Users } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loginAsDemo, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    const success = await login(email, password);
    if (!success) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ClubManager Pro</h1>
          <p className="text-gray-600">Sistema de Gestão de Clubes</p>
        </div>

        {/* Demo Access Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDemoLogin}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2 mb-6 shadow-lg"
        >
          <Zap className="w-5 h-5" />
          <span>🚀 Entrar como Demo</span>
        </motion.button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">ou faça login tradicional</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Digite seu email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Entrando...</span>
              </div>
            ) : (
              'Entrar'
            )}
          </motion.button>
        </form>

        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-gray-800 mb-2 text-center">🎯 Acesso Demo Rápido</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>✅ <strong>Módulo Bar:</strong> Pedidos, comandas e vendas</p>
            <p>✅ <strong>Módulo Cozinha:</strong> Gestão de cardápio e pedidos</p>
            <p>✅ <strong>Dashboard:</strong> Métricas e relatórios</p>
            <p>✅ <strong>Estoque:</strong> Controle de inventário</p>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-gray-500 text-center">
              💡 <strong>Dica:</strong> Use o botão verde acima para acesso instantâneo!
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Cadastre-se aqui
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            ClubManager Pro v1.0 - Sistema Demonstração
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
