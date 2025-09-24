/**
 * Serviço básico para criação de funcionários SEM credenciais de acesso
 * 
 * Este serviço é responsável apenas por criar o registro do funcionário
 * nas tabelas necessárias, sem criar usuário no Supabase Auth.
 * 
 * As credenciais de acesso são atribuídas posteriormente através da edição.
 */

import { supabase } from '../lib/supabase';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';

export interface BasicEmployeeData {
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  telefone?: string;
  data_admissao: string;
  salario?: number;
  observacoes?: string;
}

export interface BasicEmployeeResult {
  success: boolean;
  employee?: any;
  error?: string;
}

export class EmployeeBasicService {
  /**
   * Cria um funcionário básico sem credenciais de acesso
   * Esta é a Etapa 1 do novo fluxo
   */
  async createBasicEmployee(
    employeeData: BasicEmployeeData,
    empresaId: string
  ): Promise<BasicEmployeeResult> {
    try {
      // SEGURANÇA: Verificar se o usuário atual pertence à empresa
      const userEmpresaId = await getCurrentUserEmpresaId();
      if (!userEmpresaId || userEmpresaId !== empresaId) {
        return {
          success: false,
          error: 'Acesso negado: você não tem permissão para esta empresa'
        };
      }
      // Verificar se o email já existe na empresa
      const { data: existingEmployee, error: checkError } = await supabase
        .from('bar_employees')
        .select('id, email')
        .eq('empresa_id', empresaId)
        .eq('email', employeeData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar email existente:', checkError);
        return {
          success: false,
          error: 'Erro ao verificar email existente'
        };
      }

      if (existingEmployee) {
        return {
          success: false,
          error: 'Já existe um funcionário com este email nesta empresa'
        };
      }

      // Criar funcionário básico (sem credenciais)
      const { data: employee, error: createError } = await supabase
        .from('bar_employees')
        .insert({
          ...employeeData,
          empresa_id: empresaId,
          tem_acesso_sistema: false, // Sem acesso ao sistema ainda
          ativo: true,
          data_cadastro: new Date().toISOString(),
          auth_user_id: null // Sem usuário Auth ainda
        } as any)
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar funcionário básico:', createError);
        return {
          success: false,
          error: 'Erro ao criar funcionário básico'
        };
      }

      return {
        success: true,
        employee
      };

    } catch (error) {
      console.error('Erro inesperado ao criar funcionário básico:', error);
      return {
        success: false,
        error: 'Erro inesperado ao criar funcionário básico'
      };
    }
  }

  /**
   * Lista funcionários básicos (sem credenciais) de uma empresa
   */
  async getBasicEmployees(empresaId: string) {
    try {
      // SEGURANÇA: Verificar se o usuário atual pertence à empresa
      const userEmpresaId = await getCurrentUserEmpresaId();
      if (!userEmpresaId || userEmpresaId !== empresaId) {
        return {
          success: false,
          error: 'Acesso negado: você não tem permissão para esta empresa'
        };
      }
      const { data, error } = await supabase
        .from('bar_employees')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('tem_acesso_sistema', false)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar funcionários básicos:', error);
        return { success: false, error: 'Erro ao buscar funcionários básicos' };
      }

      return { success: true, employees: data };

    } catch (error) {
      console.error('Erro inesperado ao buscar funcionários básicos:', error);
      return { success: false, error: 'Erro inesperado ao buscar funcionários básicos' };
    }
  }

  /**
   * Atualiza dados básicos de um funcionário (sem afetar credenciais)
   */
  async updateBasicEmployee(
    employeeId: string,
    employeeData: Partial<BasicEmployeeData>,
    empresaId: string
  ): Promise<BasicEmployeeResult> {
    try {
      // SEGURANÇA: Verificar se o usuário atual pertence à empresa
      const userEmpresaId = await getCurrentUserEmpresaId();
      if (!userEmpresaId || userEmpresaId !== empresaId) {
        return {
          success: false,
          error: 'Acesso negado: você não tem permissão para esta empresa'
        };
      }
      const { data: employee, error } = await (supabase as any)
        .from('bar_employees')
        .update(employeeData)
        .eq('id', employeeId)
        .eq('empresa_id', empresaId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar funcionário básico:', error);
        return {
          success: false,
          error: 'Erro ao atualizar funcionário básico'
        };
      }

      return {
        success: true,
        employee
      };

    } catch (error) {
      console.error('Erro inesperado ao atualizar funcionário básico:', error);
      return {
        success: false,
        error: 'Erro inesperado ao atualizar funcionário básico'
      };
    }
  }
}
