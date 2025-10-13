# Correção Urgente - Criação de Funcionários

## 🚨 Problema Identificado

O sistema está **simulando** a criação de credenciais mas **NÃO está criando** os usuários realmente. 

### O que está acontecendo:
1. ✅ Usuário preenche formulário de funcionário
2. ✅ Sistema gera credenciais (fake)
3. ✅ Sistema mostra credenciais na tela
4. ❌ **Sistema NÃO cria usuário no Supabase Auth**
5. ❌ **Sistema NÃO cria registro na usuarios_empresa**
6. ✅ Sistema cria apenas na tabela `bar_employees`

### Resultado:
- Funcionário aparece na lista (bar_employees)
- Credenciais são mostradas ao admin
- **Funcionário NÃO consegue fazer login**

## 🔧 Causa Raiz

Na página `src/pages/BarEmployees/index.tsx`, linha 99:

```typescript
const handleCreateEmployee = async (employee: Employee, credentials?: any) => {
  const barEmployeeData = convertEmployeeToBarEmployee(employee);
  
  // PROBLEMA: Está usando o hook antigo que NÃO cria usuários
  await createEmployee(barEmployeeData); // ← useBarEmployees.createEmployee
  
  // Sistema mostra credenciais mas elas são FAKE
  if (credentials) {
    setGeneratedCredentials(credentials);
    setShowCredentialsModal(true);
  }
};
```

## 🚀 Solução Imediata

### Opção 1: Substituir o hook (Recomendado)

**Arquivo:** `src/pages/BarEmployees/index.tsx`

**Substituir:**
```typescript
// ANTES (linha ~4)
import { useBarEmployees, NewBarEmployeeData, UpdateBarEmployeeData } from '../../hooks/useBarEmployees';

// DEPOIS
import { useEmployeeCreation } from '../../hooks/useEmployeeCreation';
import { useBarEmployees, NewBarEmployeeData, UpdateBarEmployeeData } from '../../hooks/useBarEmployees';
```

**E substituir a função handleCreateEmployee:**
```typescript
// ANTES
const handleCreateEmployee = async (employee: Employee, credentials?: any) => {
  const barEmployeeData = convertEmployeeToBarEmployee(employee);
  
  setProcessing(true);
  try {
    await createEmployee(barEmployeeData); // ← Hook antigo
    
    if (credentials) {
      setGeneratedCredentials(credentials);
      setCredentialsEmployeeName(employee.name);
      setShowCredentialsModal(true);
    }
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    throw error;
  } finally {
    setProcessing(false);
  }
};

// DEPOIS
const { createEmployeeWithDefaultPermissions } = useEmployeeCreation();

const handleCreateEmployee = async (employee: Employee, credentials?: any) => {
  setProcessing(true);
  try {
    // Usar o novo serviço que cria TUDO
    const result = await createEmployeeWithDefaultPermissions({
      nome_completo: employee.name,
      email: employee.email,
      telefone: employee.phone,
      cpf: employee.cpf,
      bar_role: convertRoleToBarRole(employee.role),
      observacoes: employee.observations,
      tem_acesso_sistema: true // IMPORTANTE: Criar credenciais
    });
    
    if (result.success && result.credentials) {
      // Mostrar credenciais REAIS
      setGeneratedCredentials({
        system: {
          email: result.credentials.email,
          password: result.credentials.senha_temporaria,
          temporaryPassword: result.credentials.deve_alterar_senha
        }
      });
      setCredentialsEmployeeName(employee.name);
      setShowCredentialsModal(true);
    } else if (result.success) {
      alert('Funcionário cadastrado com sucesso!');
    } else {
      throw new Error(result.error || 'Erro ao criar funcionário');
    }
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    throw error;
  } finally {
    setProcessing(false);
  }
};

// Função auxiliar para converter roles
const convertRoleToBarRole = (role: EmployeeRole): 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente' => {
  const roleMap: Record<EmployeeRole, 'atendente' | 'garcom' | 'cozinheiro' | 'barman' | 'gerente'> = {
    waiter: 'garcom',
    cook: 'cozinheiro',
    cashier: 'atendente',
    supervisor: 'barman',
    manager: 'gerente',
    admin: 'gerente'
  };
  return roleMap[role] || 'garcom';
};
```

### Opção 2: Correção Manual dos Usuários Existentes

Para Clóvis e outros funcionários já criados:

1. **Execute o arquivo `fix-antonio-user.html`** (modificado para Clóvis)
2. **Ou use o script SQL:**

```sql
-- Criar Clóvis na usuarios_empresa
INSERT INTO usuarios_empresa (
  user_id, empresa_id, nome_completo, email, cargo,
  tipo_usuario, status, senha_provisoria, ativo,
  tem_acesso_sistema, papel, created_at, updated_at
) VALUES (
  NULL, -- será preenchido quando criar no Auth
  '142f9c74-bec6-447f-9f8f-c68d7c1d7958',
  'Clovis',
  'clovis@teste.com',
  'Garçom',
  'funcionario',
  'ativo',
  true,
  true,
  true,
  'USER',
  now(),
  now()
);
```

## 📋 Funcionários Afetados

Todos os funcionários criados recentemente que:
- ✅ Aparecem na lista de funcionários
- ❌ Não conseguem fazer login
- ❌ Não existem na tabela `usuarios_empresa`

### Para identificar:
```sql
-- Funcionários sem usuário
SELECT be.id, be.notes, be.created_at
FROM bar_employees be
WHERE be.employee_id IS NULL
  AND be.created_at > '2025-09-20'
ORDER BY be.created_at DESC;
```

## 🎯 Ação Imediata

1. **Implementar Opção 1** (substituir hook)
2. **Testar criação de novo funcionário**
3. **Corrigir funcionários existentes** (Clóvis, etc.)
4. **Verificar se login funciona**

---

**Esta correção resolve o problema definitivamente e garante que futuros funcionários sejam criados corretamente!** 🎉