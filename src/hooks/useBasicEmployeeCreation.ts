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

      // 1. Buscar department e position padrão (sempre existem no banco)
      console.log('🔍 Buscando department e position...');
      
      // Buscar department ativo
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select("id")
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (deptError || !departments) {
        throw new Error('Nenhum departamento ativo encontrado. Configure um departamento antes de criar funcionários.');
      }
      
      const departmentId = departments.id;
      console.log('✅ Department encontrado:', departmentId);

      // Buscar position ativa
      const { data: positions, error: posError } = await supabase
        .from("positions")
        .select("id")
        .eq('is_active', true)
        .limit(1)
        .single();

      if (posError || !positions) {
        throw new Error('Nenhum cargo ativo encontrado. Configure um cargo antes de criar funcionários.');
      }
      
      const positionId = positions.id;
      console.log('✅ Position encontrado:', positionId);
      console.log('📋 Department/Position:', { departmentId, positionId });

      // 2. Criar registro na tabela employees
      const employeeInsertData: any = {
        employee_code: `EMP-${Date.now()}`,
        name: employeeData.nome_completo,
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        empresa_id: empresaId,
        position_id: positionId,
        department_id: departmentId
      };

      // Adicionar campos opcionais apenas se existirem
      if (employeeData.email) employeeInsertData.email = employeeData.email;
      if (employeeData.telefone) employeeInsertData.phone = employeeData.telefone;
      if (employeeData.cpf) employeeInsertData.cpf = employeeData.cpf;

      console.log('💾 Criando employee:', {
        code: employeeInsertData.employee_code,
        name: employeeInsertData.name,
        email: employeeInsertData.email,
        position_id: positionId,
        department_id: departmentId
      });
      
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

      console.log('✅ Employee criado:', employeeRecord.id);

      // 3. Criar registro na tabela bar_employees
      console.log('� Criaando bar_employee...');
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

      console.log('✅ Funcionário criado:', {
        id: employeeRecord.id,
        nome: employeeData.nome_completo,
        role: employeeData.bar_role
      });

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

      // 1. Salvar sessão atual antes de qualquer operação
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // 2. Verificar se o usuário já existe no Auth
      console.log('🔍 Verificando se usuário já existe:', email);
      
      // 3. Gerar senha temporária
      const senhaTemporaria = '123456'; // Senha padrão

      // 4. Tentar criar usuário no Auth
      let userId: string;
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: senhaTemporaria,
        options: {
          emailRedirectTo: undefined // Não enviar email de confirmação
        }
      });

      if (authError) {
        // Se usuário já existe, precisamos obter o ID de outra forma
        if (authError.message.includes('User already registered') || authError.message.includes('already registered')) {
          console.log('⚠️ Usuário já existe no Auth');
          
          // Buscar o user_id na tabela usuarios_empresa pelo email
          const { data: existingUser } = await supabase
            .from('usuarios_empresa')
            .select('user_id')
            .eq('email', email)
            .eq('empresa_id', empresaId)
            .single();
          
          if (existingUser?.user_id) {
            userId = existingUser.user_id;
            console.log('✅ User ID encontrado em usuarios_empresa:', userId);
          } else {
            throw new Error(`Usuário ${email} já existe no Auth mas não está vinculado a esta empresa. Entre em contato com o suporte.`);
          }
        } else {
          throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`);
        }
      } else {
        // Usuário criado com sucesso
        if (!signUpData.user?.id) {
          throw new Error('Falha ao obter ID do usuário criado');
        }
        userId = signUpData.user.id;
        console.log('✅ Novo usuário criado no Auth:', userId);
      }
      
      // 5. IMPORTANTE: Restaurar sessão original imediatamente
      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token
        });
        console.log('✅ Sessão original restaurada');
      }

      // 3. CRÍTICO: Atualizar employee com profile_id
      console.log('📝 Atualizando profile_id no employee...');
      const { data: updatedEmployee, error: updateError } = await supabase
        .from("employees")
        .update({ profile_id: userId, tem_acesso_sistema: true })
        .eq('id', employeeId)
        .select('id, profile_id');

      if (updateError) {
        console.error('❌ ERRO ao atualizar profile_id:', updateError);
        throw new Error(`Falha ao vincular usuário ao funcionário: ${updateError.message}`);
      }

      if (!updatedEmployee || updatedEmployee.length === 0) {
        console.error('❌ Nenhuma linha atualizada. Verificando se o employee existe...');
        
        // Verificar se o employee existe
        const { data: checkEmployee } = await supabase
          .from("employees")
          .select('id, empresa_id')
          .eq('id', employeeId)
          .single();
        
        if (!checkEmployee) {
          throw new Error('Funcionário não encontrado');
        }
        
        // Verificar empresa_id
        if (checkEmployee.empresa_id !== empresaId) {
          throw new Error('Funcionário pertence a outra empresa');
        }
        
        throw new Error('Falha ao atualizar profile_id - verifique as permissões RLS');
      }

      console.log('✅ Profile_id atualizado:', updatedEmployee[0].profile_id);

      // 4. Verificar se já existe registro na tabela usuarios_empresa
      console.log('🔍 Verificando se usuario_empresa já existe...');
      const { data: existingUsuarioEmpresa } = await supabase
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
        const usuarioEmpresaInsert = {
          user_id: userId,
          empresa_id: empresaId,
          nome_completo: employeeData.name,
          email: employeeData.email,
          tipo_usuario: 'funcionario',
          cargo: 'Funcionário',
          status: 'ativo',
          ativo: true,
          tem_acesso_sistema: true
        };

        console.log('📋 Dados do usuario_empresa:', usuarioEmpresaInsert);

        const { data: newData, error: usuarioEmpresaError } = await supabase
          .from("usuarios_empresa")
          .insert(usuarioEmpresaInsert)
          .select('id, user_id, tem_acesso_sistema')
          .single();

        if (usuarioEmpresaError) {
          console.error('❌ ERRO ao criar usuario_empresa:', usuarioEmpresaError);
          throw new Error(`Erro ao criar usuario_empresa: ${usuarioEmpresaError.message}`);
        }

        if (!newData || !newData.id) {
          throw new Error('Usuario_empresa criado mas ID não retornado');
        }

        console.log('✅ Usuario_empresa criado com sucesso:', newData);
        usuarioEmpresaData = newData;
      }

      // Verificar se o vínculo foi criado corretamente
      console.log('🔍 Verificando vínculo completo...');
      const { data: verifyLink, error: verifyError } = await supabase
        .from('usuarios_empresa')
        .select('id, user_id, tem_acesso_sistema')
        .eq('id', usuarioEmpresaData.id)
        .single();

      if (verifyError || !verifyLink) {
        console.error('❌ Falha na verificação do vínculo:', verifyError);
        throw new Error('Vínculo criado mas não pode ser verificado');
      }

      console.log('✅ Vínculo verificado:', verifyLink);

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

      // Verificação final completa
      console.log('🎯 VERIFICAÇÃO FINAL COMPLETA:');
      console.log('  ✅ Employee ID:', employeeId);
      console.log('  ✅ Profile ID:', userId);
      console.log('  ✅ Usuario Empresa ID:', usuarioEmpresaData.id);
      console.log('  ✅ Tem Acesso Sistema:', true);
      console.log('  ✅ Permissões:', permissionsToInsert.length + existingModules.length);

      return {
        success: true,
        credentials: {
          email,
          senha_temporaria: senhaTemporaria,
          deve_alterar_senha: true
        },
        message: 'Credenciais criadas com sucesso!',
        details: {
          employeeId,
          userId,
          usuarioEmpresaId: usuarioEmpresaData.id
        }
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