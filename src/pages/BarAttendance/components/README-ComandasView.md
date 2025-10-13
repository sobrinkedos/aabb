# ComandasView - Sistema de Comandas

## Visão Geral

O componente `ComandasView` implementa um sistema completo de gerenciamento de comandas para o bar, incluindo visualização, filtragem, alertas e detalhamento de comandas.

## Funcionalidades Implementadas

### ✅ 1. Grid de Comandas Abertas com Informações Resumidas

- **Lista tabular** com todas as comandas e suas informações principais
- **Colunas incluem**: Mesa, Cliente, Funcionário, Status, Total, Data/Hora de abertura, Número de pessoas
- **Indicadores visuais** para status das comandas (cores diferentes)
- **Tempo decorrido** desde a abertura da comanda
- **Destaque visual** para comandas atrasadas (> 2 horas)

### ✅ 2. Modal de Detalhes da Comanda

**Componente**: `ComandaDetailsModal`

- **Informações completas** da comanda (mesa, cliente, funcionário, tempo decorrido, total)
- **Lista detalhada de itens** com status individual de cada item
- **Controle de status** dos itens (Pendente → Preparando → Pronto → Entregue)
- **Funcionalidade de remoção** de itens da comanda
- **Botão para fechar** comanda (mudar status para "pending_payment")

### ✅ 3. Funcionalidade para Adicionar Itens à Comanda

**Dentro do Modal de Detalhes**:

- **Formulário integrado** para adicionar novos itens
- **Seleção do item** do cardápio com preços
- **Definição de quantidade** e observações
- **Adição em tempo real** à comanda existente
- **Validação** de campos obrigatórios

### ✅ 4. Sistema de Alertas para Comandas com Tempo Excessivo

**Componente**: `ComandaAlerts`

- **Alertas de Atenção** (amarelo): comandas abertas há mais de 2 horas
- **Alertas Críticos** (vermelho): comandas abertas há mais de 4 horas
- **Informações do alerta**: mesa, cliente, tempo decorrido, valor total
- **Ações rápidas**: ver detalhes, dispensar alerta
- **Resumo quantitativo** quando há muitos alertas

### ✅ 5. Busca e Filtros Avançados

**Componente**: `ComandaFilters`

#### Filtros Disponíveis:
- **Busca por texto**: mesa, cliente ou funcionário
- **Status**: Todas, Abertas, Aguardando Pagamento, Fechadas, Canceladas
- **Funcionário**: lista dinâmica de funcionários com comandas
- **Mesa**: todas as mesas + opção "Balcão"
- **Tempo**: Todos, Recentes (< 1h), Atrasadas (> 2h), Críticas (> 4h)

#### Recursos dos Filtros:
- **Filtros combinados**: múltiplos filtros aplicados simultaneamente
- **Indicadores visuais**: chips mostrando filtros ativos
- **Limpeza rápida**: botão para remover todos os filtros
- **Contadores dinâmicos**: atualização em tempo real dos indicadores

## Componentes Criados

### 1. ComandaDetailsModal.tsx
- Modal completo para visualização e edição de comandas
- Integração com hooks para operações CRUD
- Interface responsiva e intuitiva

### 2. ComandaAlerts.tsx
- Sistema de alertas baseado em tempo
- Diferentes níveis de prioridade
- Ações contextuais para cada alerta

### 3. ComandaFilters.tsx
- Sistema de filtros avançado
- Interface limpa e organizada
- Feedback visual para filtros ativos

### 4. ComandasView.tsx (Atualizado)
- Integração de todos os componentes
- Lógica de filtragem otimizada
- Estado gerenciado com React hooks

## Integração com Hooks

### useComandas
- `addItemToComanda`: adicionar itens à comanda
- `updateItemStatus`: atualizar status dos itens
- `removeItemFromComanda`: remover itens
- `updateComandaStatus`: fechar comandas

### useBarTables
- Listagem de mesas para filtros
- Informações de mesa nas comandas

### useMenuItems
- Listagem do cardápio para adicionar itens
- Preços e informações dos produtos

## Requisitos Atendidos

### ✅ Requisito 3.1
- Visualização de comandas abertas com tempo decorrido e valor atual
- Interface organizada e informativa

### ✅ Requisito 3.2
- Alertas visuais para comandas com tempo limite ultrapassado
- Sistema de notificações em tempo real

### ✅ Requisito 3.3
- Funcionalidade completa para adicionar itens às comandas
- Atualização automática de totais e registros de horário

### ✅ Requisito 3.4
- Sistema de transferência e movimentação de itens
- Alertas para comandas esquecidas no final do turno

## Melhorias Implementadas

### Performance
- **useMemo** para otimizar filtragem de comandas
- **Lazy loading** de componentes pesados
- **Debounce** implícito na busca por texto

### UX/UI
- **Feedback visual** imediato para todas as ações
- **Confirmações** para ações destrutivas
- **Loading states** durante operações assíncronas
- **Responsividade** para diferentes tamanhos de tela

### Funcionalidades Extras
- **Dismissão de alertas** para reduzir ruído visual
- **Contadores em tempo real** de comandas por status
- **Tempo decorrido** atualizado dinamicamente
- **Múltiplos níveis de alerta** baseados em criticidade

## Como Usar

1. **Visualizar comandas**: A lista é carregada automaticamente
2. **Filtrar comandas**: Use os filtros na parte superior
3. **Ver detalhes**: Clique em "Ver Detalhes" em qualquer comanda
4. **Adicionar itens**: No modal de detalhes, use o botão "Adicionar Item"
5. **Gerenciar alertas**: Comandas atrasadas aparecem no topo com destaque
6. **Fechar comandas**: Use o botão "Fechar Comanda" no modal de detalhes

## Próximos Passos

Para futuras melhorias, considere:
- Notificações push para comandas críticas
- Relatórios de performance por funcionário
- Integração com sistema de impressão
- Backup offline de comandas abertas
- Analytics de tempo médio por tipo de pedido