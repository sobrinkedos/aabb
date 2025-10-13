# Fluxo de Criação de Funcionário - Revisado

## 📋 Visão Geral

O fluxo de criação de funcionários foi completamente revisado para garantir integração completa com o sistema multitenant, criação automática de credenciais e gerenciamento adequado de permissões.

## 🔄 Fluxo Completo

### 1. **Verificação de Email**
- Verifica se o email já existe na tabela `usuarios_empresa`
- Impede duplicação de usuários no sistema

### 2. **Geração de Credenciais Automáticas**
- **Email:** Fornecido pelo administrador
- **Senha Temporária:** Gerada automaticamente (10 caracteres, incluindo especiais)
- **Flag:** `senha_provisoria = true` (força alteração no primeiro login)

### 3. **Criação no Supabase Auth**
- Cria usuário no sistema de autenticação
- Define metadados do usuário
- Confirma email automaticamente

### 4. **Criação de Perfil**
- Insere registro na tabela `profiles`
- Vincula com o ID do usuário do Auth
- Define avatar automático

### 5. **Registro como Funcionário do Bar**
- Cria registro na tabela `bar_employees`
- Define função, turno, especialidades
- Vincula com o usuário criado

### 6. **Vínculo com Empresa**
- **IMPORTANTE:** Cria registro na tabela `usuarios_empresa`
- Define `senha_provisoria = true`
- Configura status, papel e tipo de usuário
- Estabelece relação com a empresa

### 7. **Configuração de Permissões**
- Cria registros na tabela `permissoes_usuario`
- Define permissões específicas por módulo
- Baseado no cargo/função do funcionário

## 🏗️ Arquivos Criados

### Serviços
- **`src/services/employee-creation-service.ts`** - Serviço completo de criação
- **`src/hooks/useEmployeeCreation.ts`** - Hook React para usar o serviço

### Componentes
- **`src/components/Auth/PasswordChangeRequired.tsx`** - Tela de alteração obrigatória de senha

### Ferramentas de Teste
- **`create-stela-complete-flow.html`** - Página HTML para testar o fluxo completo

## 🔐 Fluxo de Login do Funcionário

### Primeiro Login
1. Funcionário recebe credenciais (email + senha temporária)
2. Faz login no sistema
3. Sistema detecta `senha_provisoria = true`
4. **Força alteração de senha** antes de acessar o sistema
5. Após alterar senha, `senha_provisoria = false`
6. Usuário ganha acesso às funcionalidades conforme permissões

### Logins Subsequentes
1. Login normal com nova senha
2. Acesso direto às funcionalidades
3. Permissões aplicadas conforme configuração

## 📊 Estrutura da Tabela `usuarios_empresa`

```sql
-- Campos importantes para o fluxo
user_id                    -- UUID do Supabase Auth
empresa_id                 -- UUID da empresa
nome_completo             -- Nome do funcionário
email                     -- Email de login
senha_provisoria          -- BOOLEAN (true = deve alterar senha)
tem_acesso_sistema        -- BOOLEAN (true = pode fazer login)
status                    -- 'ativo', 'inativo', 'bloqueado'
ativo                     -- BOOLEAN
papel                     -- 'USER', 'MANAGER', 'ADMIN'
tipo_usuario              -- 'funcionario', 'administrador'
```

## 🎯 Exemplo: Funcionária Stela

### Dados Criados
```javascript
// Tabela: bar_employees
{
  bar_role: 'atendente',
  shift_preference: 'manha',
  specialties: ['atendimento', 'caixa', 'vendas'],
  commission_rate: 2.5,
  empresa_id: '00000000-0000-0000-0000-000000000001'
}

// Tabela: usuarios_empresa
{
  nome_completo: 'Stela Silva',
  email: 'stela@teste.com',
  cargo: 'Atendente de Caixa',
  senha_provisoria: true,        // ← IMPORTANTE
  tem_acesso_sistema: true,
  papel: 'USER',
  tipo_usuario: 'funcionario'
}

// Tabela: permissoes_usuario
[
  { modulo: 'dashboard', permissoes: { visualizar: true } },
  { modulo: 'gestao_caixa', permissoes: { visualizar: true, criar: true, editar: true, administrar: true } },
  { modulo: 'clientes', permissoes: { visualizar: true, criar: true, editar: true } },
  { modulo: 'atendimento_bar', permissoes: { visualizar: true } }
]
```

### Credenciais Geradas
- **Email:** `stela@teste.com`
- **Senha Temporária:** `Abc123@#$%` (exemplo)
- **Deve Alterar:** Sim (primeiro login)

## 🚀 Como Usar

### 1. **Teste Rápido**
Abra o arquivo `create-stela-complete-flow.html` no navegador e clique em "Criar Funcionária".

### 2. **Integração no Sistema**
```typescript
import { useEmployeeCreation } from '../hooks/useEmployeeCreation';

const { createEmployeeWithDefaultPermissions } = useEmployeeCreation();

const result = await createEmployeeWithDefaultPermissions({
  nome_completo: 'Stela Silva',
  email: 'stela@teste.com',
  telefone: '(11) 99999-9999',
  cpf: '123.456.789-00',
  bar_role: 'atendente',
  shift_preference: 'manha',
  specialties: ['atendimento', 'caixa', 'vendas'],
  commission_rate: 2.5,
  observacoes: 'Funcionária responsável pelo caixa matutino',
  tem_acesso_sistema: true
});
```

## ✅ Validações e Segurança

### Validações Implementadas
- ✅ Email único no sistema
- ✅ Senha temporária segura (10 caracteres + especiais)
- ✅ Rollback em caso de erro
- ✅ Logs detalhados de cada etapa
- ✅ Tratamento de erros por etapa

### Segurança
- ✅ Senha temporária obrigatória
- ✅ Força alteração no primeiro login
- ✅ Permissões granulares por módulo
- ✅ Auditoria de criação
- ✅ Status de usuário controlado

## 🔧 Configuração de Permissões por Cargo

### Atendente (Caixa)
- Dashboard: Visualizar
- Gestão de Caixa: Completo
- Clientes: Visualizar, Criar, Editar
- Atendimento Bar: Visualizar

### Garçom
- Dashboard: Visualizar
- Atendimento Bar: Completo
- Clientes: Visualizar, Criar

### Gerente
- Todos os módulos: Acesso completo
- Configurações: Editar
- Relatórios: Visualizar

## 📝 Próximos Passos

1. **Teste o fluxo** com o arquivo HTML
2. **Integre o serviço** no sistema existente
3. **Configure permissões** específicas conforme necessário
4. **Implemente a tela** de alteração de senha obrigatória
5. **Teste o login** e alteração de senha

## 🎉 Resultado Final

Após implementar este fluxo:
- ✅ Funcionários são criados automaticamente com credenciais
- ✅ Sistema força alteração de senha no primeiro login
- ✅ Permissões são aplicadas corretamente
- ✅ Integração completa com sistema multitenant
- ✅ Auditoria e logs detalhados
- ✅ Segurança e validações adequadas