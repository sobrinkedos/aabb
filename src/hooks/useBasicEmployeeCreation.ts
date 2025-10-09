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
    console.log('📥 DADOS RECEBIDOS no hook:');
    console.log('  - nome_completo:', employeeData.nome_completo);
    console.log('  - email:', employeeData.email);
    console.log('  - telefone:', employeeData.telefone);
    console.log('  - cpf:', employeeData.cpf);
    console.log('  - bar_role:', employeeData.bar_role);
    console.log('  - cargo:', employeeData.cargo);
    
    try {
      setLoading(true);
      setError(null);

      // Verificar autenticação
      console.log('🔐 Verificando autenticação...');
      const authResult = await ensureAuthenticated();
      if (!authResult.success) {
        console.error('❌ Falha na autenticação:', authResult.error);
        throw new Error(`Falha na autenticação: ${authResult.error}`);
      }
      console.log('✅ Autenticação OK');

      // Obter empresa_id de forma mais segura
      console.log('🔍 Tentando obter empresa_id...');
      let empresaId: string;
      
      try {
        const empresaIdResult = await getCurrentUserEmpresaId();
        if (!empresaIdResult) {
          throw new Error('Usuário não está associado a nenhuma empresa');
        }
        empresaId = empresaIdResult;
        console.log('🏢 Empresa ID obtido:', empresaId);
      } catch (empresaError) {
        console.error('❌ Erro ao obter empresa_id:', empresaError);
        throw new Error('Não foi possível obter o ID da empresa do usuário logado');
      }
      
      if (!empresaId) {
        throw new Error('Não foi possível obter o ID da empresa');
      }

      // 1. Buscar department e position padrão
      console.log('🔍 Buscando department e position...');
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
      console.log('📋 Department/Position encontrados:', { departmentId, positionId });

      // 2. Criar registro na tabela employees (apenas campos essenciais)
      const employeeInsertData: any = {
        employee_code: `EMP-${Date.now()}`,
        name: employeeData.nome_completo,
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        empresa_id: empresaId
      };

      // Adicionar campos opcionais apenas se existirem
      if (employeeData.email) employeeInsertData.email = employeeData.email;
      if (employeeData.telefone) employeeInsertData.phone = employeeData.telefone;
      if (employeeData.cpf) employeeInsertData.cpf = employeeData.cpf; // ✅ CORREÇÃO: Adicionar CPF
      if (departmentId) employeeInsertData.department_id = departmentId;
      if (positionId) employeeInsertData.position_id = positionId;

      console.log('💾 Inserindo employee com dados:');
      console.log('  - employee_code:', employeeInsertData.employee_code);
      console.log('  - name:', employeeInsertData.name);
      console.log('  - email:', employeeInsertData.email);
      console.log('  - phone:', employeeInsertData.phone);
      console.log('  - cpf:', employeeInsertData.cpf);
      console.log('  - empresa_id:', employeeInsertData.empresa_id);
      
      // CORREÇÃO: Criar de verdade na tabela employees
      console.log('📝 Criando registro REAL na tabela employees...');
      const { data: employeeRecord, error: employeeError } = await supabase
        .from('employees')
        .insert(employeeInsertData)
        .select('id')
        .single();

      if (employeeError) {
        console.error('❌ Erro ao criar employee:', employeeError);
        throw new Error(`Erro ao criar funcionário: ${employeeError.message}`);
      }

      if (!employeeRecord) {
        throw new Error('Funcionário criado mas ID não retornado');
      }

      console.log('✅ Employee criado com sucesso:', employeeRecord.id);

      // 3. Criar registro na tabela bar_employees
      console.log('📝 Criando registro REAL na tabela bar_employees...');
      const barEmployeeData = {
        employee_id: employeeRecord.id,
        bar_role: employeeData.bar_role,
        shift_preference: 'qualquer',
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        notes: employeeData.observacoes || '',
        empresa_id: empresaId
      };

      const { error: barEmployeeError } = await supabase
        .from('bar_employees')
        .insert(barEmployeeData);

      if (barEmployeeError) {
        console.error('❌ Erro ao criar bar_employee:', barEmployeeError);
        // Tentar deletar o employee criado
        await supabase.from('employees').delete().eq('id', employeeRecord.id);
        throw new Error(`Erro ao criar registro do bar: ${barEmployeeError.message}`);
      }

      console.log('✅ Bar_employee criado com sucesso');

      console.log('✅ Funcionário básico criado com sucesso:', {
        employeeId: employeeRecord.id,
        nome: employeeData.nome_completo,
        role: employeeData.bar_role,
        empresaId
      });

      // Verificar se foi criado
      console.log('🔍 Verificando criação no banco...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('employees')
        .select('id, name, email')
        .eq('id', employeeRecord.id)
        .single();

      if (verifyError || !verifyData) {
        console.warn('⚠️ Aviso: Não foi possível verificar a criação');
      } else {
        console.log('✅ Verificação OK:', verifyData);
      }

      return {
        success: true,
        employeeId: employeeRecord.id,
        message: 'Funcionário criado com sucesso!'
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar funcionário';
      setError(errorMessage);
      console.error('❌ ERRO COMPLETO ao criar funcionário básico:', {
        error: err,
        message: errorMessage,
        stack: err instanceof Error ? err.stack : 'No stack'
      });
      
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

      // Buscar dados do funcionário
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select('name, email')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employeeData) {
        throw new Error('Funcionário não encontrado');
      }

      // 1. Verificar se o usuário já existe no Auth
      console.log('🔍 Verificando se usuário já existe:', email);
      
      // Tentar buscar usuário existente (isso não funciona diretamente, então vamos tentar criar e tratar o erro)
      
      // 2. Gerar senha temporária
      const senhaTemporaria = '123456'; // Senha padrão

      // 3. Tentar criar usuário no Auth
      let authData: any;
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: senhaTemporaria,
        options: {
          emailRedirectTo: undefined // Não enviar email de confirmação
        }
      });

      if (authError) {
        // Se usuário já existe, tentar fazer login para obter o ID
        if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
          console.log('⚠️ Usuário já existe, tentando fazer login para obter ID...');
          
          // Tentar login para obter o user ID
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: senhaTemporaria
          });
          
          if (loginError) {
            throw new Error(`Usuário já existe mas não foi possível fazer login. Pode ser necessário resetar a senha: ${loginError.message}`);
          }
          
          if (!loginData.user?.id) {
            throw new Error('Não foi possível obter ID do usuário existente');
          }
          
          // Usar o ID do usuário existente
          const userId = loginData.user.id;
          console.log('✅ Usando usuário existente:', userId);
          
          // Continuar com o fluxo usando o userId existente
          authData = { user: loginData.user };
        } else {
          throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`);
        }
      } else {
        // Usuário criado com sucesso
        authData = signUpData;
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

      // 4. Verificar se já existe registro na tabela usuarios_empresa
      console.log('🔍 Verificando se usuario_empresa já existe...');
      const { data: existingUsuarioEmpresa, error: checkError } = await supabase
        .from("usuarios_empresa")
        .select('id, status')
        .eq('user_id', userId)
        .eq('empresa_id', empresaId)
        .maybeSingle();

      let usuarioEmpresaData;

      if (existingUsuarioEmpresa) {
        console.log('✅ Usuario empresa já existe, usando existente:', existingUsuarioEmpresa.id);
        
        // Se existe mas está inativo, reativar
        if (existingUsuarioEmpresa.status !== 'ativo') {
          const { data: updatedData, error: updateError } = await supabase
            .from("usuarios_empresa")
            .update({
              status: 'ativo',
              ativo: true,
              tem_acesso_sistema: true,
              nome_completo: employeeData.name,
              email: employeeData.email
            })
            .eq('id', existingUsuarioEmpresa.id)
            .select('id')
            .single();

          if (updateError) {
            throw new Error(`Erro ao reativar usuario_empresa: ${updateError.message}`);
          }
          usuarioEmpresaData = updatedData;
        } else {
          usuarioEmpresaData = existingUsuarioEmpresa;
        }
      } else {
        // Criar novo registro
        console.log('📝 Criando novo usuario_empresa...');
        const { data: newData, error: usuarioEmpresaError } = await supabase
          .from("usuarios_empresa")
          .insert({
            user_id: userId,
            empresa_id: empresaId,
            nome_completo: employeeData.name,
            email: employeeData.email,
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
        usuarioEmpresaData = newData;
      }

      // 5. Verificar e criar permissões
      console.log('🔍 Verificando permissões existentes...');
      const { data: existingPermissions } = await supabase
        .from("permissoes_usuario")
        .select('modulo')
        .eq('usuario_empresa_id', usuarioEmpresaData.id);

      const existingModules = existingPermissions?.map(p => p.modulo) || [];
      
      const permissionsToInsert = Object.entries(credentialsData.permissoes_modulos)
        .filter(([modulo]) => !existingModules.includes(modulo)) // Só inserir se não existir
        .map(([modulo, permissoes]) => ({
          usuario_empresa_id: usuarioEmpresaData.id,
          modulo: modulo,
          permissoes: permissoes
        }));

      if (permissionsToInsert.length > 0) {
        console.log(`📝 Criando ${permissionsToInsert.length} novas permissões...`);
        const { error: permissionsError } = await supabase
          .from("permissoes_usuario")
          .insert(permissionsToInsert);

        if (permissionsError) {
          throw new Error(`Erro ao criar permissões: ${permissionsError.message}`);
        }
      } else {
        console.log('✅ Todas as permissões já existem');
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