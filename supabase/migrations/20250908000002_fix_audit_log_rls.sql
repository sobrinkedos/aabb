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