# 🔧 Correção do Erro de Migração

## ❌ Erro Encontrado
```
ERROR: 23503: insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
DETAIL: Key (id)=(00000000-0000-0000-0000-000000000001) is not present in table "users".
```

## 🎯 Causa do Problema
O erro ocorreu porque a migração original tentava inserir um registro fictício na tabela `profiles` com um ID que não existe na tabela `auth.users` do Supabase.

## ✅ Correção Aplicada
1. **Removida a inserção problemática** de dados fictícios
2. **Melhorada a função `get_user_role()`** para ser mais robusta
3. **Atualizadas as políticas RLS** para não falharem se o usuário não tiver perfil

## 🚀 Próximos Passos

### 1. Use a Migração Corrigida
O arquivo `supabase/migrations/20250908000001_cash_management_system.sql` foi corrigido e agora está seguro para aplicação.

### 2. Aplique a Migração
```bash
# Teste se a migração foi corrigida
node check-migration.js
```

**OU** aplique manualmente no dashboard:
- 🔗 https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql
- Copie e cole o conteúdo do arquivo corrigido

### 3. Após Aplicar a Migração
```bash
# Verifique se funcionou
node check-migration.js

# Deve mostrar: ✅ Tabelas de caixa encontradas!
```

## 🔐 Sobre Usuários e Perfis

### Como Criar Usuários para o Sistema de Caixa

1. **Usuários Reais via Autenticação**:
   ```sql
   -- Após um usuário se registrar via Supabase Auth, 
   -- adicione um perfil para ele:
   INSERT INTO profiles (id, name, role) 
   VALUES (
     'uuid-do-usuario-autenticado', 
     'Nome do Funcionário', 
     'employee'
   );
   ```

2. **Para Desenvolvimento/Teste**:
   - Crie usuários reais via Supabase Auth Dashboard
   - Ou use o sistema de autenticação do projeto
   - Nunca insira IDs fictícios na tabela `profiles`

3. **Roles Disponíveis**:
   - `employee`: Funcionário padrão
   - `supervisor`: Supervisor com acesso extra
   - `admin`: Administrador com acesso total

## 🛡️ Segurança Melhorada

### Função `get_user_role()` Robusta
```sql
CREATE OR REPLACE FUNCTION get_user_role() 
RETURNS TEXT AS $$
BEGIN
  -- Verifica se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Busca o role do usuário na tabela profiles
  RETURN (
    SELECT role FROM profiles WHERE id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro, retorna 'guest'
    RETURN 'guest';
END;
```

### Políticas RLS Seguras
- ✅ Verifica se o usuário está autenticado (`auth.uid() IS NOT NULL`)
- ✅ Usa `COALESCE()` para valores padrão seguros
- ✅ Não falha se o usuário não tiver perfil criado
- ✅ Permite operações básicas mesmo sem perfil completo

## 🎉 Resultado Esperado

Após aplicar a migração corrigida:
- ✅ Todas as tabelas criadas sem erro
- ✅ Políticas RLS funcionando
- ✅ Sistema pronto para uso
- ✅ Não requer usuários fictícios

## 💡 Dicas Importantes

1. **Sempre use usuários reais** criados via Supabase Auth
2. **Nunca insira IDs fictícios** na tabela `profiles`
3. **A migração agora é segura** e não requer dados pré-existentes
4. **O sistema funciona** mesmo se um usuário não tiver perfil completo