/**
 * Serviço básico para criação de funcionários SEM credenciais de acesso
 * 
 * Este serviço é responsável apenas por criar o registro do funcionário
 * na tabela employees, sem criar usuário no Supabase Auth.
 * 
 * As credenciais de acesso são atribuídas posteriormente através da edição.
 */

import { supabase } from '../lib/supabase';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';

export interface BasicEmployeeData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  position_id: string;
  department_id: string;
  employee_code?: string;
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
        .from('employees')
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

      // Gerar código do funcionário se não fornecido
      const employeeCode = employeeData.employee_code || `EMP${Date.now().toString().slice(-6)}`;

      // Debug: Log dos dados antes da inserção
      const insertData = {
        employee_code: employeeCode,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone || null,
        cpf: employeeData.cpf || null,
        position_id: employeeData.position_id,
        department_id: employeeData.department_id,
        empresa_id: empresaId,
        status: 'active',
        tem_acesso_sistema: false, // Sem acesso ao sistema ainda
        auth_user_id: null, // Sem usuário Auth ainda
        hire_date: new Date().toISOString().split('T')[0] // Data de hoje
      };
      
      console.log('🔍 DEBUG - Dados para inserção:', insertData);
      console.log('🔍 DEBUG - CPF recebido:', employeeData.cpf);

      // Criar funcionário básico (sem credenciais) na tabela employees
      const { data: employee, error: createError } = await supabase
        .from('employees')
        .insert(insertData)
        .select(`
          *,
          position:positions(name),
          department:departments(name)
        `)
        .single();

      if (createError) {
        console.error('Erro ao criar funcionário básico:', createError);
        return {
          success: false,
          error: 'Erro ao criar funcionário básico'
        };
      }

      console.log('✅ DEBUG - Funcionário criado:', employee);
      console.log('✅ DEBUG - CPF no retorno:', employee?.cpf);

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
        .from('employees')
        .select(`
          id, name, email, phone, cpf, employee_code, status, 
          tem_acesso_sistema, auth_user_id, position_id, department_id,
          created_at, updated_at, hire_date
        `)
        .eq('empresa_id', empresaId)
        .eq('tem_acesso_sistema', false)
        .eq('status', 'active')
        .order('name');

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
      
      const { data: employee, error } = await supabase
        .from('employees')
        .update({
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone,
          cpf: employeeData.cpf,
          position_id: employeeData.position_id,
          department_id: employeeData.department_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .eq('empresa_id', empresaId)
        .select(`
          *,
          position:positions(name),
          department:departments(name)
        `)
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
