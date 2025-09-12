# 🔧 Correção do Erro RLS: cash_audit_log

## 🚨 Problema Identificado
**Erro:** `new row violates row-level security policy for table "cash_audit_log"`

**Causa:** A tabela `cash_audit_log` tem apenas política de `SELECT`, mas os triggers automáticos tentam fazer `INSERT` de registros de auditoria, sendo bloqueados pelas políticas RLS.

## 🛠️ Solução

### 1. Acesse o Dashboard do Supabase
🔗 **URL:** https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql

### 2. Execute o SQL de Correção
Cole e execute o seguinte SQL no **SQL Editor**:

```sql
-- Fix RLS policy for cash_audit_log table
-- 
-- O problema: A tabela cash_audit_log só tem política de SELECT, mas os triggers
-- tentam fazer INSERT automático, resultando em violação de RLS.
-- 
-- Solução: Adicionar política de INSERT para permitir que triggers funcionem.

-- Adicionar política para permitir inserção de logs de auditoria
-- Os triggers precisam poder inserir registros automaticamente
CREATE POLICY "Sistema pode inserir logs de auditoria" ON cash_audit_log
  FOR INSERT WITH CHECK (
    -- Permitir inserções automáticas pelos triggers
    -- O performed_by deve ser um usuário válido
    performed_by IS NOT NULL AND (
      -- Verificar se o usuário executando a ação é o mesmo do log
      performed_by = auth.uid() OR
      -- Ou se é um admin/supervisor
      COALESCE(get_user_role(), 'guest') IN ('admin', 'supervisor')
    )
  );

-- Comentários para documentação
COMMENT ON POLICY "Sistema pode inserir logs de auditoria" ON cash_audit_log IS 
'Permite que o sistema insira logs de auditoria automaticamente através dos triggers. 
O performed_by deve ser o usuário atual ou um admin/supervisor.';
```

### 3. Verificar a Aplicação
Após executar o SQL:
1. Volte ao sistema de caixa
2. Tente abrir uma sessão de caixa
3. O erro deve ser resolvido

## 📋 O que Esta Correção Faz

- **Adiciona política de INSERT** para a tabela `cash_audit_log`
- **Permite que triggers funcionem** automaticamente 
- **Mantém a segurança** verificando se o usuário é válido
- **Habilita auditoria completa** das operações de caixa

## 🔐 Segurança Mantida

A política garante que:
- ✅ Apenas usuários autenticados podem gerar logs
- ✅ O `performed_by` deve ser o usuário atual ou admin/supervisor  
- ✅ Logs não podem ser inseridos por usuários não autorizados
- ✅ A auditoria funciona automaticamente via triggers

## 🚀 Próximos Passos

Após aplicar a correção:
1. **Teste a abertura de caixa** - deve funcionar sem erros
2. **Verifique os logs de auditoria** - devem ser criados automaticamente
3. **Teste o fechamento de caixa** - para validar todo o fluxo
4. **Monitore por outros erros** - caso apareçam problemas similares

## 💡 Observações Técnicas

- Esta correção é **segura** e não compromete a segurança
- Os triggers de auditoria são **essenciais** para o controle interno
- A política é **restritiva** mas permite funcionamento automático
- **Não afeta** outras tabelas ou funcionalidades

---

⚠️ **Importante:** Sempre teste em ambiente de desenvolvimento antes de aplicar em produção.