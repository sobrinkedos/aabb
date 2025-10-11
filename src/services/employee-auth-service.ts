/**
 * Serviço de Autenticação de Funcionários
 * 
 * Gerencia a criação e autenticação de funcionários no Supabase Auth
 */

import { supabase, supabaseAdmin, isAdminConfigured } from '../lib/supabase';
import { Employee } from '../types/employee.types';
import { LocalEmployeeService } from './local-employee-service';

export interface EmployeeAuthCredentials {
  email: string;
  password: string;
  username: string;
  temporaryPassword: boolean;
}

export interface EmployeeAuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  needsPasswordChange?: boolean;
}

export class EmployeeAuthService {
  private static instance: EmployeeAuthService;

  static getInstance(): EmployeeAuthService {
    if (!EmployeeAuthService.instance) {
      EmployeeAuthService.instance = new EmployeeAuthService();
    }
    return EmployeeAuthService.instance;
  }

  /**
   * Cria um usuário no Supabase Auth para o funcionário
   */
  async createEmployeeUser(employee: Employee, credentials: EmployeeAuthCredentials): Promise<EmployeeAuthResult> {
    try {
      console.log('🔐 Criando usuário para funcionário:', { email: credentials.email, username: credentials.username });

      // Se o admin não estiver configurado, usar serviço local
      if (!isAdminConfigured) {
        console.warn('⚠️ Service Role Key não configurada. Usando armazenamento local para desenvolvimento.');
        
        const localService = LocalEmployeeService.getInstance();
        const result = await localService.saveEmployeeCredentials(employee, credentials);
        
        if (result.success) {
          console.log('💾 Credenciais salvas localmente com sucesso');
        }
        
        return result;
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: credentials.email,
        password: credentials.password,
        email_confirm: true, // Confirma email automaticamente
        user_metadata: {
          username: credentials.username,
          employee_id: employee.id,
          role: employee.role,
          temporary_password: credentials.temporaryPassword,
          created_by: 'system',
          created_at: new Date().toISOString()
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError);
        return {
          success: false,
          error: `Erro ao criar usuário: ${authError.message}`
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Usuário não foi criado corretamente'
        };
      }

      console.log('✅ Usuário criado no Auth:', authData.user.id);

      // 2. Criar registro na tabela de perfis de usuário
      const profileResult = await this.createUserProfile(authData.user.id, employee, credentials);
      
      if (!profileResult.success) {
        // Se falhar ao criar perfil, tentar remover o usuário do Auth
        if (isAdminConfigured) {
          await this.deleteAuthUser(authData.user.id);
        }
        return profileResult;
      }

      // 3. Criar permissões do usuário
      const permissionsResult = await this.createUserPermissions(authData.user.id, employee);
      
      if (!permissionsResult.success) {
        console.warn('⚠️ Erro ao criar permissões, mas usuário foi criado');
      }

      return {
        success: true,
        userId: authData.user.id,
        needsPasswordChange: credentials.temporaryPassword
      };

    } catch (error) {
      console.error('❌ Erro geral ao criar usuário:', error);
      return {
        success: false,
        error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Cria o perfil do usuário na tabela profiles
   */
  private async createUserProfile(userId: string, employee: Employee, credentials: EmployeeAuthCredentials): Promise<EmployeeAuthResult> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: credentials.email,
          username: credentials.username,
          full_name: employee.name,
          employee_id: employee.id,
          role: employee.role,
          status: employee.status,
          temporary_password: credentials.temporaryPassword,
          password_expires_at: credentials.temporaryPassword 
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
            : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao criar perfil:', error);
        return {
          success: false,
          error: `Erro ao criar perfil: ${error.message}`
        };
      }

      console.log('✅ Perfil criado com sucesso');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao criar perfil:', error);
      return {
        success: false,
        error: `Erro interno ao criar perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Cria as permissões do usuário
   */
  private async createUserPermissions(userId: string, employee: Employee): Promise<EmployeeAuthResult> {
    try {
      if (!employee.permissions || employee.permissions.length === 0) {
        console.log('ℹ️ Nenhuma permissão para criar');
        return { success: true };
      }

      const permissionsToInsert = employee.permissions.map(permission => ({
        user_id: userId,
        employee_id: employee.id,
        module: permission.module,
        action: permission.action,
        resource: permission.resource,
        granted_at: new Date().toISOString(),
        granted_by: 'system'
      }));

      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (error) {
        console.error('❌ Erro ao criar permissões:', error);
        return {
          success: false,
          error: `Erro ao criar permissões: ${error.message}`
        };
      }

      console.log('✅ Permissões criadas com sucesso');
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao criar permissões:', error);
      return {
        success: false,
        error: `Erro interno ao criar permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Remove um usuário do Supabase Auth (cleanup em caso de erro)
   */
  private async deleteAuthUser(userId: string): Promise<void> {
    try {
      if (isAdminConfigured) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log('🗑️ Usuário removido do Auth após erro');
      }
    } catch (error) {
      console.error('❌ Erro ao remover usuário do Auth:', error);
    }
  }

  /**
   * Atualiza as credenciais de um funcionário existente
   */
  async updateEmployeeCredentials(employeeId: string, newCredentials: Partial<EmployeeAuthCredentials>): Promise<EmployeeAuthResult> {
    try {
      // 1. Buscar o usuário pelo employee_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('employee_id', employeeId)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      // 2. Atualizar no Auth se necessário
      if (newCredentials.email || newCredentials.password) {
        const updateData: any = {};
        
        if (newCredentials.email) {
          updateData.email = newCredentials.email;
        }
        
        if (newCredentials.password) {
          updateData.password = newCredentials.password;
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.id,
          updateData
        );

        if (authError) {
          return {
            success: false,
            error: `Erro ao atualizar credenciais: ${authError.message}`
          };
        }
      }

      // 3. Atualizar perfil
      const profileUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (newCredentials.email) {
        profileUpdates.email = newCredentials.email;
      }

      if (newCredentials.username) {
        profileUpdates.username = newCredentials.username;
      }

      if (newCredentials.temporaryPassword !== undefined) {
        profileUpdates.temporary_password = newCredentials.temporaryPassword;
        profileUpdates.password_expires_at = newCredentials.temporaryPassword
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : null;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profile.id);

      if (updateError) {
        return {
          success: false,
          error: `Erro ao atualizar perfil: ${updateError.message}`
        };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao atualizar credenciais:', error);
      return {
        success: false,
        error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Verifica se um email já está em uso
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Se não há configuração admin, usar serviço local
      if (!isAdminConfigured) {
        const localService = LocalEmployeeService.getInstance();
        return await localService.checkEmailExists(email);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar email:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  }

  /**
   * Verifica se um username já está em uso
   */
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      // Se não há configuração admin, usar serviço local
      if (!isAdminConfigured) {
        const localService = LocalEmployeeService.getInstance();
        return await localService.checkUsernameExists(username);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar username:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      return false;
    }
  }

  /**
   * Força a alteração de senha no próximo login
   */
  async forcePasswordChange(employeeId: string): Promise<EmployeeAuthResult> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          temporary_password: true,
          password_expires_at: new Date().toISOString(), // Expira imediatamente
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId);

      if (error) {
        return {
          success: false,
          error: `Erro ao forçar alteração de senha: ${error.message}`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}