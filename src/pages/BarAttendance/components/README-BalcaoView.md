# BalcaoView - Interface de Pedidos no Balcão

## Visão Geral

O componente `BalcaoView` implementa uma interface completa para atendimento no balcão do bar, permitindo que bartenders processem pedidos de forma rápida e eficiente.

## Funcionalidades Implementadas

### ✅ 1. Grid de Itens do Cardápio Otimizado

- **Grid responsivo** com 2-4 colunas dependendo do tamanho da tela
- **Filtros por categoria** para navegação rápida
- **Busca por nome** para encontrar itens específicos
- **Informações visuais** com preço, categoria e disponibilidade
- **Seleção rápida** com um clique para adicionar ao carrinho

### ✅ 2. Carrinho de Pedido com Cálculo Automático

- **Adição automática** de itens com quantidade
- **Controles de quantidade** (+/-) para cada item
- **Remoção individual** de itens do carrinho
- **Cálculo em tempo real** do subtotal e total
- **Aplicação automática de descontos** para membros identificados
- **Botão limpar** para resetar o carrinho

### ✅ 3. Identificação Rápida de Membros

- **Modal de busca avançada** (`CustomerSearchModal`)
- **Busca por telefone ou nome** do membro
- **Exibição de informações** do membro (VIP, pontos, última visita)
- **Aplicação automática de 10% de desconto** para membros
- **Indicador visual** do membro selecionado no header

### ✅ 4. Interface de Pagamento com Múltiplas Formas

- **Modal de pagamento** com resumo completo do pedido
- **Métodos de pagamento disponíveis:**
  - Dinheiro
  - Cartão de Débito
  - Cartão de Crédito
  - PIX
- **Seleção visual** com ícones e cores diferenciadas
- **Campo de observações** para notas especiais
- **Validação** antes do processamento

### ✅ 5. Impressão Automática de Comprovante

- **Componente ReceiptPrinter** para geração de comprovantes
- **Impressão automática** após processamento do pagamento
- **Modal de confirmação** com preview do comprovante
- **Opção de reimpressão** caso necessário
- **Formato profissional** com todas as informações necessárias

## Componentes Auxiliares

### CustomerSearchModal
- Modal dedicado para busca e seleção de membros
- Suporte a busca por telefone ou nome
- Exibição de informações detalhadas do membro
- Interface intuitiva com resultados organizados

### ReceiptPrinter
- Geração de comprovantes em formato profissional
- Preview visual antes da impressão
- Integração com impressoras (simulada)
- Informações completas: itens, preços, descontos, pagamento

## Fluxo de Uso

1. **Seleção de Itens**: Bartender navega pelo grid e adiciona itens ao carrinho
2. **Identificação de Membro** (opcional): Busca e seleciona membro para aplicar desconto
3. **Revisão do Pedido**: Verifica itens, quantidades e total no carrinho
4. **Finalização**: Clica em "Finalizar Pedido" para abrir modal de pagamento
5. **Pagamento**: Seleciona método de pagamento e adiciona observações
6. **Processamento**: Sistema processa o pedido e gera comprovante
7. **Impressão**: Comprovante é impresso automaticamente

## Integração com Sistema

- **useMenuItems**: Hook para carregar itens do cardápio
- **useBarAttendance**: Hook principal para processamento de pedidos
- **useAuth**: Contexto de autenticação para identificar funcionário
- **Supabase**: Integração com banco de dados para persistência

## Responsividade

- **Desktop**: Layout com grid de itens à esquerda e carrinho à direita
- **Tablet**: Grid adaptado com menos colunas
- **Mobile**: Layout empilhado com carrinho em modal

## Acessibilidade

- **Navegação por teclado** em todos os elementos interativos
- **Ícones descritivos** para métodos de pagamento
- **Cores contrastantes** para status e estados
- **Textos alternativos** para elementos visuais

## Testes

Arquivo de testes criado em `__tests__/BalcaoView.test.tsx` com cobertura de:
- Renderização de componentes
- Adição/remoção de itens do carrinho
- Cálculos de total e desconto
- Filtros e busca
- Processamento de pagamento
- Interações do usuário

## Melhorias Futuras

- Integração real com impressoras térmicas
- Suporte a códigos de barras para produtos
- Histórico de pedidos recentes
- Atalhos de teclado para ações frequentes
- Modo offline com sincronização posterior

## Requisitos Atendidos

- ✅ **1.1**: Processamento rápido de pedidos no balcão
- ✅ **1.2**: Seleção de bebidas com destaque para promoções
- ✅ **1.3**: Cálculo em tempo real com descontos de membro
- ✅ **1.4**: Identificação automática de membros com benefícios
- ✅ **1.5**: Processamento de pagamento e impressão em menos de 30 segundos