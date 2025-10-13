# 🔧 Correção: Vínculo de Credenciais com Funcionário

## 🎯 Problema Identificado

Quando um funcionário era criado e depois recebia credenciais, o sistema não estava vinculando corretamente:
- ✅ Usuário criado no Auth
- ✅ Funcionário criado em `employees`
- ❌ `profile_id` não era atualizado em `employees`
- ❌ Registro não era criado em `usuarios_empresa`

## 🔍 Caso Específico: Marcos

### Situação Encontrada:
```sql
employees:
- id: c5a111a6-f540-4bb2-b997-76eff7f33bad
- name: Marcos
- email: marcos@teste.com
- profile_id: NULL ❌

auth.users:
- id: e1e85521-8097-45fc-a735-9872690edd0e
- email: marcos@teste.com
✅ Existe

usuarios_empresa:
❌ Não existia
```

### Correção Aplicada via MCP:

#### 1. Atualizar profile_id
```sql
UPDATE employees
SET profile_id = 'e1e85521-8097-45fc-a735-9872690edd0e'
WHERE id = 'c5a111a6-f540-4bb2-b997-76eff7f33bad';
```

#### 2. Criar registro em usuarios_empresa
```sql
INSERT INTO usuarios_empresa (
  user_id,
  empresa_id,
  nome_completo,
  email,
  tipo_usuario,
  cargo,
  status,
  ativo,
  tem_acesso_sistema
) VALUES (
  'e1e85521-8097-45fc-a735-9872690edd0e',
  '573be0aa-0693-4a75-8beb-d3f86c8a2e8c',
  'Marcos',
  'marcos@teste.com',
  'funcionario',
  'Garçom',
  'ativo',
  true,
  true
);
```

#### 3. Resultado:
```
✅ profile_id vinculado
✅ usuarios_empresa criado (ID: acf6579f-bd7d-44a2-aa75-fa1ee1a319c1)
✅ 5 permissões configuradas
✅ Sistema agora reconhece que o funcionário tem credenciais
```

## 🛠️ Correção no Código

O problema está no arquivo `src/hooks/useBasicEmployeeCreation.ts` na função `addCredentialsToEmployee`.

### O que deve ser corrigido:

1. **Após criar usuário no Auth**, atualizar `profile_id` em `employees`:
```typescript
// Após criar usuário no Auth
const userId = authData.user?.id;

// ADICIONAR: Atualizar profile_id no employee
const { error: updateError } = await supabase
  .from("employees")
  .update({ profile_id: userId })
  .eq('id', employeeId);

if (updateError) {
  console.error('Erro ao atualizar profile_id:', updateError);
}
```

2. **Garantir criação em usuarios_empresa** mesmo se já existir:
```typescript
// Verificar se já existe
const { data: existingUsuarioEmpresa } = await supabase
  .from("usuarios_empresa")
  .select('id, status')
  .eq('user_id', userId)
  .eq('empresa_id', empresaId)
  .maybeSingle();

if (!existingUsuarioEmpresa) {
  // Criar novo
  const { data: newData, error } = await supabase
    .from("usuarios_empresa")
    .insert({
      user_id: userId,
      empresa_id: empresaId,
      nome_completo: employeeData.name,
      email: employeeData.email,
      tipo_usuario: 'funcionario',
      cargo: 'Funcionário',
      status: 'ativo',
      ativo: true,
      tem_acesso_sistema: true
    })
    .select('id')
    .single();
    
  if (error) throw error;
}
```

## ✅ Status Atual

- ✅ Marcos corrigido manualmente via MCP
- ✅ Agora pode editar credenciais
- ✅ Sistema reconhece que tem acesso
- ⚠️ Código precisa ser corrigido para próximos funcionários

## 📋 Próximos Passos

1. Corrigir `useBasicEmployeeCreation.ts`
2. Adicionar validação após criar credenciais
3. Testar com novo funcionário
4. Documentar fluxo correto

## 🔍 Como Verificar se um Funcionário Está Correto

```sql
SELECT 
  e.id as employee_id,
  e.name,
  e.email,
  e.profile_id,
  ue.id as usuario_empresa_id,
  ue.tem_acesso_sistema,
  COUNT(pu.id) as permissoes_count
FROM employees e
LEFT JOIN usuarios_empresa ue ON ue.user_id = e.profile_id
LEFT JOIN permissoes_usuario pu ON pu.usuario_empresa_id = ue.id
WHERE e.name = 'NOME_DO_FUNCIONARIO'
GROUP BY e.id, e.name, e.email, e.profile_id, ue.id, ue.tem_acesso_sistema;
```

**Resultado esperado:**
- `profile_id`: NOT NULL
- `usuario_empresa_id`: NOT NULL
- `tem_acesso_sistema`: true
- `permissoes_count`: > 0

---

**Data:** 09/01/2025  
**Status:** ✅ Correção Manual Aplicada  
**Próximo:** Corrigir código para automatizar
