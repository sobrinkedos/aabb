import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmployeeManagementPanel } from '../../components/Admin/EmployeeManagementPanel';

const FuncionariosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Funcionários</h1>
            <p className="text-gray-600 mt-2">
              Sistema completo de cadastro e gerenciamento de funcionários com fluxo de duas etapas
            </p>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 Etapa 1: Funcionário Básico</h3>
            <p className="text-blue-800 text-sm">
              Cadastre os dados básicos do funcionário (nome, email, cargo, etc.) sem criar credenciais de acesso ainda.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🔐 Etapa 2: Credenciais de Acesso</h3>
            <p className="text-green-800 text-sm">
              Após criar o funcionário básico, atribua credenciais de acesso ao sistema quando necessário.
            </p>
          </div>
        </motion.div>

        {/* Main Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <EmployeeManagementPanel />
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Como usar o sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Fluxo Recomendado:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Cadastre o funcionário básico com dados pessoais</li>
                <li>Verifique se os dados estão corretos</li>
                <li>Clique em "Criar Credenciais" quando necessário</li>
                <li>Entregue as credenciais geradas ao funcionário</li>
                <li>O funcionário deve alterar a senha no primeiro acesso</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Vantagens do Sistema:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Controle total sobre quem tem acesso ao sistema</li>
                <li>Possibilidade de cadastrar funcionários sem dar acesso imediato</li>
                <li>Credenciais seguras geradas automaticamente</li>
                <li>Fácil remoção de acesso quando necessário</li>
                <li>Histórico completo de criação de credenciais</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FuncionariosPage;