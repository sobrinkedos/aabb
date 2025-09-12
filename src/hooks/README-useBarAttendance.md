# Hook useBarAttendance

O `useBarAttendance` é um hook customizado que gerencia todo o estado e operações do sistema de atendimento do bar. Ele fornece uma interface completa para gerenciar mesas, comandas, pedidos e métricas em tempo real.

## Características Principais

- ✅ **Estado Global**: Gerencia mesas, comandas e métricas centralizadamente
- ✅ **Tempo Real**: Subscriptions automáticas para atualizações em tempo real
- ✅ **CRUD Completo**: Operações completas para comandas e itens
- ✅ **Gerenciamento de Mesas**: Controle de status e ocupação de mesas
- ✅ **Pedidos no Balcão**: Processamento rápido de pedidos diretos
- ✅ **Divisão de Contas**: Sistema flexível de divisão de contas
- ✅ **Métricas**: Acompanhamento de performance em tempo real
- ✅ **Tratamento de Erros**: Sistema robusto de tratamento de erros
- ✅ **Loading States**: Estados de carregamento para melhor UX

## Uso Básico

```typescript
import { useBarAttendance } from '../hooks/useBarAttendance';

const MeuComponente = () => {
  const {
    // Estado
    mesas,
    comandas,
    metricas,
    loading,
    error,
    
    // Funções
    criarComanda,
    adicionarItemComanda,
    fecharComanda,
    ocuparMesa,
    liberarMesa,
    processarPedidoBalcao
  } = useBarAttendance();

  // Usar as funções e estado conforme necessário
};
```

## API Completa

### Estado

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `mesas` | `TableWithComanda[]` | Lista de todas as mesas com comandas associadas |
| `comandas` | `ComandaWithItems[]` | Lista de comandas abertas com itens |
| `metricas` | `AttendanceMetrics \| null` | Métricas do funcionário atual |
| `notificacoes` | `BarNotification[]` | Notificações do sistema |
| `loading` | `boolean` | Estado de carregamento |
| `error` | `string \| null` | Mensagem de erro, se houver |

### Funções de CRUD para Comandas

#### `criarComanda(mesaId?, nomeCliente?, numeroPessoas?): Promise<string>`
Cria uma nova comanda.

```typescript
const comandaId = await criarComanda('mesa-1', 'João Silva', 4);
```

#### `atualizarComanda(comandaId, dados): Promise<void>`
Atualiza dados de uma comanda existente.

```typescript
await atualizarComanda('comanda-123', { 
  customer_name: 'Maria Silva',
  people_count: 3 
});
```

#### `fecharComanda(comandaId, metodoPagamento, observacoes?): Promise<void>`
Fecha uma comanda e processa o pagamento.

```typescript
await fecharComanda('comanda-123', 'cartao', 'Cliente satisfeito');
```

#### `adicionarItemComanda(comandaId, menuItemId, quantidade, observacoes?): Promise<void>`
Adiciona um item à comanda.

```typescript
await adicionarItemComanda('comanda-123', 'menu-item-1', 2, 'Sem gelo');
```

#### `removerItemComanda(itemId): Promise<void>`
Remove um item da comanda.

```typescript
await removerItemComanda('item-456');
```

#### `atualizarStatusItem(itemId, status): Promise<void>`
Atualiza o status de um item da comanda.

```typescript
await atualizarStatusItem('item-456', 'ready');
```

### Funções de Gerenciamento de Mesas

#### `ocuparMesa(mesaId, comandaId?): Promise<void>`
Marca uma mesa como ocupada.

```typescript
await ocuparMesa('mesa-1', 'comanda-123');
```

#### `liberarMesa(mesaId): Promise<void>`
Libera uma mesa (marca como limpeza).

```typescript
await liberarMesa('mesa-1');
```

#### `reservarMesa(mesaId, nomeCliente, horario): Promise<void>`
Reserva uma mesa para um horário específico.

```typescript
await reservarMesa('mesa-1', 'João Silva', new Date('2025-01-01T19:00:00'));
```

#### `limparMesa(mesaId): Promise<void>`
Marca uma mesa como disponível após limpeza.

```typescript
await limparMesa('mesa-1');
```

#### `atualizarStatusMesa(mesaId, status): Promise<void>`
Atualiza o status de uma mesa.

