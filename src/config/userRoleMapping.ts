/**
 * Mapeamento dinâmico de usuários e seus roles
 * Este arquivo pode ser atualizado automaticamente quando novos usuários são criados
 */

export interface UserRoleEntry {
  email: string;
  role: string;
  createdAt: string;
  createdBy?: string;
}

// Mapeamento base de usuários conhecidos
export const baseUserRoleMapping: Record<string, string> = {
  'bob@teste.com': 'atendente_caixa',
  'maria@teste.com': 'operador_caixa',
  'charles@teste.com': 'operador_caixa', // Usuário criado como caixa
  'tony@teste.com': 'operador_caixa', // Usuário criado como caixa (temporário)
  'lulu@teste.com': 'operador_caixa', // ✅ ADICIONADO: Lulu Santos como operador de caixa
  'lulusantos@teste.com': 'operador_caixa', // ✅ ADICIONADO: Variação do email
  'lulu.santos@teste.com': 'operador_caixa', // ✅ ADICIONADO: Variação do email
};

// Função para adicionar novo usuário ao mapeamento
export const addUserRoleMapping = (email: string, role: string, createdBy?: string): void => {
  console.log(`🚨 CHAMADA addUserRoleMapping:`, { email, role, createdBy });
  console.trace('📍 Stack trace da chamada:');
  
  // Em um sistema real, isso salvaria no localStorage, banco de dados, ou arquivo de configuração
  const newEntry: UserRoleEntry = {
    email,
    role,
    createdAt: new Date().toISOString(),
    createdBy
  };
  
  console.log(`📝 Adicionando mapeamento de usuário: ${email} → ${role}`);
  
  // Por enquanto, apenas log. Em produção, salvaria persistentemente
  localStorage.setItem(`userRole_${email}`, JSON.stringify(newEntry));
};

// Função para buscar role do usuário
export const getUserRole = (email: string): string | null => {
  console.log(`🔍 getUserRole chamada para: ${email}`);
  
  // Primeiro, verificar mapeamento base
  if (baseUserRoleMapping[email]) {
    console.log(`📋 Role encontrado no mapeamento base: ${baseUserRoleMapping[email]}`);
    return baseUserRoleMapping[email];
  }
  
  // Depois, verificar localStorage (mapeamentos dinâmicos)
  try {
    const stored = localStorage.getItem(`userRole_${email}`);
    if (stored) {
      const entry: UserRoleEntry = JSON.parse(stored);
      console.log(`💾 Role encontrado no localStorage: ${entry.role}`);
      return entry.role;
    } else {
      console.log(`❌ Nenhum mapeamento encontrado no localStorage para: ${email}`);
    }
  } catch (error) {
    console.warn('Erro ao buscar role do localStorage:', error);
  }
  
  console.log(`🚫 Nenhum role encontrado para: ${email}`);
  return null;
};

// Mapeamento de roles do sistema de criação para roles do middleware
export const mapEmployeeRoleToMiddlewareRole = (employeeRole: string): string => {
  console.log(`🔄 Mapeando role: "${employeeRole}"`);
  
  const roleMap: Record<string, string> = {
    'waiter': 'garcom',
    'cook': 'cozinheiro', 
    'cashier': 'operador_caixa', // EmployeeRole do formulário
    'caixa': 'operador_caixa',   // BarRole mapeado (antigo)
    'atendente': 'operador_caixa', // BarRole correto
    'supervisor': 'atendente',
    'barman': 'atendente',
    'manager': 'gerente',
    'gerente': 'gerente',
    'admin': 'administrador'
  };
  
  const mappedRole = roleMap[employeeRole] || 'funcionario';
  console.log(`🎯 Role "${employeeRole}" mapeado para: "${mappedRole}"`);
  
  return mappedRole;
};