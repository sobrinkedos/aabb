import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContextSimple';
import { MultitenantAuthProvider } from './contexts/MultitenantAuthContextSimple';
import { AppProvider } from './contexts/AppContext';
import { AppProvider as AppProviderOptimized } from './contexts/AppContextOptimized';
import { SenhaProvisionariaGuard } from './components/Auth/SenhaProvisionariaGuard';
import { PermissionProtectedRoute } from './components/Auth/PermissionProtectedRoute';
import { AlterarSenhaProvisoria } from './pages/Auth/AlterarSenhaProvisoria';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import DashboardOptimized from './pages/DashboardOptimized';
import DashboardAdvanced from './pages/DashboardAdvanced';
import DashboardComplete from './pages/DashboardComplete';
import ErrorBoundaryOptimized from './components/Error/ErrorBoundaryOptimized';
import { PERFORMANCE_CONFIG } from './config/performance';
import BarModule from './pages/Bar';
import BarCustomersModule from './pages/BarCustomers';
import BarEmployeesModule from './pages/BarEmployees';
import KitchenModule from './pages/Kitchen';
import InventoryModule from './pages/Inventory';
import ListaEstoqueBaixo from './pages/Inventory/ListaEstoqueBaixo';
import AtualizacaoMassiva from './pages/Inventory/AtualizacaoMassiva';
import MembersModule from './pages/Members';
import BarAttendance from './pages/BarAttendance';
import CashManagement from './pages/CashManagement';
import TestNewModal from './components/debug/TestNewModal';
import { ConfiguracoesEmpresaSimples } from './pages/Auth/ConfiguracoesEmpresaSimples';
import FuncionariosPage from './pages/Admin/FuncionariosPage';
import { TestTableDisplay } from './examples';
import { TableManagementView } from './components/tables';
import TestBarTablesConnection from './components/debug/TestBarTablesConnection';
import InitializeBarTables from './components/debug/InitializeBarTables';
import { EnvironmentProvider } from './contexts/EnvironmentContext';
import EnvironmentSettings from './components/Environment/EnvironmentSettings';

import './utils/debug-transactions';


// Componente que envolve as rotas protegidas, fornecendo o layout e o contexto.
const ProtectedRoutesWrapper: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usar contexto original por enquanto
  const AppContextProvider = AppProvider;

  return (
    <MultitenantAuthProvider>
      <AppContextProvider>
        <SenhaProvisionariaGuard>
          <Layout /> {/* O Layout contém o <Outlet/> para renderizar as rotas filhas */}
        </SenhaProvisionariaGuard>
      </AppContextProvider>
    </MultitenantAuthProvider>
  );
};

// Componente que lida com a página de login, redirecionando se já estiver autenticado.
const LoginPageWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <LoginForm />;
};

// Componente que lida com a página de registro, redirecionando se já estiver autenticado.
const RegisterPageWrapper: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <RegisterForm />;
};

