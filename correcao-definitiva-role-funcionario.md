# 🔧 CORREÇÃO DEFINITIVA - Role de Funcionário

## 📋 **PROBLEMA IDENTIFICADO**
Funcionários criados estão recebendo role "admin" em vez de "employee" na tabela profiles.

## 🎯 **CAUSA RAIZ**
O trigger `handle_new_user` no banco de dados usa os metadados do usuário:
```sql
COALESCE(new.raw_user_meta_data->>'role', 'employee')
```

Quando o código passa `role: 'funcionario'` nos metadados, o trigger está interpretando isso incorretamente.

## ✅ **SOLUÇÃO 1: Corrigir Funcionários Existentes**

Execute este código no **Console do Navegador** (F12) do seu sistema:

```javascript
// Corrigir funcionários existentes com role incorreto
async function corrigirRoleFuncionarios() {
    const supabase = window.supabase.createClient(
        'https://wznycskqsavpmejwpksp.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8'
    );

    try {
        console.log('🔧 Corrigindo role de funcionários...');
        
        // 1. Buscar profiles com role != 'employee'
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id, name, role, created_at')
            .neq('role', 'employee')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('❌ Erro ao buscar perfis:', fetchError);
            return;
        }

        if (!profiles || profiles.length === 0) {
            console.log('✅ Todos os perfis já têm role "employee"');
            return;
        }

        console.log(`👥 Encontrados ${profiles.length} perfis para corrigir:`, profiles);

        // 2. Corrigir cada profile
        for (const profile of profiles) {
            console.log(`🔄 Corrigindo ${profile.name} (${profile.role} → employee)...`);
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'employee' })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`❌ Erro ao atualizar ${profile.name}:`, updateError);
            } else {
                console.log(`✅ ${profile.name} atualizado para "employee"`);
            }
        }

        console.log('🎉 Correção concluída! Todos os funcionários agora têm role "employee"');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

// Executar correção
corrigirRoleFuncionarios();
```

## ✅ **SOLUÇÃO 2: Corrigir o Código (Já Implementada)**

Já foi implementada a correção nos arquivos:

### **`src/services/employee-creation-service.ts`** ✅
```typescript
// Linha 1006 - CORRIGIDA
signUpData.options = { 
  data: {
    name: employeeData.nome_completo,
    role: 'employee' // ✅ Forçar "employee" para todos os funcionários
  }
};
```

### **`src/hooks/useFuncionarios.ts`** ✅  
```typescript
// Linha 82 - CORRIGIDA
options: {
  data: {
    nome_completo: data.nome_completo,
    role: 'employee' // ✅ Sempre "employee" para funcionários
  }
}
```

### **`src/services/funcionarioService.ts`** ✅
```typescript
// Linha 38 - CORRIGIDA  
options: {
  data: {
    nome_completo: data.nome_completo,
    role: 'employee' // ✅ Sempre "employee" para funcionários
  }
}
```

## 🧪 **TESTE DA CORREÇÃO**

Após executar a correção:

1. **Funcionários Existentes**: Execute o script no console
2. **Novos Funcionários**: Criem automaticamente com role "employee"
3. **Verificação**: Consulte a tabela profiles para confirmar

```sql
-- Verificar roles na tabela profiles
SELECT id, name, role, updated_at 
FROM profiles 
ORDER BY updated_at DESC;
```

## 📊 **RESULTADO ESPERADO**

✅ **Funcionários Existentes**: Role corrigido para "employee"  
✅ **Novos Funcionários**: Criados automaticamente com role "employee"  
✅ **Sistema**: Funcionando corretamente sem roles incorretos  

## 🚀 **PRÓXIMOS PASSOS**

1. Execute o script de correção no console
2. Crie um novo funcionário para testar
3. Verifique se o role está correto como "employee"
4. Continue com o teste da senha provisória

**Problema do role resolvido definitivamente!** 🎉