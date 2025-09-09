# Sistema de Impressão em Duas Etapas - Balcão

## Visão Geral

O sistema foi modificado para implementar um fluxo de impressão em duas etapas para pedidos de balcão:

1. **No Balcão**: Impressão do pedido (sem pagamento) para o cliente levar ao caixa
2. **No Caixa**: Impressão do comprovante de pagamento após processamento

## Fluxo Completo

### 1. Atendimento no Balcão

**Componente**: [`BalcaoView`](./src/pages/BarAttendance/components/BalcaoView.tsx)

1. O bartender seleciona itens do menu
2. Pode identificar um membro para aplicar desconto (10%)
3. Adiciona observações se necessário
4. Clica em "Criar Pedido e Imprimir"
5. O sistema:
   - Cria um pedido com status `pending_payment`
   - Exibe modal com preview do pedido
   - Imprime automaticamente o **OrderReceipt**

**Primeira Impressão**: [`OrderReceipt`](./src/pages/BarAttendance/components/OrderReceipt.tsx)
- Contém informações do pedido
- Lista de itens com quantidades e preços
- Total a pagar
- **Não contém informações de pagamento**
- Aviso: "PEDIDO AGUARDANDO PAGAMENTO"

### 2. Pagamento no Caixa

**Componente**: [`DashboardOverview`](./src/pages/CashManagement/components/DashboardOverview.tsx)

1. O operador do caixa vê pedidos pendentes na seção "Pedidos de Balcão Aguardando Pagamento"
2. Clica em "Receber Pagamento" no pedido
3. Seleciona método de pagamento
4. Confirma o pagamento
5. O sistema:
   - Processa o pagamento
   - Atualiza status do pedido para `paid`
   - Registra transação no caixa
   - Exibe modal com preview do comprovante
   - Imprime automaticamente o **PaymentReceipt**

**Segunda Impressão**: [`PaymentReceipt`](./src/pages/BarAttendance/components/PaymentReceipt.tsx)
- Contém informações completas do pedido
- Detalhes do pagamento processado
- Método de pagamento usado
- Data/hora do pagamento
- Nome do operador do caixa
- Status: "PAGAMENTO APROVADO"

## Componentes Criados/Modificados

### Novos Componentes

1. **OrderReceipt.tsx**
   - Comprovante de pedido (primeira impressão)
   - Mostra itens e total sem informações de pagamento
   - Usado no balcão

2. **PaymentReceipt.tsx**
   - Comprovante de pagamento (segunda impressão)
   - Mostra informações completas incluindo pagamento
   - Usado no caixa

### Componentes Modificados

1. **BalcaoView.tsx**
   - Removido sistema de pagamento direto
   - Implementado sistema de pedidos pendentes
   - Integrado com OrderReceipt

2. **DashboardOverview.tsx**
   - Adicionado modal de comprovante de pagamento
   - Integrado com PaymentReceipt
   - Modificado fluxo de processamento

## Características dos Comprovantes

### OrderReceipt (Primeira Impressão)
- **Título**: "PEDIDO DE BALCÃO"
- **Conteúdo**:
  - Informações do estabelecimento
  - Número do pedido
  - Data/hora do pedido
  - Nome do atendente
  - Dados do cliente (se identificado)
  - Lista de itens com quantidades e preços
  - Subtotal, desconto e total
  - Observações do pedido/cliente
- **Destaque**: "PEDIDO AGUARDANDO PAGAMENTO"
- **Instrução**: "Dirija-se ao caixa para efetuar o pagamento"

### PaymentReceipt (Segunda Impressão)
- **Título**: "COMPROVANTE DE PAGAMENTO"
- **Conteúdo**:
  - Informações do estabelecimento
  - Número do pedido
  - Data/hora do pedido e do pagamento
  - Nome do atendente e operador do caixa
  - Dados do cliente (se identificado)
  - Lista de itens vendidos
  - Subtotal, desconto e total pago
  - Informações detalhadas do pagamento
  - Método de pagamento
  - Número de referência (se aplicável)
- **Destaque**: "PAGAMENTO APROVADO"
- **Extras**: Pontos de fidelidade acumulados

## Integração com Sistema Existente

### Hooks Utilizados
- `useBalcaoOrders`: Para criar pedidos pendentes
- `useCashManagement`: Para processar pagamentos
- `useAuth`: Para identificar funcionários

### Banco de Dados
- Tabela `balcao_orders`: Status `pending_payment` → `paid`
- Tabela `cash_transactions`: Registro da transação
- Tabela `cash_sessions`: Vinculação com sessão de caixa

## Vantagens do Sistema

1. **Separação de Responsabilidades**
   - Balcão: Focado na criação do pedido
   - Caixa: Focado no processamento de pagamento

2. **Controle Financeiro**
   - Todos pagamentos passam pelo sistema de caixa
   - Auditoria completa das transações
   - Sessões de caixa controladas

3. **Experiência do Cliente**
   - Recebe comprovante do pedido imediatamente
   - Pode acompanhar status do pedido
   - Comprovante final completo após pagamento

4. **Flexibilidade**
   - Pedidos podem ser preparados antes do pagamento
   - Permite modificações no sistema de pagamento
   - Facilita implementação de novos métodos de pagamento

## Configuração

Para ativar o sistema de duas impressões:

1. Certifique-se de que as tabelas de balcão estão criadas
2. Configure impressoras no sistema
3. Treine funcionários no novo fluxo
4. Configure métodos de pagamento disponíveis

## Próximos Passos

1. Implementar sistema de notificações entre balcão e caixa
2. Adicionar relatórios específicos para pedidos de balcão
3. Integrar com sistema de fila de pedidos na cozinha
4. Implementar sistema de códigos QR nos comprovantes