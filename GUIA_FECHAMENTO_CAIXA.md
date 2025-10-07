# 📘 Guia Completo: Como Fazer o Fechamento de Caixa

## 🎯 Visão Geral

O fechamento de caixa é o processo de encerrar uma sessão de trabalho, conferir os valores recebidos e registrar todas as informações para auditoria e controle financeiro.

---

## 📋 Pré-requisitos

Antes de iniciar o fechamento:

✅ **Sessão de caixa aberta** - Você deve ter uma sessão ativa  
✅ **Todas as comandas fechadas** - Não deve haver comandas pendentes de pagamento  
✅ **Pedidos entregues** - Todos os pedidos devem estar entregues  
✅ **Dinheiro contado** - Tenha o valor físico contado por método de pagamento

---

## 🔄 Fluxo Completo de Fechamento

### **Passo 1: Acessar o Fechamento**

1. Acesse o módulo **Gestão de Caixa**
2. Clique no botão **"Fechar Caixa"**
3. O sistema abrirá o modal de fechamento aprimorado

**Resultado Esperado:**
```
✅ Modal aberto com 3 abas
✅ Dados da sessão carregados
✅ Valores esperados calculados automaticamente
```

---

### **Passo 2: Aba 1 - Reconciliação por Método de Pagamento**

Esta é a aba principal onde você informa os valores reais contados.

#### **O que você verá:**

```
┌─────────────────────────────────────────────────────────┐
│ Resumo da Sessão                                        │
├─────────────────────────────────────────────────────────┤
│ Abertura: R$ 100,00                                     │
│ Esperado: R$ 1.450,00                                   │
│ Contado:  R$ 1.445,00                                   │
│ Discrepância: R$ 5,00 (Falta) ⚠️                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Reconciliação por Método de Pagamento                  │
├──────────┬──────────┬──────────┬────────┬──────────────┤
│ Método   │ Esperado │ Real     │ Trans. │ Discrepância │
├──────────┼──────────┼──────────┼────────┼──────────────┤
│ 💵 Dinheiro        │ R$ 450,00│ [____] │   15   │              │
│ 💳 Cartão Débito   │ R$ 300,00│ [____] │    8   │              │
│ 💳 Cartão Crédito  │ R$ 500,00│ [____] │   12   │              │
│ 📱 PIX             │ R$ 200,00│ [____] │    5   │              │
│ 🏦 Transferência   │ R$   0,00│ [____] │    0   │              │
└──────────┴──────────┴──────────┴────────┴──────────────┘
```

#### **O que fazer:**

1. **Conte o dinheiro físico** de cada método
2. **Digite os valores reais** nos campos "Real"
3. O sistema calcula automaticamente:
   - Discrepância por método
   - Percentual de diferença
   - Total geral

#### **Resultado Esperado:**

```
✅ Valores digitados em todos os campos
✅ Discrepâncias calculadas automaticamente
✅ Status visual (Exato/Sobra/Falta) para cada método
✅ Total geral atualizado em tempo real
```

**Exemplo de Preenchimento:**
```
Dinheiro:     R$ 450,00 → R$ 448,00 (Falta R$ 2,00) 🔴
Cartão Débito: R$ 300,00 → R$ 300,00 (Exato) ✅
Cartão Crédito: R$ 500,00 → R$ 500,00 (Exato) ✅
PIX:          R$ 200,00 → R$ 197,00 (Falta R$ 3,00) 🔴
Transferência: R$   0,00 → R$   0,00 (Exato) ✅
```

---

### **Passo 3: Aba 2 - Transferência para Tesouraria (Opcional)**

Use esta aba se você transferiu dinheiro do caixa para o cofre/banco/tesouraria.

#### **O que você verá:**

```
┌─────────────────────────────────────────────────────────┐
│ 💰 Transferência para Tesouraria                        │
├─────────────────────────────────────────────────────────┤
│ [ ] Registrar transferência                             │
└─────────────────────────────────────────────────────────┘
```

#### **O que fazer:**

