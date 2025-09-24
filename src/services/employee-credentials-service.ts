/**
 * Serviço para atribuir credenciais de acesso a funcionários existentes
 * 
 * Este serviço é responsável por:
 * 1. Criar usuário no Supabase Auth
 * 2. Gerar credenciais temporárias
 * 3. Vincular o funcionário ao usuário Auth
 * 4. Criar registros em usuarios_empresa
 */

import { supabase } from '../lib/supabase';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';

export interface CredentialsResult {
  success: boolean;
  credentials?: {
    email: string;
    temporaryPassword: string;
    authUserId: string;
  };
  error?: string;
}

export class EmployeeCredentialsService {
  /**
   * Gera uma senha temporária segura
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    
    // Garantir pelo menos uma maiúscula, uma minúscula, um número e um símbolo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@#$%'[Math.floor(Math.random() * 4)];
    
    // Completar com caracteres aleatórios até 12 caracteres
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Atribui credenciais de acesso a um funcionário existente
   * Esta é a Etapa 2 do novo fluxo
   */
  async assignCredentials(employeeId: string, empresaId: string): Promise<CredentialsResult> {
    try {
      // SEGURANÇA: Verificar se o usuário atual pertence à empresa
      const userEmpresaId = await getCurrentUserEmpresaId();
      if (!userEmpresaId || userEmpresaId !== empresaId) {
        return {
          success: false,
          error: 'Acesso negado: você não tem permissão para esta empresa'
        };
      }
      // Buscar o funcionário existente
      const { data: employee, error: fetchError } = await (supabase as any)
        .from('bar_employees')
        .select('*')
        .eq('id', employeeId)
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .single();

      if (fetchError || !employee) {
        console.error('Funcionário não encontrado:', fetchError);
        return {
          success: false,
          error: 'Funcionário não encontrado'
        };
      }

      // Verificar se já possui credenciais
      if (employee.tem_acesso_sistema && employee.auth_user_id) {
        return {
          success: false,
          error: 'Este funcionário já possui credenciais de acesso'
        };
      }

      // Gerar senha temporária
      const temporaryPassword = this.generateTemporaryPassword();

      // Criar usuário no Supabase Auth usando admin
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: employee.email,
        password: temporaryPassword,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          nome: employee.nome,
          cargo: employee.cargo,
          empresa_id: empresaId,
          employee_id: employeeId,
          tipo_usuario: 'funcionario'
        }
      });

      if (authError || !authUser.user) {
        console.error('Erro ao criar usuário Auth:', authError);
        return {
          success: false,
          error: 'Erro ao criar credenciais de acesso'
        };
      }

      // Atualizar funcionário com auth_user_id e tem_acesso_sistema
      const { error: updateEmployeeError } = await (supabase as any)
        .from('bar_employees')
        .update({
          auth_user_id: authUser.user.id,
          tem_acesso_sistema: true,
          data_credenciais_criadas: new Date().toISOString()
        })
        .eq('id', employeeId)
        .eq('empresa_id', empresaId);

      if (updateEmployeeError) {
        console.error('Erro ao atualizar funcionário:', updateEmployeeError);
        
        // Tentar remover usuário Auth criado em caso de erro
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } catch (cleanupError) {
          console.error('Erro ao limpar usuário Auth:', cleanupError);
        }

        return {
          success: false,
          error: 'Erro ao vincular credenciais ao funcionário'
        };
      }

      // Criar registro na tabela usuarios_empresa
      const { error: userEmpresaError } = await (supabase as any)
        .from('usuarios_empresa')
        .insert({
          user_id: authUser.user.id,
          empresa_id: empresaId,
          tipo_usuario: 'funcionario',
          ativo: true,
          data_vinculacao: new Date().toISOString()
        });

      if (userEmpresaError) {
        console.error('Erro ao criar vínculo usuário-empresa:', userEmpresaError);
        // Continuar mesmo com erro, pois o principal foi criado
      }

      return {
        success: true,
        credentials: {
          email: employee.email,
          temporaryPassword,
          authUserId: authUser.user.id
        }
      };

    } catch (error) {
      console.error('Erro inesperado ao atribuir credenciais:', error);
      return {
        success: false,
        error: 'Erro inesperado ao atribuir credenciais'
      };
    }
  }

  /**
   * Remove credenciais de acesso de um funcionário
   */
  async removeCredentials(employeeId: string, empresaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // SEGURANÇA: Verificar se o usuário atual pertence à empresa
      const userEmpresaId = await getCurrentUserEmpresaId();
      if (!userEmpresaId || userEmpresaId !== empresaId) {
        return {
          success: false,
          error: 'Acesso negado: você não tem permissão para esta empresa'
        };
      }
      // Buscar o funcionário
      const { data: employee, error: fetchError } = await (supabase as any)
        .from('bar_employees')
        .select('auth_user_id')
        .eq('id', employeeId)
        .eq('empresa_id', empresaId)
        .single();

      if (fetchError || !employee || !employee.auth_user_id) {
        return {
          success: false,
          error: 'Funcionário não encontrado ou sem credenciais'
        };
      }

      // Remover usuário do Auth
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(employee.auth_user_id);
      
      if (deleteAuthError) {
        console.error('Erro ao remover usuário Auth:', deleteAuthError);
        return {
          success: false,
          error: 'Erro ao remover credenciais'
        };
      }

      // Atualizar funcionário
      const { error: updateError } = await (supabase as any)
        .from('bar_employees')
        .update({
          auth_user_id: null,
          tem_acesso_sistema: false,
          data_credenciais_criadas: null
        })
        .eq('id', employeeId)
        .eq('empresa_id', empresaId);

      if (updateError) {
        console.error('Erro ao atualizar funcionário:', updateError);
        return {
          success: false,
          error: 'Erro ao atualizar funcionário'
        };
      }

      // Remover vínculo usuarios_empresa
      const { error: removeVinculoError } = await supabase
        .from('usuarios_empresa')
        .delete()
        .eq('user_id', employee.auth_user_id)
        .eq('empresa_id', empresaId);

      if (removeVinculoError) {
        console.error('Erro ao remover vínculo:', removeVinculoError);
        // Continuar mesmo com erro
      }

      return { success: true };

    } catch (error) {
      console.error('Erro inesperado ao remover credenciais:', error);
      return {
        success: false,
        error: 'Erro inesperado ao remover credenciais'
      };
    }
  }

  /**
   * Lista funcionários com credenciais de uma empresa
   */
  async getEmployeesWithCredentials(empresaId: string) {
    try {
      // SEGURANÇA: Verificar se o usuário atual pertence à empresa
      const userEmpresaId = await getCurrentUserEmpresaId();
      if (!userEmpresaId || userEmpresaId !== empresaId) {
        return {
          success: false,
          error: 'Acesso negado: você não tem permissão para esta empresa'
        };
      }
      const { data, error } = await (supabase as any)
        .from('bar_employees')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('tem_acesso_sistema', true)
        .eq('ativo', true)
        .not('auth_user_id', 'is', null)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar funcionários com credenciais:', error);
        return { success: false, error: 'Erro ao buscar funcionários com credenciais' };
      }

      return { success: true, employees: data };

    } catch (error) {
      console.error('Erro inesperado ao buscar funcionários com credenciais:', error);
      return { success: false, error: 'Erro inesperado ao buscar funcionários com credenciais' };
    }
  }
}
