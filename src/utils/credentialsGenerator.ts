import { Employee } from '../types/employee.types';

export interface UserCredentials {
  username: string;
  password: string;
  email: string;
  temporaryPassword: boolean;
}

/**
 * Gera nome de usuário baseado no nome do funcionário
 */
export const generateUsername = (name: string, cpf?: string): string => {
  // Remove acentos e caracteres especiais
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim();

  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return cpf ? `user${cpf.slice(-4)}` : `user${Date.now()}`;
  }

  let username = '';
  
  if (nameParts.length === 1) {
    // Apenas um nome
    username = nameParts[0];
  } else if (nameParts.length === 2) {
    // Nome e sobrenome
    username = `${nameParts[0]}.${nameParts[1]}`;
  } else {
    // Nome completo - primeiro nome + último sobrenome
    username = `${nameParts[0]}.${nameParts[nameParts.length - 1]}`;
  }

  // Adiciona sufixo se necessário para evitar duplicatas
  const timestamp = Date.now().toString().slice(-3);
  
  // Limita o tamanho e adiciona timestamp se muito longo
  if (username.length > 15) {
    username = username.substring(0, 12) + timestamp;
  }

  return username;
};

/**
 * Gera senha temporária segura
 */
export const generateTemporaryPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';

  let password = '';
  
  // Garante pelo menos um caractere de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completa com caracteres aleatórios até 8 dígitos
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 4; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralha a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Gera credenciais completas para um funcionário
 */
export const generateEmployeeCredentials = async (employee: Employee): Promise<UserCredentials> => {
  let username = generateUsername(employee.name, employee.cpf);
  const password = generateTemporaryPassword();

  // Verificar se username já existe e gerar alternativo se necessário
  const { EmployeeAuthService } = await import('../services/employee-auth-service');
  const authService = EmployeeAuthService.getInstance();
  
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    const usernameExists = await authService.checkUsernameExists(username);
    
    if (!usernameExists) {
      break; // Username disponível
    }
    
    // Gerar variação do username
    attempts++;
    const suffix = attempts.toString().padStart(2, '0');
    username = `${generateUsername(employee.name, employee.cpf)}${suffix}`;
  }

  // Verificar se email já existe
  const emailExists = await authService.checkEmailExists(employee.email);
  if (emailExists) {
    throw new Error(`Email ${employee.email} já está em uso por outro funcionário`);
  }

  return {
    username,
    password,
    email: employee.email,
    temporaryPassword: true
  };
};

/**
 * Valida se o nome de usuário está disponível
 */
export const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (username.length < 3) {
    return { valid: false, message: 'Nome de usuário deve ter pelo menos 3 caracteres' };
  }

  if (username.length > 20) {
    return { valid: false, message: 'Nome de usuário deve ter no máximo 20 caracteres' };
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    return { valid: false, message: 'Nome de usuário pode conter apenas letras minúsculas, números, pontos, hífens e underscores' };
  }

  if (username.startsWith('.') || username.endsWith('.')) {
    return { valid: false, message: 'Nome de usuário não pode começar ou terminar com ponto' };
  }

  return { valid: true };
};

/**
 * Valida força da senha
 */
export const validatePasswordStrength = (password: string): { 
  strength: 'weak' | 'medium' | 'strong'; 
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento
  if (password.length >= 8) score += 2;
  else if (password.length >= 6) score += 1;
  else feedback.push('Use pelo menos 8 caracteres');

  // Maiúsculas
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Adicione letras maiúsculas');

  // Minúsculas
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Adicione letras minúsculas');

  // Números
  if (/\d/.test(password)) score += 1;
  else feedback.push('Adicione números');

  // Símbolos
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Adicione símbolos especiais');

  // Diversidade
  if (new Set(password).size >= password.length * 0.7) score += 1;
  else feedback.push('Use caracteres mais variados');

  let strength: 'weak' | 'medium' | 'strong';
  if (score >= 6) strength = 'strong';
  else if (score >= 4) strength = 'medium';
  else strength = 'weak';

  return { strength, score, feedback };
};

/**
 * Formata credenciais para exibição
 */
export const formatCredentialsForDisplay = (credentials: UserCredentials): string => {
  return `
📧 Email: ${credentials.email}
👤 Usuário: ${credentials.username}
🔑 Senha: ${credentials.password}

⚠️ Esta é uma senha temporária. O funcionário deve alterá-la no primeiro acesso.
  `.trim();
};

/**
 * Gera credenciais para diferentes tipos de acesso
 */
export const generateAccessCredentials = async (employee: Employee) => {
  const baseCredentials = await generateEmployeeCredentials(employee);
  
  return {
    // Credenciais principais do sistema
    system: baseCredentials,
    
    // Credenciais específicas para app mobile (se aplicável)
    mobile: employee.role === 'waiter' ? {
      ...baseCredentials,
      appId: `garcom_${baseCredentials.username}`,
      deviceLimit: 2
    } : null,
    
    // Token de primeiro acesso
    firstAccessToken: generateFirstAccessToken(),
    
    // Data de expiração da senha temporária (7 dias)
    passwordExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
};

/**
 * Gera token para primeiro acesso
 */
const generateFirstAccessToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
};