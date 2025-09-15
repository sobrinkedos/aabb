# 🔧 Correção: Exibição do Número do Pedido nas Transações

## 📋 **Problema Identificado**
As transações de caixa estavam exibindo apenas "Venda" em vez de mostrar o número da comanda/pedido associado, dificultando a identificação das transações.

## 🔍 **Causa Raiz**
O problema estava no hook `useCashManagement.ts` onde:

1. **Consulta incompleta**: A primeira consulta de transações não incluía as relações com `comandas` e `profiles`
2. **Processamento incorreto**: Os dados das relações não estavam sendo mapeados corretamente

## ✅ **Correções Implementadas**

### 1. **Consulta de Transações Corrigida**
**Arquivo:** `src/hooks/useCashManagement.ts` (linhas 117-125)

**❌ Antes:**
```typescript
const { data: transactionsData, error: transactionsError } = await (supabase as any)
  .from('cash_transactions')
  .select('*')  // ← Não incluía relações
  .gte('processed_at', `${today}T00:00:00.000Z`)
```

**✅ Depois:**
```typescript
const { data: transactionsData, error: transactionsError } = await (supabase as any)
  .from('cash_transactions')
  .select(`
    *,
    comandas(id, customer_name, table_id, total),
    profiles!cash_transactions_processed_by_fkey(id, name),
    cash_sessions(id, session_date, employee_id)
  `)  // ← Agora inclui todas as relações necessárias
  .gte('processed_at', `${today}T00:00:00.000Z`)
```

### 2. **Processamento de Dados Corrigido**
**Arquivo:** `src/hooks/useCashManagement.ts` (linhas 165-169)

**❌ Antes:**
```typescript
const todaysTransactions: CashTransactionWithDetails[] = transactionsData?.map((transaction: any) => ({
  ...transaction,
  comanda: undefined,  // ← Sempre undefined
  processed_by_employee: { id: user.id, name: user.email || 'Usuário' },
  session: undefined   // ← Sempre undefined
})) || [];
```

**✅ Depois:**
```typescript
const todaysTransactions: CashTransactionWithDetails[] = transactionsData?.map((transaction: any) => ({
  ...transaction,
  comanda: transaction.comandas || undefined,  // ← Usa dados reais da relação
  processed_by_employee: transaction.profiles || { id: user.id, name: user.email || 'Usuário' },
  session: transaction.cash_sessions || undefined  // ← Usa dados reais da relação
})) || [];
```

## 🎯 **Resultado**

### ✅ **Agora as transações exibem:**
- **Número da comanda**: "Comanda #4171" em vez de apenas "Venda"
- **Nome do cliente**: Quando disponível
- **Mesa**: "Mesa 5" ou "Balcão" quando aplicável
- **Funcionário responsável**: Nome real do funcionário

### 📍 **Locais onde a correção se aplica:**
1. **Dashboard de Caixa** - Movimentação diária
2. **Relatório de Movimento** - Transações detalhadas
3. **Histórico de Transações** - Todas as consultas

## 🔄 **Fluxo Corrigido**

1. **Pagamento processado** → Transação criada com `comanda_id`
2. **Consulta de transações** → Inclui relação com `comandas`
3. **Processamento dos dados** → Mapeia `comandas` para `comanda`
4. **Exibição na interface** → Mostra "Comanda #4171" com detalhes

## 🧪 **Como Testar**

1. Processe um pagamento de comanda
2. Verifique no Dashboard de Caixa → Movimentação do Dia
3. Confirme que aparece "Comanda #XXXX" em vez de apenas "Venda"
4. Verifique se mostra nome do cliente e mesa quando disponível

## 📝 **Componentes que Já Estavam Corretos**

Os seguintes componentes já tinham a lógica correta para exibir o número da comanda:
- ✅ `DailyTransactions.tsx` - Linha 251-255
- ✅ `DailyCashMovement.tsx` - Linha 371-385
- ✅ `ProcessComandaPaymentModal.tsx` - Usa `getComandaNumber()`

O problema estava apenas na fonte dos dados (hook), não na apresentação.

## 🎉 **Benefícios**

- ✅ **Rastreabilidade melhorada** - Fácil identificação das transações
- ✅ **Experiência do usuário** - Informações mais claras e úteis
- ✅ **Auditoria facilitada** - Conexão clara entre comandas e pagamentos
- ✅ **Consistência** - Mesmo padrão em toda a aplicação