function App() {
  return (
    <ErrorBoundaryOptimized>
      <EnvironmentProvider>
        <Router>
          <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPageWrapper />} />
            <Route path="/register" element={<RegisterPageWrapper />} />
            <Route path="/alterar-senha-provisoria" element={<AlterarSenhaProvisoria />} />
          
            {/* Rota pai para o layout protegido */}
            <Route element={<ProtectedRoutesWrapper />}>
              {/* Dashboard com proteção específica */}
              <Route index element={
                <PermissionProtectedRoute module="dashboard">
                  <DashboardAdvanced />
                </PermissionProtectedRoute>
              } />
              
              {/* Dashboards alternativos */}
              <Route path="dashboard/complete" element={
                <PermissionProtectedRoute module="dashboard">
                  <DashboardComplete />
                </PermissionProtectedRoute>
              } />
              <Route path="dashboard/simple" element={
                <PermissionProtectedRoute module="dashboard">
                  <Dashboard />
                </PermissionProtectedRoute>
              } />
              <Route path="dashboard/optimized" element={
                <PermissionProtectedRoute module="dashboard">
                  <DashboardOptimized />
                </PermissionProtectedRoute>
              } />
              
              {/* Módulos do Bar */}
              <Route path="bar" element={
                <PermissionProtectedRoute module="monitor_bar">
                  <BarModule />
                </PermissionProtectedRoute>
              } />
              <Route path="bar/attendance" element={
                <PermissionProtectedRoute module="atendimento_bar">
                  <BarAttendance />
                </PermissionProtectedRoute>
              } />
              
              {/* Módulo Clientes */}
              <Route path="bar-customers" element={
                <PermissionProtectedRoute module="clientes">
                  <BarCustomersModule />
                </PermissionProtectedRoute>
              } />
              <Route path="members" element={
                <PermissionProtectedRoute module="clientes">
                  <MembersModule />
                </PermissionProtectedRoute>
              } />
              
              {/* Módulo Funcionários */}
              <Route path="bar-employees" element={
                <PermissionProtectedRoute module="funcionarios">
                  <BarEmployeesModule />
                </PermissionProtectedRoute>
              } />
              
              {/* Gestão de Funcionários (Admin) */}
              <Route path="admin/funcionarios" element={
                <PermissionProtectedRoute module="funcionarios">
                  <FuncionariosPage />
                </PermissionProtectedRoute>
              } />
              
              {/* Módulo Cozinha */}
              <Route path="kitchen" element={
                <PermissionProtectedRoute module="monitor_cozinha">
                  <KitchenModule />
                </PermissionProtectedRoute>
              } />
              
              {/* Módulo Caixa */}
              <Route path="cash/*" element={
                <PermissionProtectedRoute module="gestao_caixa">
                  <CashManagement />
                </PermissionProtectedRoute>
              } />
              
              {/* Módulos de Estoque (protegidos por funcionários) */}
              <Route path="inventory" element={
                <PermissionProtectedRoute module="funcionarios">
                  <InventoryModule />
                </PermissionProtectedRoute>
              } />
              <Route path="inventory/estoque-baixo" element={
                <PermissionProtectedRoute module="funcionarios">
                  <ListaEstoqueBaixo />
                </PermissionProtectedRoute>
              } />
              <Route path="inventory/atualizacao-massiva" element={
                <PermissionProtectedRoute module="funcionarios">
                  <AtualizacaoMassiva />
                </PermissionProtectedRoute>
              } />
              

              
              {/* Configurações */}
              <Route path="settings" element={
                <PermissionProtectedRoute module="configuracoes">
                  <ConfiguracoesEmpresaSimples />
                </PermissionProtectedRoute>
              } />
              
              {/* Configurações de Ambiente */}
              <Route path="environment" element={
                <PermissionProtectedRoute module="configuracoes">
                  <EnvironmentSettings />
                </PermissionProtectedRoute>
              } />
              
              {/* Rotas de desenvolvimento */}
              <Route path="test-modal" element={
                <PermissionProtectedRoute module="configuracoes">
                  <TestNewModal />
                </PermissionProtectedRoute>
              } />
              <Route path="test-table-display" element={
                <PermissionProtectedRoute module="configuracoes">
                  <TestTableDisplay />
                </PermissionProtectedRoute>
              } />
              <Route path="test-bar-tables" element={
                <PermissionProtectedRoute module="configuracoes">
                  <TestBarTablesConnection />
                </PermissionProtectedRoute>
              } />
              <Route path="init-bar-tables" element={
                <PermissionProtectedRoute module="configuracoes">
                  <InitializeBarTables />
                </PermissionProtectedRoute>
              } />
            </Route>
          
          {/* Redireciona qualquer rota não encontrada para a página inicial */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
      </EnvironmentProvider>
    </ErrorBoundaryOptimized>
  );
}

export default App;
