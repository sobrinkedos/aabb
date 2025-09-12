# Componentes de Gestão de Mesas - Sistema de Atendimento do Bar

Este documento descreve os componentes implementados para a gestão de mesas do sistema de atendimento do bar.

## Componentes Implementados

### 1. MesasView (Componente Principal)
**Arquivo:** `MesasView.tsx`

Componente principal que gerencia a visualização e interação com as mesas do bar.

**Funcionalidades:**
- Exibição de estatísticas das mesas por status
- Layout visual do salão com mesas posicionáveis
- Integração com comandas abertas
- Ações rápidas para gerenciar mesas
- Modais para nova comanda, configuração de layout e detalhes da mesa

**Props:** Nenhuma (usa hooks internos)

### 2. MesaCard
**Arquivo:** `MesaCard.tsx`

Componente que representa uma mesa individual no layout do salão.

**Funcionalidades:**
- Exibição visual do status da mesa com cores
- Informações da comanda atual (se ocupada)
- Ações rápidas no hover (ocupar, liberar, limpar, reservar)
- Suporte a drag-and-drop para reposicionamento
- Indicadores visuais de tempo de ocupação e valor da comanda

**Props:**
- `mesa: TableWithComanda` - Dados da mesa
- `onClick: (mesa) => void` - Callback para clique na mesa
- `onStatusChange: (mesaId, status) => void` - Callback para mudança de status
- `isDragging?: boolean` - Indica se está sendo arrastada
- `style?: React.CSSProperties` - Estilos customizados

### 3. LayoutSalao
**Arquivo:** `LayoutSalao.tsx`

Componente que gerencia o layout visual do salão com funcionalidade de drag-and-drop.

**Funcionalidades:**
- Grid de referência para posicionamento
- Drag-and-drop para reposicionar mesas
- Área de drop visual durante o arraste
- Prevenção de posicionamento fora dos limites
- Conversão de coordenadas pixel para porcentagem

**Props:**
- `mesas: TableWithComanda[]` - Array de mesas
- `onMesaClick: (mesa) => void` - Callback para clique na mesa
- `onMesaPositionChange: (mesaId, x, y) => void` - Callback para mudança de posição
- `onStatusChange: (mesaId, status) => void` - Callback para mudança de status
- `isDragEnabled?: boolean` - Habilita/desabilita drag-and-drop

### 4. MesaDetailsModal
**Arquivo:** `MesaDetailsModal.tsx`

Modal que exibe detalhes completos de uma mesa e sua comanda.

**Funcionalidades:**
- Informações básicas da mesa (capacidade, tempo de ocupação)
- Detalhes da comanda atual (cliente, itens, total)
- Lista de itens da comanda com status
- Ações rápidas para mudança de status
- Carregamento dinâmico dos dados da comanda

**Props:**
- `isOpen: boolean` - Controla visibilidade do modal
- `onClose: () => void` - Callback para fechar modal
- `mesa: TableWithComanda | null` - Mesa selecionada
- `onStatusChange: (mesaId, status) => void` - Callback para mudança de status

### 5. MesasLegend
**Arquivo:** `MesasLegend.tsx`

Componente de legenda que explica os status das mesas.

**Funcionalidades:**
- Legenda visual com cores e descrições
- Contadores por status
- Modo compacto e expandido
- Dicas de uso do sistema

**Props:**
- `stats: StatusStats` - Estatísticas de mesas por status
- `compact?: boolean` - Modo de exibição compacto

## Interfaces e Tipos

### TableWithComanda
```typescript
interface TableWithComanda extends BarTable {
  currentComanda?: Comanda;
  occupiedSince?: string;
  currentTotal?: number;
  peopleCount?: number;
}
```

### TableStatus
```typescript
type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
```

## Hooks Utilizados

### useBarTables
- `tables: BarTable[]` - Lista de mesas
- `loading: boolean` - Estado de carregamento
- `updateTableStatus(id, status)` - Atualizar status da mesa
- `updateTablePosition(id, x, y)` - Atualizar posição da mesa
- `refetch()` - Recarregar dados

### useComandas
- `comandas: Comanda[]` - Lista de comandas
- `getComandaByTable(tableId)` - Buscar comanda por mesa
- `removeItemFromComanda(itemId)` - Remover item da comanda

## Funcionalidades Implementadas

### ✅ Layout visual do salão com grid de mesas
- Grid de referência para posicionamento
- Visualização responsiva das mesas
- Cores diferenciadas por status

### ✅ Componente MesaCard com status visual
- Cores por estado (verde=disponível, vermelho=ocupado, etc.)
- Informações contextuais (capacidade, tempo, valor)
- Ações rápidas no hover

### ✅ Funcionalidade de drag-and-drop
- Arrastar e soltar mesas para reposicionamento
- Feedback visual durante o arraste
- Salvamento automático da nova posição
- Prevenção de posicionamento inválido

### ✅ Modal de detalhes da mesa
- Informações completas da mesa e comanda
- Lista de itens com status de preparo
- Ações rápidas para mudança de status
- Carregamento dinâmico de dados

### ✅ Ações rápidas
- Ocupar mesa disponível
- Liberar mesa ocupada
- Marcar para limpeza
- Reservar mesa
- Colocar em manutenção

## Requisitos Atendidos

- **Requisito 2.1:** ✅ Layout visual do salão com status de cada mesa
- **Requisito 2.2:** ✅ Informações de tempo de ocupação, valor da comanda e último pedido
- **Requisito 8.1:** ✅ Visualização e gerenciamento de reservas
- **Requisito 8.2:** ✅ Bloqueio automático de mesas em horários reservados

## Próximos Passos

1. Implementar testes unitários para todos os componentes
2. Adicionar animações de transição para mudanças de status
3. Implementar notificações para ações realizadas
4. Adicionar suporte a temas (modo escuro)
5. Otimizar performance para salões com muitas mesas

## Uso

```tsx
import MesasView from './components/MesasView';

function BarAttendance() {
  return (
    <div>
      <MesasView />
    </div>
  );
}
```

O componente é totalmente autônomo e gerencia seu próprio estado através dos hooks `useBarTables` e `useComandas`.