1. **Ative o switch** "Registrar transferência"
2. Preencha os campos:
   - **Valor a Transferir:** R$ 1.000,00
   - **Destino:** Cofre / Banco / Tesouraria Central
   - **Responsável:** Nome de quem recebeu
   - **Nº Comprovante:** COMP-2025-001 (opcional)
   - **Observações:** Detalhes adicionais

#### **Resultado Esperado:**

```
✅ Formulário habilitado
✅ Saldo restante calculado automaticamente
✅ Validação: valor não pode exceder saldo do caixa
✅ Alerta de confirmação exibido
```

**Exemplo:**
```
Saldo do Caixa:    R$ 1.445,00
Valor a Transferir: R$ 1.000,00
Saldo Restante:    R$   445,00 ✅
```

---

### **Passo 4: Aba 3 - Tratamento de Discrepância**

Esta aba aparece automaticamente se houver diferença entre esperado e contado.

#### **Cenário 1: Discrepância < R$ 5,00** 🟢

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Discrepância Aceitável                               │
├─────────────────────────────────────────────────────────┤
│ Valor: R$ 3,50 (Falta)                                  │
│ Nível: BAIXA                                            │
│                                                         │
│ A diferença está dentro do limite aceitável.           │
│ Você pode aceitar automaticamente.                     │
└─────────────────────────────────────────────────────────┘

Motivo da Discrepância: [_________________________]
Ação Tomada: [Aceitar Discrepância ▼]
```

**O que fazer:**
1. Informe o motivo (ex: "Troco aproximado")
2. Selecione "Aceitar Discrepância"
3. Clique em "Fechar Caixa"

**Resultado:** ✅ Fechamento aprovado automaticamente

---

#### **Cenário 2: Discrepância R$ 5,00 - R$ 50,00** 🟡

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Justificativa Necessária                             │
├─────────────────────────────────────────────────────────┤
│ Valor: R$ 25,00 (Falta)                                 │
│ Nível: MÉDIA                                            │
│                                                         │
│ Por favor, informe o motivo da discrepância.           │
└─────────────────────────────────────────────────────────┘

Motivo da Discrepância: [_________________________]
                        (Obrigatório - mín. 5 caracteres)

Ação Tomada: [Abrir Investigação ▼]
             • Aceitar Discrepância
             • Abrir Investigação
             • Realizar Ajuste
             • Pendente de Análise

Notas de Resolução: [_________________________]
```

**O que fazer:**
1. **Obrigatório:** Descreva detalhadamente o motivo
2. Escolha a ação apropriada:
   - **Aceitar:** Se você identificou e aceita a diferença
   - **Investigar:** Se precisa apurar mais
   - **Ajustar:** Se vai corrigir o valor
   - **Pendente:** Se vai resolver depois
3. Adicione notas de resolução
4. Clique em "Fechar Caixa"

**Resultado:** ✅ Fechamento aprovado com justificativa registrada

---

#### **Cenário 3: Discrepância > R$ 50,00** 🔴

```
┌─────────────────────────────────────────────────────────┐
│ 🚨 Aprovação de Supervisor Necessária                   │
├─────────────────────────────────────────────────────────┤
│ Valor: R$ 75,00 (Falta)                                 │
│ Nível: ALTA                                             │
│                                                         │
│ A discrepância excede R$ 50,00.                        │
│ É necessária a aprovação de um supervisor.             │
└─────────────────────────────────────────────────────────┘

Motivo da Discrepância: [_________________________]
                        (Obrigatório)

Ação Tomada: [Abrir Investigação ▼]

ID do Supervisor Aprovador: [_________________________]
                            (Obrigatório)

Notas de Resolução: [_________________________]
```

**O que fazer:**
1. **Obrigatório:** Descreva o motivo detalhadamente
2. Escolha a ação
3. **Obrigatório:** Informe o ID do supervisor que aprovou
4. Adicione notas de resolução
5. Clique em "Fechar com Aprovação"

