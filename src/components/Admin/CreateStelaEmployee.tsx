import React, { useState } from 'react';
import { useEmployeeWithAuth, NewEmployeeWithAuthData } from '../../hooks/useEmployeeWithAuth';
import { Permission } from '../../types/employee.types';

const CreateStelaEmployee: React.FC = () => {
  const { loading, error, createEmployeeWithAuth } = useEmployeeWithAuth();
  const [result, setResult] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const createStela = async () => {
    // Definir permissões específicas para o módulo de caixa
    const caixaPermissions: Permission[] = [
      { id: 'access_cashier', module: 'cashier', action: 'access' },
      { id: 'manage_cashier', module: 'cashier', action: 'manage' },
      { id: 'view_customers', module: 'customers', action: 'view' },
      { id: 'create_customers', module: 'customers', action: 'create' },
      { id: 'view_reports', module: 'reports', action: 'view' }
    ];

    const employeeData: NewEmployeeWithAuthData = {
      // Dados básicos
      name: 'Stela Silva',
      email: 'stela@teste.com',
      cpf: '123.456.789-00',
      phone: '(11) 99999-9999',
      
      // Dados do bar
      bar_role: 'atendente', // Atendente tem acesso ao caixa
      shift_preference: 'manha',
      specialties: ['atendimento', 'caixa', 'vendas'],
      commission_rate: 2.5,
      notes: 'Funcionária responsável pelo caixa matutino',
      
      // Configurações de acesso
      should_create_user: true, // Criar credenciais de acesso
      permissions: caixaPermissions, // Permissões específicas para caixa
      role: 'cashier', // Papel no sistema
      temporary_password: true // Senha temporária que deve ser alterada
    };

    console.log('🚀 Criando funcionária Stela com acesso ao caixa...');
    const creationResult = await createEmployeeWithAuth(employeeData);
    setResult(creationResult);
    
    if (creationResult.success) {
      setShowCredentials(true);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>
        👩‍💼 Criar Funcionária Stela com Acesso ao Caixa
      </h2>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '5px', 
        marginBottom: '20px',
        border: '1px solid #2196f3'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
          📋 Dados que serão criados:
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Nome:</strong> Stela Silva</li>
          <li><strong>Email:</strong> stela@teste.com</li>
          <li><strong>Função:</strong> Atendente (Caixa)</li>
          <li><strong>Turno:</strong> Manhã</li>
          <li><strong>Especialidades:</strong> Atendimento, Caixa, Vendas</li>
          <li><strong>Acesso ao Sistema:</strong> Sim (módulo de caixa)</li>
          <li><strong>Senha:</strong> Temporária (deve ser alterada no primeiro login)</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#fff3e0', 
        padding: '15px', 
        borderRadius: '5px', 
        marginBottom: '20px',
        border: '1px solid #ff9800'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>
          🔐 Permissões que serão concedidas:
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>✅ <strong>Gestão de Caixa:</strong> Acesso completo</li>
          <li>✅ <strong>Clientes:</strong> Visualizar e criar</li>
          <li>✅ <strong>Relatórios:</strong> Visualizar</li>
          <li>✅ <strong>Dashboard:</strong> Visualizar</li>
        </ul>
      </div>

      <button
        onClick={createStela}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#4caf50',
          color: 'white',
          padding: '15px 30px',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '20px'
        }}
      >
        {loading ? '⏳ Criando funcionária...' : '🚀 Criar Funcionária Stela'}
      </button>

      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #f44336',
          marginBottom: '20px'
        }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}

      {result && result.success && (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          color: '#2e7d32', 
          padding: '20px', 
          borderRadius: '5px',
          border: '1px solid #4caf50'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>
            🎉 Funcionária criada com sucesso!
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>ID do Funcionário:</strong> {result.employeeId}
            {result.userId && (
              <>
                <br />
                <strong>ID do Usuário:</strong> {result.userId}
              </>
            )}
          </div>

          {showCredentials && result.credentials && (
            <div style={{ 
              backgroundColor: '#fff', 
              padding: '15px', 
              borderRadius: '5px',
              border: '2px solid #ff9800',
              marginTop: '15px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>
                🔑 Credenciais de Acesso:
              </h4>
              <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                <div><strong>Email:</strong> {result.credentials.email}</div>
                <div><strong>Usuário:</strong> {result.credentials.username}</div>
                <div><strong>Senha:</strong> {result.credentials.password}</div>
                <div><strong>Temporária:</strong> {result.credentials.temporary ? 'Sim' : 'Não'}</div>
              </div>
              
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#fff3e0',
                borderRadius: '3px'
              }}>
                <strong>⚠️ IMPORTANTE:</strong>
                <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                  <li>Anote essas credenciais em local seguro</li>
                  <li>A funcionária deve alterar a senha no primeiro login</li>
                  <li>O acesso será liberado para o módulo de caixa</li>
                </ul>
              </div>
            </div>
          )}

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f0f8ff',
            borderRadius: '5px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
              📝 Próximos passos:
            </h4>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Informe as credenciais para a funcionária Stela</li>
              <li>Ela deve fazer login em: <strong>stela@teste.com</strong></li>
              <li>No primeiro login, será solicitada a alteração da senha</li>
              <li>Após login, ela terá acesso ao módulo de caixa</li>
              <li>Verifique se as permissões estão funcionando corretamente</li>
            </ol>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #f44336'
        }}>
          <strong>❌ Falha na criação:</strong> {result.error}
        </div>
      )}
    </div>
  );
};

export default CreateStelaEmployee;