```typescript
await atualizarStatusMesa('mesa-1', 'maintenance');
```

### Funções para Pedidos no Balcão

#### `processarPedidoBalcao(pedido): Promise<string>`
Processa um pedido do balcão (já pago).

```typescript
const pedido = {
  items: [
    {
      menu_item_id: 'menu-1',
      name: 'Cerveja',
      price: 8.50,
      quantity: 2
    }
  ],
  total: 17.00,
  payment_method: 'dinheiro'
};

const comandaId = await processarPedidoBalcao(pedido);
```

### Funções de Divisão de Conta

#### `dividirConta(comandaId, configuracao): Promise<void>`
Divide uma conta entre múltiplas pessoas.

```typescript
const configuracao = {
  type: 'equal',
  person_count: 2,
  splits: [
    {
      person_name: 'João',
      items: [],
      subtotal: 25.00,
      service_charge: 2.50,
      discount: 0,
      total: 27.50
    },
    {
      person_name: 'Maria',
      items: [],
      subtotal: 25.00,
      service_charge: 2.50,
      discount: 0,
      total: 27.50
    }
  ]
};

await dividirConta('comanda-123', configuracao);
```

### Funções de Métricas

#### `atualizarMetricas(): Promise<void>`
Atualiza as métricas do funcionário atual.

```typescript
await atualizarMetricas();
```

### Funções de Notificações

#### `marcarNotificacaoLida(notificacaoId): Promise<void>`
Marca uma notificação como lida.

```typescript
await marcarNotificacaoLida('notif-123');
```

#### `limparNotificacoes(): Promise<void>`
Remove todas as notificações.

```typescript
await limparNotificacoes();
```

### Funções de Utilidade

#### `recarregarDados(): Promise<void>`
Recarrega todos os dados do sistema.

```typescript
await recarregarDados();
```

#### `obterComandaPorMesa(mesaId): ComandaWithItems | undefined`
Busca a comanda ativa de uma mesa específica.

```typescript
const comanda = obterComandaPorMesa('mesa-1');
```

#### `obterMesaPorNumero(numero): TableWithComanda | undefined`
Busca uma mesa pelo número.

```typescript
const mesa = obterMesaPorNumero('1');
```

## Tipos de Status

### TableStatus
- `available`: Mesa disponível
- `occupied`: Mesa ocupada
- `reserved`: Mesa reservada
- `cleaning`: Mesa sendo limpa
- `maintenance`: Mesa em manutenção

### ComandaStatus
- `open`: Comanda aberta
- `pending_payment`: Aguardando pagamento
- `closed`: Comanda fechada
- `cancelled`: Comanda cancelada

### ComandaItemStatus
- `pending`: Item pendente
- `preparing`: Item sendo preparado
- `ready`: Item pronto
- `delivered`: Item entregue
- `cancelled`: Item cancelado

## Tratamento de Erros

O hook possui tratamento robusto de erros:

```typescript
const { error, loading } = useBarAttendance();

if (loading) {
  return <div>Carregando...</div>;
}

if (error) {
  return <div>Erro: {error}</div>;
}
```

## Subscriptions em Tempo Real

O hook configura automaticamente subscriptions para:
- Mudanças em mesas (`bar_tables`)
- Mudanças em comandas (`comandas`)
- Mudanças em itens de comanda (`comanda_items`)

As atualizações são refletidas automaticamente na interface.

## Exemplo Completo

Veja o arquivo `src/hooks/examples/useBarAttendanceExample.tsx` para um exemplo completo de uso do hook.

## Dependências

- `@supabase/supabase-js`: Cliente Supabase
- `react`: Hooks do React
- `../contexts/AuthContext`: Contexto de autenticação
- `../types/bar-attendance`: Tipos TypeScript

## Requisitos Atendidos

Este hook atende aos seguintes requisitos da especificação:

- **1.2**: Processamento rápido de pedidos no balcão
- **2.3**: Gestão de comandas em tempo real
- **3.2**: Controle de comandas abertas e acompanhamento

## Performance

O hook é otimizado para performance com:
- Callbacks memoizados para evitar re-renders desnecessários
- Subscriptions eficientes em tempo real
- Tratamento de erros que não bloqueia a interface
- Estados de loading granulares