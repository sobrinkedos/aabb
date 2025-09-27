/**
 * Serviço para gerenciar posições e departamentos
 */

import { supabase } from '../lib/supabase';
import { getCurrentUserEmpresaId } from '../utils/auth-helper';

export interface Position {
  id: string;
  name: string;
  department_id: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface Department {
  id: string;
  name: string;
}

export class PositionsService {
  /**
   * Lista todos os departamentos
   */
  async getDepartments(): Promise<{ success: boolean; departments?: Department[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Erro ao buscar departamentos:', error);
        return { success: false, error: 'Erro ao buscar departamentos' };
      }

      return { success: true, departments: data };

    } catch (error) {
      console.error('Erro inesperado ao buscar departamentos:', error);
      return { success: false, error: 'Erro inesperado ao buscar departamentos' };
    }
  }

  /**
   * Lista todas as posições
   */
  async getPositions(): Promise<{ success: boolean; positions?: Position[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select(`
          id,
          name,
          department_id,
          department:departments(id, name)
        `)
        .order('name');

      if (error) {
        console.error('Erro ao buscar posições:', error);
        return { success: false, error: 'Erro ao buscar posições' };
      }

      return { success: true, positions: data };

    } catch (error) {
      console.error('Erro inesperado ao buscar posições:', error);
      return { success: false, error: 'Erro inesperado ao buscar posições' };
    }
  }

  /**
   * Lista posições por departamento
   */
  async getPositionsByDepartment(departmentId: string): Promise<{ success: boolean; positions?: Position[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select(`
          id,
          name,
          department_id,
          department:departments(id, name)
        `)
        .eq('department_id', departmentId)
        .order('name');

      if (error) {
        console.error('Erro ao buscar posições por departamento:', error);
        return { success: false, error: 'Erro ao buscar posições por departamento' };
      }

      return { success: true, positions: data };

    } catch (error) {
      console.error('Erro inesperado ao buscar posições por departamento:', error);
      return { success: false, error: 'Erro inesperado ao buscar posições por departamento' };
    }
  }
}