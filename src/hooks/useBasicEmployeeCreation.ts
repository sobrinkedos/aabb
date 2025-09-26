import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ensureAuthenticated, getCurrentUserEmpresaId } from '../utils/auth-helper';

interface BasicEmployeeData {
  nome_completo: string;
  email: string;
  telefone?: string;
  cpf?: string;
  bar_role: string;
  cargo: string;
  observacoes?: string;
}

interface CredentialsData {
  tem_acesso_sistema: boolean;
  permissoes_modulos: {
    [key: string]: {
      visualizar: boolean;
      criar: boolean;
      editar: boolean;
      excluir: boolean;
      administrar: boolean;
    };
  };
}

export const useBasicEmployeeCreation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cria um funcionário básico sem credenciais
   */
  const createBasicEmployee = useCallback(async (employeeData: BasicEmployeeData) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar autenticação
      const authResult = await ensureAuthenticated();
      if (!authResult.success) {
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }

      // Obter empresa_id
      const empresaId = await getCurrentUserEmpresaId();
      if (!empresaId) {
        throw new Error('Não foi possível obter o ID da empresa');
      }

      // 1. Buscar department e position padrão
      const { data: departments } = await supabase
        .from("departments")
        .select("id")
        .eq('is_active', true)
        .limit(1);

      const { data: positions } = await supabase
        .from("positions")
        .select("id")
        .eq('is_active', true)
        .limit(1);

      const departmentId = departments?.[0]?.id;
      const positionId = positions?.[0]?.id;

      // 2. Criar registro na tabela employees
      const { data: employeeRecord, error: employeeError } = await supabase
        .from("employees")
        .insert({
          employee_code: `EMP-${Date.now()}`,
          name: employeeData.nome_completo,
          email: employeeData.email,
          phone: employeeData.telefone,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          empresa_id: empresaId,
          department_id: departmentId,
          position_id: positionId
        })
        .select('id')
        .single();

      if (employeeError) {
        throw new Error(`Erro ao criar funcionário: ${employeeError.message}`);
      }

      // 3. Criar registro na tabela bar_employees
      const { error: barEmployeeError } = await supabase
        .from("bar_employees")
        .insert({
          employee_id: employeeRecord.id,
          bar_role: employeeData.bar_role,
          is_active: true,
          shift_preference: 'qualquer',
          commission_rate: 0,
          specialties: [],
          observacoes: employeeData.observacoes || ''
        });

      if (barEmployeeError) {
        throw new Error(`Erro ao criar bar_employee: ${barEmployeeError.message}`);
      }

      console.log('✅ Funcionário básico criado com sucesso:', {
        employeeId: employeeRecord.id,
        nome: employeeData.nome_completo,
        role: employeeData.bar_role
      });

      return {
        success: true,
        employeeId: employeeRecord.id,
        message: 'Funcionário criado com sucesso! Agora você pode criar as credenciais de acesso.'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar funcionário';
      setError(errorMessage);
      console.error('❌ Erro ao criar funcionário básico:', err);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adiciona credenciais a um funcionário existente
   */
  const addCredentialsToEmployee = useCallback(async (
    employeeId: string,
    email: string,
    credentialsData: CredentialsData
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!credentialsData.tem_acesso_sistema) {
        return {
          success: true,
          message: 'Funcionário configurado sem acesso ao sistema'
        };
      }

      // Obter empresa_id
      const empresaId = await getCurrentUserEmpresaId();
      if (!empresaId) {
        throw new Error('Não foi possível obter o ID da empresa');
      }

      // 1. Gerar senha temporária
      const senhaTemporaria = '123456'; // Senha padrão

      // 2. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: senhaTemporaria,
        options: {
          emailRedirectTo: undefined // Não enviar email de confirmação
        }
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('Falha ao obter ID do usuário criado');
      }

      // 3. Atualizar employee com profile_id
      const { error: updateError } = await supabase
        .from("employees")
        .update({ profile_id: userId })
        .eq('id', employeeId);

      if (updateError) {
        console.warn('Aviso ao atualizar profile_id:', updateError.message);
      }

      // 4. Criar registro na tabela usuarios_empresa
      const { data: usuarioEmpresaData, error: usuarioEmpresaError } = await supabase
        .from("usuarios_empresa")
        .insert({
          user_id: userId,
          empresa_id: empresaId,
          tipo_usuario: 'funcionario',
          cargo: 'Funcionário',
          status: 'ativo',
          ativo: true,
          tem_acesso_sistema: true
        })
        .select('id')
        .single();

      if (usuarioEmpresaError) {
        throw new Error(`Erro ao criar usuario_empresa: ${usuarioEmpresaError.message}`);
      }

      // 5. Criar permissões
      const permissionsToInsert = Object.entries(credentialsData.permissoes_modulos).map(
        ([modulo, permissoes]) => ({
          usuario_empresa_id: usuarioEmpresaData.id,
          modulo: modulo,
          permissoes: permissoes
        })
      );

      if (permissionsToInsert.length > 0) {
        const { error: permissionsError } = await supabase
          .from("permissoes_usuario")
          .insert(permissionsToInsert);

        if (permissionsError) {
          throw new Error(`Erro ao criar permissões: ${permissionsError.message}`);
        }
      }

      console.log('✅ Credenciais criadas com sucesso:', {
        userId,
        email,
        permissionsCount: permissionsToInsert.length
      });

      return {
        success: true,
        credentials: {
          email,
          senha_temporaria: senhaTemporaria,
          deve_alterar_senha: true
        },
        message: 'Credenciais criadas com sucesso!'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar credenciais';
      setError(errorMessage);
      console.error('❌ Erro ao criar credenciais:', err);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createBasicEmployee,
    addCredentialsToEmployee,
    loading,
    error,
    clearError: () => setError(null)
  };
};