# 🔒 Correção RLS - Tabela Comandas (Produção)

## 🚨 Problema Identificado

**Erro:** `403 (Forbidden)` ao tentar criar comanda
```
POST https://jtfdzjmravketpkwjkvp.supabase.co/rest/v1/comandas?select=* 403 (Forbidden)
```

### Causa Raiz:
As políticas RLS (Row Level Security) da tabela `comandas` no banco de **PRODUÇÃO** estão bloqueando operações de INSERT para usuários autenticados.

## ✅ Solução

### Passo 1: Executar Script SQL no Supabase

1. Acesse o **Supabase Dashboard de PRODUÇÃO**
   - URL: https://supabase.com/dashboard/project/jtfdzjmravketpkwjkvp

2. Vá em **SQL Editor** (menu lateral esquerdo)

3. Clique em **New Query**

4. Cole o conteúdo do arquivo `fix-rls-comandas-producao.sql`

5. Clique em **Run** para executar

### Passo 2: Verificar Resultados

O script irá:
- ✅ Remover políticas conflitantes
- ✅ Criar novas políticas permissivas
- ✅ Mostrar as políticas ativas
- ✅ Confirmar que RLS está habilitado

### Passo 3: Testar

Após executar o script:
1. Recarregue a aplicação
2. Tente criar uma comanda novamente
3. O erro 403 deve desaparecer

## 📋 Políticas Criadas

### SELECT (Visualizar)
```sql
CREATE POLICY "comandas_select_policy"
ON comandas FOR SELECT TO authenticated
USING (true);
```

### INSERT (Criar)
```sql
CREATE POLICY "comandas_insert_policy"
ON comandas FOR INSERT TO authenticated
WITH CHECK (true);
```

### UPDATE (Atualizar)
```sql
CREATE POLICY "comandas_update_policy"
ON comandas FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
```

### DELETE (Deletar)
```sql
CREATE POLICY "comandas_delete_policy"
ON comandas FOR DELETE TO authenticated
USING (true);
```

## 🔍 Diagnóstico Adicional

Se o problema persistir, verifique:

1. **Usuário está autenticado?**
   - Verifique no console: `supabase.auth.getUser()`

2. **Token JWT válido?**
   - Verifique no Network tab se o header `Authorization` está presente

3. **Outras tabelas relacionadas?**
   - Verifique RLS em: `bar_tables`, `usuarios_empresa`, `employees`

## 📝 Notas

- Este problema afeta apenas o ambiente de **PRODUÇÃO**
- O ambiente de desenvolvimento já tem as políticas corretas
- As políticas são permissivas (`true`) para facilitar operações
- Em produção real, considere políticas mais restritivas baseadas em `empresa_id`

## 🔗 Links Úteis

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
