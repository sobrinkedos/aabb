import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MultitenantAuthProvider } from './contexts/MultitenantAuthContext';
import { AppProvider } from './contexts/AppContext';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
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
import { ConfiguracoesEmpresa } from './pages/Auth/ConfiguracoesEmpresa';
import { TestTableDisplay } from './examples';
import './utils/debug-transactions';


// Componente que envolve as rotas protegidas, fornecendo o layout e o contexto.
const ProtectedRoutesWrapper: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MultitenantAuthProvider>
      <AppProvider>
        <Layout /> {/* O Layout contém o <Outlet/> para renderizar as rotas filhas */}
      </AppProvider>
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
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPageWrapper />} />
          <Route path="/register" element={<RegisterPageWrapper />} />
          
          {/* Rota pai para o layout protegido */}
          <Route element={<ProtectedRoutesWrapper />}>
            <Route index element={<Dashboard />} />
            <Route path="bar" element={<BarModule />} />
            <Route path="bar-customers" element={<BarCustomersModule />} />
            <Route path="bar-employees" element={<BarEmployeesModule />} />
            <Route path="cash/*" element={<CashManagement />} />
            <Route path="kitchen" element={<KitchenModule />} />
            <Route path="inventory" element={<InventoryModule />} />
            <Route path="inventory/estoque-baixo" element={<ListaEstoqueBaixo />} />
            <Route path="inventory/atualizacao-massiva" element={<AtualizacaoMassiva />} />
            <Route path="members" element={<MembersModule />} />
            <Route path="bar/attendance" element={<BarAttendance />} />

            <Route path="settings" element={<ConfiguracoesEmpresa />} />
            <Route path="test-modal" element={<TestNewModal />} />
            <Route path="test-table-display" element={<TestTableDisplay />} />
          </Route>
          
          {/* Redireciona qualquer rota não encontrada para a página inicial */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
