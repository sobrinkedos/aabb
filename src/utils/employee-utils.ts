/**
 * Utilitários para gerenciamento de funcionários
 */

import { EmployeeCreationData } from '../services/employee-creation-service';

/**
 * Mapeia cargo do sistema para bar_role
 */
export const mapCargoToBarRole = (cargo: string): EmployeeCreationData['bar_role'] => {
  const cargoLower = cargo.toLowerCase();
  
  if (cargoLower.includes('gerente')) return 'gerente';
  if (cargoLower.includes('atendente') || cargoLower.includes('caixa')) return 'atendente';
  if (cargoLower.includes('garçom') || cargoLower.includes('garcom')) return 'garcom';
  if (cargoLower.includes('cozinheiro') || cargoLower.includes('cozinha')) return 'cozinheiro';
  if (cargoLower.includes('barman') || cargoLower.includes('bartender')) return 'barman';
  
  return 'garcom'; // Default
};

/**
 * Mapeia bar_role para cargo do sistema
 */
export const mapBarRoleToCargo = (barRole: EmployeeCreationData['bar_role']): string => {
  const roleMap: Record<EmployeeCreationData['bar_role'], string> = {
    'gerente': 'Gerente de Bar',
    'atendente': 'Atendente de Caixa',
    'garcom': 'Garçom',
    'cozinheiro': 'Cozinheiro',
    'barman': 'Barman'
  };
  
  return roleMap[barRole] || 'Funcionário';
};

/**
 * Gera dados básicos para criação de funcionário
 */
export const createBasicEmployeeData = (
  nome: string,
  email: string,
  cargo: string,
  telefone?: string,
  cpf?: string,
  observacoes?: string
): {
  nome_completo: string;
  email: string;
  telefone?: string;
  cpf?: string;
  bar_role: EmployeeCreationData['bar_role'];
  shift_preference: 'qualquer';
  specialties: string[];
  commission_rate: number;
  observacoes?: string;
  tem_acesso_sistema: boolean;
} => {
  const barRole = mapCargoToBarRole(cargo);
  
  // Especialidades padrão baseadas no cargo
  const defaultSpecialties: Record<EmployeeCreationData['bar_role'], string[]> = {
    'gerente': ['gestao', 'lideranca', 'atendimento'],
    'atendente': ['caixa', 'atendimento', 'vendas'],
    'garcom': ['atendimento', 'vendas', 'organizacao'],
    'cozinheiro': ['culinaria', 'organizacao', 'higiene'],
    'barman': ['drinks', 'atendimento', 'criatividade']
  };

  // Taxa de comissão padrão
  const defaultCommission: Record<EmployeeCreationData['bar_role'], number> = {
    'gerente': 5.0,
    'atendente': 2.0,
    'garcom': 3.0,
    'cozinheiro': 1.0,
    'barman': 4.0
  };

  return {
    nome_completo: nome,
    email: email,
    telefone: telefone,
    cpf: cpf,
    bar_role: barRole,
    shift_preference: 'qualquer',
    specialties: defaultSpecialties[barRole] || [],
    commission_rate: defaultCommission[barRole] || 2.0,
    observacoes: observacoes,
    tem_acesso_sistema: true
  };
};

/**
 * Valida dados de funcionário antes da criação
 */
export const validateEmployeeData = (data: Partial<EmployeeCreationData>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Validações obrigatórias
  if (!data.nome_completo?.trim()) {
    errors.push('Nome completo é obrigatório');
  }

  if (!data.email?.trim()) {
    errors.push('Email é obrigatório');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email deve ter formato válido');
  }

  if (!data.bar_role) {
    errors.push('Função no bar é obrigatória');
  }

  if (!data.cargo?.trim()) {
    errors.push('Cargo é obrigatório');
  }

  // Validações opcionais
  if (data.telefone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.telefone)) {
    errors.push('Telefone deve ter formato (XX) XXXXX-XXXX');
  }

  if (data.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.cpf)) {
    errors.push('CPF deve ter formato XXX.XXX.XXX-XX');
  }

  if (data.commission_rate && (data.commission_rate < 0 || data.commission_rate > 20)) {
    errors.push('Taxa de comissão deve estar entre 0% e 20%');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formata dados de funcionário para exibição
 */
export const formatEmployeeForDisplay = (employee: any) => {
  return {
    id: employee.id,
    nome: employee.profiles?.name || employee.usuarios_empresa?.nome_completo || 'N/A',
    email: employee.usuarios_empresa?.email || 'N/A',
    telefone: employee.usuarios_empresa?.telefone || 'N/A',
    cargo: employee.usuarios_empresa?.cargo || mapBarRoleToCargo(employee.bar_role),
    funcao: employee.bar_role,
    turno: employee.shift_preference || 'qualquer',
    especialidades: employee.specialties || [],
    comissao: employee.commission_rate || 0,
    ativo: employee.is_active,
    status: employee.usuarios_empresa?.status || (employee.is_active ? 'ativo' : 'inativo'),
    senhaProvisoria: employee.usuarios_empresa?.senha_provisoria || false,
    dataInicio: employee.start_date,
    dataFim: employee.end_date,
    avatar: employee.profiles?.avatar_url,
    observacoes: employee.notes
  };
};

/**
 * Gera senha temporária segura
 */
export const generateSecurePassword = (length: number = 10): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
};

/**
 * Formata permissões para exibição
 */
export const formatPermissionsForDisplay = (permissions: any) => {
  const moduleNames: Record<string, string> = {
    'dashboard': 'Dashboard',
    'monitor_bar': 'Monitor do Bar',
    'atendimento_bar': 'Atendimento do Bar',
    'monitor_cozinha': 'Monitor da Cozinha',
    'gestao_caixa': 'Gestão de Caixa',
    'clientes': 'Clientes',
    'funcionarios': 'Funcionários',
    'relatorios': 'Relatórios',
    'configuracoes': 'Configurações'
  };

  const actionNames: Record<string, string> = {
    'visualizar': 'Visualizar',
    'criar': 'Criar',
    'editar': 'Editar',
    'excluir': 'Excluir',
    'administrar': 'Administrar'
  };

  return Object.entries(permissions).map(([module, perms]: [string, any]) => ({
    modulo: moduleNames[module] || module,
    moduloKey: module,
    permissoes: Object.entries(perms).map(([action, allowed]: [string, any]) => ({
      acao: actionNames[action] || action,
      acaoKey: action,
      permitido: Boolean(allowed)
    }))
  }));
};

/**
 * Verifica se funcionário tem permissão específica
 */
export const hasPermission = (
  permissions: any,
  module: string,
  action: string
): boolean => {
  return permissions?.[module]?.[action] === true;
};

/**
 * Conta total de permissões ativas
 */
export const countActivePermissions = (permissions: any): number => {
  let count = 0;
  
  Object.values(permissions).forEach((modulePerms: any) => {
    Object.values(modulePerms).forEach((allowed: any) => {
      if (allowed === true) count++;
    });
  });
  
  return count;
};