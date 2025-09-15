# 🔧 Guia de Debug Rápido - Transações

## 🚀 **Teste Imediato no Console**

1. **Abra o Console do Navegador** (F12 → Console)
2. **Execute este comando:**

```javascript
debugTransactions()
```

## 📊 **O que o comando faz:**

✅ **Verifica últimas 10 transações no banco**
✅ **Lista transações de hoje**  
✅ **Calcula totais por método de pagamento**
✅ **Mostra sessões de caixa ativas**
✅ **Lista comandas pendentes**

## 🧪 **Se não houver transações, crie uma de teste:**

```javascript
createTestTransaction()
```

Isso criará uma transação de R$ 50,00 em dinheiro para teste.

## 📋 **Resultados Esperados:**

### **✅ Cenário Normal:**
```
📊 Últimas 10 transações no banco: 5
📅 Transações de hoje (2025-01-14): 3
💰 Totais por método de pagamento: {
  dinheiro: { valor: 150, quantidade: 2 },
  pix: { valor: 75, quantidade: 1 }
}
🏦 Sessões de caixa de hoje: 1
```

### **❌ Problema Identificado:**
```
📊 Últimas 10 transações no banco: 0
📅 Transações de hoje: 0
💰 Totais por método de pagamento: {}
🏦 Sessões de caixa de hoje: 0
```

## 🔧 **Soluções por Cenário:**

### **Cenário 1: Sem transações no banco**
- Execute `createTestTransaction()` 
- Processe um pagamento real
- Verifique se o Supabase está conectado

### **Cenário 2: Transações existem mas não aparecem**
- Problema na consulta ou filtros
- Verificar campo de data (created_at vs processed_at)
- Verificar timezone

### **Cenário 3: Transações aparecem mas totais zerados**
- Problema no cálculo dos totais
- Verificar estrutura dos dados
- Verificar tipos de transação

## 🎯 **Após o teste, me informe:**

1. **Quantas transações foram encontradas?**
2. **Há transações de hoje?**
3. **Os totais por método aparecem?**
4. **Algum erro no console?**

Com essas informações, posso identificar exatamente o problema! 🚀