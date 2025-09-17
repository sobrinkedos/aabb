import { Employee, ValidationError } from '../types/employee.types';

export const isValidCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se tem 10 ou 11 dígitos (com ou sem 9 no celular)
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

export const validateEmployee = (employee: Partial<Employee>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validação de nome
  if (!employee.name?.trim()) {
    errors.push({
      field: 'name',
      message: 'Nome é obrigatório',
      type: 'required'
    });
  } else if (employee.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Nome deve ter pelo menos 2 caracteres',
      type: 'format'
    });
  }
  
  // Validação de CPF
  if (!employee.cpf?.trim()) {
    errors.push({
      field: 'cpf',
      message: 'CPF é obrigatório',
      type: 'required'
    });
  } else if (!isValidCPF(employee.cpf)) {
    errors.push({
      field: 'cpf',
      message: 'CPF inválido',
      type: 'format'
    });
  }
  
  // Validação de email
  if (!employee.email?.trim()) {
    errors.push({
      field: 'email',
      message: 'Email é obrigatório',
      type: 'required'
    });
  } else if (!isValidEmail(employee.email)) {
    errors.push({
      field: 'email',
      message: 'Email inválido',
      type: 'format'
    });
  }
  
  // Validação de telefone
  if (employee.phone && !isValidPhone(employee.phone)) {
    errors.push({
      field: 'phone',
      message: 'Telefone inválido',
      type: 'format'
    });
  }
  
  // Validação de função
  if (!employee.role) {
    errors.push({
      field: 'role',
      message: 'Função é obrigatória',
      type: 'required'
    });
  }
  
  // Validação de data de contratação
  if (!employee.hire_date) {
    errors.push({
      field: 'hire_date',
      message: 'Data de contratação é obrigatória',
      type: 'required'
    });
  } else if (employee.hire_date > new Date()) {
    errors.push({
      field: 'hire_date',
      message: 'Data de contratação não pode ser futura',
      type: 'format'
    });
  }
  
  return errors;
};