import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { BarEmployee } from '../types';
import { ensureAuthenticated, getCurrentUserEmpresaId } from '../utils/auth-helper';
import { useErrorRecovery } from './useErrorRecovery';
import { useAuditLogger } from './useAuditLogger';
import { employeeCache } from '../utils/cache';
import { trackEmployeeCreation, trackPerformance, trackValidationError } from '../utils/analytics';

export interface NewBarEmployeeData {
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  bar_role: 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente';
  shift_preference?: 'manha' | 'tarde' | 'noite' | 'qualquer';
  specialties?: string[];
  commission_rate?: number;
  notes?: string;
}

export interface UpdateBarEmployeeData {
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  bar_role?: 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente';
  shift_preference?: 'manha' | 'tarde' | 'noite' | 'qualquer';
  specialties?: string[];
  commission_rate?: number;
  is_active?: boolean;
  notes?: string;
}

export const useBarEmployees = () => {
  const [employees, setEmployees] = useState<BarEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    loadWithRecovery, 
    saveWithRecovery, 
    deleteWithRecovery,
    isOnline,
    lastError,
    lastRecovery 
  } = useErrorRecovery();

  const { 
    logEmployeeCreated, 
    logEmployeeUpdated, 
    logEmployeeDeactivated 
  } = useAuditLogger();

  // Buscar todos os funcionários do bar
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar buscar do cache primeiro
      const cachedEmployees = employeeCache.getList();
      if (cachedEmployees) {
        setEmployees(cachedEmployees);
        setLoading(false);
        return;
      }

      const result = await loadWithRecovery(async () => {
        // Ensure user is authenticated before proceeding
        const authResult = await ensureAuthenticated();
        let client = supabase;

        if (!authResult.success) {
          console.warn('⚠️ Authentication failed, but continuing with fetch:', authResult.error);
        } else if (authResult.useAdmin) {
          console.log('🔧 Using admin client for fetch operations');
          client = supabaseAdmin;
        }

        // Buscar funcionários do bar
        const { data: barEmployeesData, error: barError } = await client
          .from('bar_employees')
          .select('*')
          .order('created_at', { ascending: false });

        if (barError) {
          console.error('Erro na consulta bar_employees:', barError);
          throw new Error(`Erro ao consultar banco de dados: ${barError.message}`);
        }

        return barEmployeesData || [];
      }, 'employees_list');

      if (result.success) {
        const barEmployeesData = result.data;

      // Mapear dados para a interface esperada
      const mappedEmployees: BarEmployee[] = (barEmployeesData || []).map((barEmp: any) => {
        // Extrair nome das observações (temporário)
        const notes = barEmp.notes || '';
        const nameMatch = notes.match(/Nome: ([^,]+)/);
        const cpfMatch = notes.match(/CPF: ([^,]+)/);
        const emailMatch = notes.match(/Email: ([^,]+)/);
        const phoneMatch = notes.match(/Telefone: ([^,]+)/);
        
        return {
          id: barEmp.id,
          employee_id: barEmp.employee_id || '',
          bar_role: barEmp.bar_role,
          shift_preference: barEmp.shift_preference,
          specialties: barEmp.specialties || [],
          commission_rate: barEmp.commission_rate || 0,
          status: barEmp.is_active ? 'active' : 'inactive',
          start_date: barEmp.start_date,
          end_date: barEmp.end_date,
          notes: barEmp.notes,
          created_at: barEmp.created_at,
          updated_at: barEmp.updated_at,
          // Dados extraídos das observações
          employee: {
            id: barEmp.id,
            name: nameMatch ? nameMatch[1] : 'Nome não informado',
            cpf: cpfMatch ? cpfMatch[1] : undefined,
            email: emailMatch ? emailMatch[1] : undefined,
            phone: phoneMatch ? phoneMatch[1] : undefined,
            hire_date: barEmp.start_date,
            status: barEmp.is_active ? 'active' : 'inactive'
          }
        };
      });

        console.log('Funcionários carregados:', mappedEmployees.length);
        setEmployees(mappedEmployees);
        
        // Salvar no cache
        employeeCache.setList(mappedEmployees);
      } else {
        console.error('Erro ao buscar funcionários:', result.error);
        setError(result.error?.message || 'Erro ao buscar funcionários');
      }
    } catch (err) {
      console.error('Erro ao buscar funcionários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar funcionários');
    } finally {
      setLoading(false);
    }
  }, [loadWithRecovery]);

  // Criar novo funcionário (versão simplificada)
  const createEmployee = useCallback(async (employeeData: NewBarEmployeeData): Promise<string> => {
    const startTime = performance.now();
    
    try {
      setError(null);

      const result = await saveWithRecovery(async () => {
        // Ensure user is authenticated before proceeding
        const authResult = await ensureAuthenticated();
        if (!authResult.success) {
          throw new Error(`Authentication failed: ${authResult.error}`);
        }

        // Determine which client to use and empresa_id
        let client = supabase;
        let empresaId = '00000000-0000-0000-0000-000000000001'; // Default empresa

        if (authResult.useAdmin) {
          console.log('🔧 Using admin client for database operations');
          client = supabaseAdmin;
        } else {
          // Get the current user's empresa_id
          const userEmpresaId = await getCurrentUserEmpresaId();
          if (userEmpresaId) {
            empresaId = userEmpresaId;
          }
        }

        console.log('✅ Creating employee for empresa:', empresaId);

        // Construir notes de forma limpa, evitando duplicação
        const notesArray = [];
        if (employeeData.name) notesArray.push(`Nome: ${employeeData.name}`);
        if (employeeData.cpf) notesArray.push(`CPF: ${employeeData.cpf}`);
        if (employeeData.email) notesArray.push(`Email: ${employeeData.email}`);
        if (employeeData.phone) notesArray.push(`Telefone: ${employeeData.phone}`);
        if (employeeData.notes) notesArray.push(`Observações: ${employeeData.notes}`);
        
        const cleanNotes = notesArray.join(', ');

        // Criar registro diretamente na tabela bar_employees
        const { data: newBarEmployee, error: barEmployeeError } = await client
          .from('bar_employees')
          .insert([{
            employee_id: null, // Por enquanto sem relação com employees
            bar_role: employeeData.bar_role,
            shift_preference: employeeData.shift_preference || 'qualquer',
            specialties: employeeData.specialties || [],
            commission_rate: employeeData.commission_rate || 0,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0],
            notes: cleanNotes,
            empresa_id: empresaId
          }])
          .select()
          .single();

        if (barEmployeeError) throw barEmployeeError;

        console.log('✅ Employee created successfully:', newBarEmployee.id);
        return newBarEmployee;
      }, employeeData, `pending_save_employee_${Date.now()}`);

      if (result.success) {
        // Track successful creation
        trackEmployeeCreation({
          employeeId: result.data.id,
          role: employeeData.bar_role,
          source: 'manual',
          duration: performance.now() - startTime,
          success: true
        });

        // Recarregar a lista de forma otimizada
        await fetchEmployees();
        return result.data.id;
      } else {
        throw result.error || new Error('Erro ao criar funcionário');
      }
    } catch (err) {
      console.error('Erro ao criar funcionário:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar funcionário';
      
      // Track failed creation
      trackEmployeeCreation({
        employeeId: 'failed',
        role: employeeData.bar_role,
        source: 'manual',
        duration: performance.now() - startTime,
        success: false,
        errors: [errorMessage]
      });

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchEmployees, saveWithRecovery]);

  // Atualizar funcionário existente (versão otimizada)
  const updateEmployee = useCallback(async (employeeId: string, updateData: UpdateBarEmployeeData): Promise<void> => {
    try {
      setError(null);

      // Buscar dados atuais
      const { data: currentEmployee, error: fetchError } = await supabase
        .from('bar_employees')
        .select('notes')
        .eq('id', employeeId)
        .single();

      if (fetchError) throw fetchError;

      // Reconstruir notes de forma limpa, evitando duplicação
      const currentNotes = currentEmployee?.notes || '';
      
      // Extrair dados atuais das notes
      const extractValue = (pattern: RegExp) => {
        const match = currentNotes.match(pattern);
        return match ? match[1] : '';
      };

      const currentName = extractValue(/Nome: ([^,]+)/);
      const currentCpf = extractValue(/CPF: ([^,]+)/);
      const currentEmail = extractValue(/Email: ([^,]+)/);
      const currentPhone = extractValue(/Telefone: ([^,]+)/);
      const currentObservations = extractValue(/Observações: (.+)$/);

      // Usar dados novos ou manter os atuais
      const finalName = updateData.name !== undefined ? updateData.name : currentName;
      const finalCpf = updateData.cpf !== undefined ? updateData.cpf : currentCpf;
      const finalEmail = updateData.email !== undefined ? updateData.email : currentEmail;
      const finalPhone = updateData.phone !== undefined ? updateData.phone : currentPhone;
      const finalObservations = updateData.notes !== undefined ? updateData.notes : currentObservations;

      // Construir notes limpo
      const notesArray = [];
      if (finalName) notesArray.push(`Nome: ${finalName}`);
      if (finalCpf) notesArray.push(`CPF: ${finalCpf}`);
      if (finalEmail) notesArray.push(`Email: ${finalEmail}`);
      if (finalPhone) notesArray.push(`Telefone: ${finalPhone}`);
      if (finalObservations) notesArray.push(`Observações: ${finalObservations}`);
      
      const cleanNotes = notesArray.join(', ');

      // Preparar dados de atualização
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        notes: cleanNotes
      };

      if (updateData.bar_role !== undefined) updatePayload.bar_role = updateData.bar_role;
      if (updateData.shift_preference !== undefined) updatePayload.shift_preference = updateData.shift_preference;
      if (updateData.specialties !== undefined) updatePayload.specialties = updateData.specialties;
      if (updateData.commission_rate !== undefined) updatePayload.commission_rate = updateData.commission_rate;
      if (updateData.is_active !== undefined) updatePayload.is_active = updateData.is_active;

      // Atualizar na tabela bar_employees
      const { error: updateError } = await supabase
        .from('bar_employees')
        .update(updatePayload)
        .eq('id', employeeId);

      if (updateError) throw updateError;

      // Recarregar a lista
      await fetchEmployees();
    } catch (err) {
      console.error('Erro ao atualizar funcionário:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar funcionário';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchEmployees]);

  // Desativar funcionário (soft delete)
  const deactivateEmployee = useCallback(async (employeeId: string): Promise<void> => {
    try {
      await updateEmployee(employeeId, { 
        is_active: false,
      });
    } catch (err) {
      console.error('Erro ao desativar funcionário:', err);
      throw err;
    }
  }, [updateEmployee]);

  // Reativar funcionário
  const reactivateEmployee = useCallback(async (employeeId: string): Promise<void> => {
    try {
      await updateEmployee(employeeId, { 
        is_active: true,
      });
    } catch (err) {
      console.error('Erro ao reativar funcionário:', err);
      throw err;
    }
  }, [updateEmployee]);

  // Buscar funcionário por ID (versão simplificada)
  const getEmployeeById = useCallback(async (employeeId: string): Promise<BarEmployee | null> => {
    try {
      const { data, error } = await supabase
        .from('bar_employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Extrair dados das observações
      const notes = data.notes || '';
      const nameMatch = notes.match(/Nome: ([^,]+)/);
      const cpfMatch = notes.match(/CPF: ([^,]+)/);
      const emailMatch = notes.match(/Email: ([^,]+)/);
      const phoneMatch = notes.match(/Telefone: ([^,]+)/);

      return {
        id: data.id,
        employee_id: data.employee_id || '',
        bar_role: data.bar_role as 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente',
        shift_preference: data.shift_preference as 'manha' | 'tarde' | 'noite' | 'qualquer' | undefined,
        specialties: data.specialties || [],
        commission_rate: data.commission_rate || 0,
        status: data.is_active ? 'active' : 'inactive',
        start_date: data.start_date || '',
        end_date: data.end_date || undefined,
        notes: data.notes || undefined,
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        employee: {
          id: data.id,
          name: nameMatch ? nameMatch[1] : 'Nome não informado',
          cpf: cpfMatch ? cpfMatch[1] : undefined,
          email: emailMatch ? emailMatch[1] : undefined,
          phone: phoneMatch ? phoneMatch[1] : undefined,
          hire_date: data.start_date || undefined,
          status: data.is_active ? 'active' : 'inactive'
        }
      };
    } catch (err) {
      console.error('Erro ao buscar funcionário:', err);
      return null;
    }
  }, []);

  // Filtrar funcionários
  const filterEmployees = useCallback((
    searchTerm: string = '',
    roleFilter: string = 'all',
    statusFilter: string = 'all'
  ) => {
    return employees.filter(emp => {
      const employee = emp.employee;
      if (!employee) return false;

      const matchesSearch = 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.cpf?.includes(searchTerm);

      const matchesRole = roleFilter === 'all' || emp.bar_role === roleFilter;
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees]);

  // Obter estatísticas avançadas
  const getStats = useCallback(() => {
    // Tentar buscar do cache primeiro
    const cachedStats = employeeCache.getStats();
    if (cachedStats) {
      return cachedStats;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Calcular contratações recentes
    const recentHires = employees.filter(emp => {
      if (!emp.start_date) return false;
      const startDate = new Date(emp.start_date);
      return startDate >= thirtyDaysAgo;
    }).length;

    // Calcular tempo médio na empresa (em meses)
    const avgTenure = employees.length > 0 ? 
      employees.reduce((acc, emp) => {
        if (!emp.start_date) return acc;
        const startDate = new Date(emp.start_date);
        const monthsWorked = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        return acc + monthsWorked;
      }, 0) / employees.length : 0;

    // Estatísticas por turno
    const byShift = {
      manha: employees.filter(e => e.shift_preference === 'manha').length,
      tarde: employees.filter(e => e.shift_preference === 'tarde').length,
      noite: employees.filter(e => e.shift_preference === 'noite').length,
      qualquer: employees.filter(e => e.shift_preference === 'qualquer' || !e.shift_preference).length
    };

    const stats = {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      inactive: employees.filter(e => e.status === 'inactive').length,
      byRole: {
        atendente: employees.filter(e => e.bar_role === 'atendente').length,
        garcom: employees.filter(e => e.bar_role === 'garcom').length,
        cozinheiro: employees.filter(e => e.bar_role === 'cozinheiro').length,
        barman: employees.filter(e => e.bar_role === 'barman').length,
        gerente: employees.filter(e => e.bar_role === 'gerente').length
      },
      byShift,
      recentHires,
      avgTenure: Math.round(avgTenure),
      topPerformers: Math.floor(employees.filter(e => e.status === 'active').length * 0.2), // 20% dos ativos
      needsAttention: Math.floor(employees.length * 0.1) // 10% do total
    };

    // Salvar no cache
    employeeCache.setStats(stats);
    
    return stats;
  }, [employees]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    // Estados
    employees,
    loading,
    error,

    // Ações CRUD
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    reactivateEmployee,
    getEmployeeById,

    // Utilitários
    filterEmployees,
    getStats,
    refetch: fetchEmployees
  };
};