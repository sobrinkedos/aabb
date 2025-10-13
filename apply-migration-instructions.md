# 🚀 Instruções para Aplicar Migração do Sistema de Caixa

## 📋 Passos para Aplicar a Migração

### 1. Acesse o Dashboard do Supabase
🔗 **URL:** https://supabase.com/dashboard/project/wznycskqsavpmejwpksp/sql

### 2. Copie e Execute o SQL
1. Abra o **SQL Editor** no dashboard
2. Copie TODO o conteúdo do arquivo: `supabase/migrations/20250908000001_cash_management_system.sql`
3. Cole no SQL Editor
4. Clique em **RUN** para executar

### 3. Verifique a Execução
Após executar, você deve ver:
- ✅ `cash_sessions` criada
- ✅ `cash_transactions` criada  
- ✅ `payment_reconciliation` criada
- ✅ `cash_audit_log` criada
- ✅ Triggers configurados
- ✅ RLS habilitado
- ✅ Views criadas

### 4. Teste a Migração
Execute este comando para verificar se as tabelas foram criadas:
```bash
node check-migration.js
```

## 🎯 O que a Migração Implementa

### 📊 Tabelas Principais
- **cash_sessions**: Sessões diárias de caixa
- **cash_transactions**: Transações financeiras
- **payment_reconciliation**: Reconciliação por método de pagamento
- **cash_audit_log**: Log de auditoria completo

### 🔧 Recursos Automáticos
- **Triggers**: Atualização automática de valores
- **RLS**: Segurança por nível de linha
- **Índices**: Performance otimizada
- **Views**: Relatórios pré-configurados

### 🔐 Segurança
- Funcionários só veem suas próprias sessões
- Admins/supervisores têm acesso total
- Log de auditoria completo
- Validações automáticas

## 🚨 Importante
Após aplicar a migração, os componentes React irão trocar automaticamente do `useCashManagementFallback` para o `useCashManagement` real.

## 🆘 Em Caso de Problemas
Se encontrar erros:
1. Verifique se a tabela `profiles` existe
2. Confirme se as colunas `id`, `name`, `role` existem em `profiles`
3. Execute linha por linha para identificar o problema específico