**Resultado:** ✅ Fechamento aprovado com autorização de supervisor

---

### **Passo 5: Finalizar Fechamento**

Após preencher todas as informações necessárias:

1. Revise todos os dados nas 3 abas
2. Clique no botão:
   - **"Fechar Caixa"** (sem discrepância ou discrepância baixa)
   - **"Fechar com Aprovação"** (discrepância alta)

#### **Resultado Esperado:**

```
✅ Processamento iniciado
✅ Validações executadas
✅ Sessão fechada no banco de dados
✅ Reconciliação registrada
✅ Transferência registrada (se houver)
✅ Discrepância registrada (se houver)
✅ Comprovante gerado automaticamente
✅ Auditoria registrada

🎉 Sucesso!
Comprovante: FECH-20250207-0001
```

---

## 📄 Comprovante Gerado

Após o fechamento bem-sucedido, o sistema gera automaticamente um comprovante com:

```
╔═══════════════════════════════════════════════════════╗
║        COMPROVANTE DE FECHAMENTO DE CAIXA            ║
╠═══════════════════════════════════════════════════════╣
║ Número: FECH-20250207-0001                           ║
║ Data: 07/02/2025  Hora: 18:30                        ║
║ Funcionário: João Silva                              ║
╠═══════════════════════════════════════════════════════╣
║ RESUMO DA SESSÃO                                     ║
║ Abertura:    R$   100,00                             ║
║ Esperado:    R$ 1.450,00                             ║
║ Contado:     R$ 1.445,00                             ║
║ Discrepância: R$    5,00 (Falta)                     ║
╠═══════════════════════════════════════════════════════╣
║ BREAKDOWN POR MÉTODO                                 ║
║ 💵 Dinheiro:     R$ 448,00 (Esp: R$ 450,00) -R$ 2,00 ║
║ 💳 C. Débito:    R$ 300,00 (Esp: R$ 300,00)  Exato   ║
║ 💳 C. Crédito:   R$ 500,00 (Esp: R$ 500,00)  Exato   ║
║ 📱 PIX:          R$ 197,00 (Esp: R$ 200,00) -R$ 3,00 ║
║ 🏦 Transferência: R$   0,00 (Esp: R$   0,00)  Exato   ║
╠═══════════════════════════════════════════════════════╣
║ TRANSFERÊNCIA PARA TESOURARIA                        ║
║ Valor: R$ 1.000,00                                   ║
║ Destino: Cofre                                       ║
║ Recebido por: Maria Santos                          ║
║ Comprovante: COMP-2025-001                           ║
╠═══════════════════════════════════════════════════════╣
║ TRATAMENTO DE DISCREPÂNCIA                           ║
║ Motivo: Troco aproximado em vendas                  ║
║ Ação: Aceitar Discrepância                          ║
╠═══════════════════════════════════════════════════════╣
║ Gerado em: 07/02/2025 18:30:45                      ║
║                                                      ║
║ _____________________  _____________________         ║
║ Assinatura Operador    Assinatura Supervisor        ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 Resultados Esperados por Cenário

### **Cenário 1: Fechamento Perfeito** ✅

**Entrada:**
- Todos os valores conferem
- Sem discrepância
- Sem transferência

**Resultado:**
```
✅ Fechamento em 5 segundos
✅ Comprovante gerado: FECH-20250207-0001
✅ Status: Fechado
✅ Discrepância: R$ 0,00
✅ Auditoria: Risco BAIXO
```

---

### **Cenário 2: Fechamento com Discrepância Pequena** ⚠️

**Entrada:**
- Discrepância de R$ 3,50
- Motivo informado
- Ação: Aceitar

**Resultado:**
```
✅ Fechamento em 6 segundos
✅ Comprovante gerado: FECH-20250207-0002
✅ Status: Fechado
✅ Discrepância: R$ 3,50 (Aceita)
✅ Auditoria: Risco BAIXO
✅ Registro de discrepância criado
```

---

### **Cenário 3: Fechamento com Transferência** 💰

**Entrada:**
- Valores conferem
- Transferência de R$ 1.000,00 para cofre

**Resultado:**
```
✅ Fechamento em 7 segundos
✅ Comprovante gerado: FECH-20250207-0003
✅ Status: Fechado
✅ Transferência registrada: R$ 1.000,00
✅ Auditoria: Risco MÉDIO (valor alto)
✅ Registro de transferência criado
```

---

### **Cenário 4: Fechamento com Aprovação** 🚨

**Entrada:**
- Discrepância de R$ 75,00
- Motivo detalhado
- Aprovação de supervisor
- Ação: Investigar

**Resultado:**
```
✅ Fechamento em 8 segundos
✅ Comprovante gerado: FECH-20250207-0004
✅ Status: Fechado (Com Aprovação)
✅ Discrepância: R$ 75,00 (Em Investigação)
✅ Aprovado por: Supervisor ID
✅ Auditoria: Risco ALTO
✅ Registro de discrepância criado
✅ Notificação enviada para gerência
```

---

## ❌ Erros Comuns e Soluções

### **Erro 1: "Validação falhou"**
```
❌ Erro: Sessão já está fechada
```
**Solução:** A sessão já foi fechada. Abra uma nova sessão.

---

### **Erro 2: "Discrepância requer aprovação"**
```
❌ Erro: Discrepância requer aprovação de supervisor
```
**Solução:** Vá para a aba "Discrepância" e informe o ID do supervisor.

---

### **Erro 3: "Valor inválido"**
```
❌ Erro: O valor da transferência não pode ser maior que o saldo
```
**Solução:** Reduza o valor da transferência ou corrija os valores contados.

---

### **Erro 4: "Motivo obrigatório"**
```
❌ Erro: A justificativa deve ter pelo menos 5 caracteres
```
**Solução:** Descreva detalhadamente o motivo da discrepância.

---

## 📊 Dados Salvos no Banco

Após o fechamento, os seguintes dados são salvos:

### **Tabela: cash_sessions**
```sql
status: 'closed'
closed_at: '2025-02-07 18:30:00'
closing_amount: 1445.00
cash_discrepancy: -5.00
closing_notes: 'Fechamento normal'
supervisor_approval_id: NULL (ou ID do supervisor)
```

### **Tabela: payment_reconciliation**
```sql
-- Um registro para cada método de pagamento
payment_method: 'dinheiro'
expected_amount: 450.00
actual_amount: 448.00
discrepancy: -2.00
transaction_count: 15
```

### **Tabela: treasury_transfers** (se houver)
```sql
amount: 1000.00
destination: 'cofre'
recipient_name: 'Maria Santos'
receipt_number: 'COMP-2025-001'
```

### **Tabela: discrepancy_handling** (se houver)
```sql
discrepancy_amount: -5.00
reason: 'Troco aproximado em vendas'
action_taken: 'accepted'
approved_by: NULL (ou ID do supervisor)
```

### **Tabela: cash_closing_receipts**
```sql
receipt_number: 'FECH-20250207-0001'
receipt_data: {...} -- JSON completo do comprovante
```

### **Tabela: cash_audit_enhanced**
```sql
action_type: 'close_session'
performed_by: 'user_id'
risk_level: 'low' / 'medium' / 'high'
new_values: {...} -- Todos os dados do fechamento
```

---

## ✅ Checklist de Fechamento

Antes de fechar o caixa, verifique:

- [ ] Todas as comandas estão fechadas
- [ ] Todos os pedidos foram entregues
- [ ] Dinheiro físico foi contado
- [ ] Valores digitados em todos os métodos
- [ ] Transferência registrada (se houver)
- [ ] Discrepância justificada (se houver)
- [ ] Aprovação de supervisor (se necessário)
- [ ] Comprovante gerado com sucesso

---

**Tempo Médio de Fechamento:** 5-10 minutos  
**Dificuldade:** ⭐⭐ Fácil  
**Suporte:** Em caso de dúvidas, consulte o supervisor
