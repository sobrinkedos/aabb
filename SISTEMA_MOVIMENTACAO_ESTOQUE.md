# Sistema de Movimentação de Estoque - Implementado ✅

## Resumo

Sistema completo de controle de estoque com baixa automática em pedidos de balcão e comandas, incluindo registro detalhado de todas as movimentações.

## O que foi implementado

### 1. Tabela `inventory_movements`

Registra todas as movimentações de estoque com os seguintes campos:

- **Identificação**: `id`, `empresa_id`, `inventory_item_id`
- **Tipo de movimentação**: 
  - Entradas: `entrada_compra`, `entrada_ajuste`, `entrada_devolucao`
  - Saídas: `saida_venda`, `saida_perda`, `saida_ajuste`, `saida_transferencia`
- **Quantidades e valores**: `quantity`, `unit_cost`, `total_cost`
- **Rastreabilidade**: `stock_before`, `stock_after`
- **Referências**: `balcao_order_id`, `comanda_id`, `menu_item_id`
- **Informações adicionais**: `notes`, `reference_document`
- **Controle**: `created_by`, `created_at`

### 2. Função `register_inventory_movement()`

Função principal para registrar movimentações com:
- Validação de estoque disponível
- Cálculo automático de novo estoque
- Registro da movimentação
- Atualização do estoque do item
- Tratamento de erros

**Parâmetros**:
```sql
register_inventory_movement(
  p_inventory_item_id UUID,
  p_movement_type VARCHAR,
  p_quantity DECIMAL,
  p_unit_cost DECIMAL DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_reference_document VARCHAR DEFAULT NULL,
  p_balcao_order_id UUID DEFAULT NULL,
  p_comanda_id UUID DEFAULT NULL,
  p_menu_item_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
```

### 3. Triggers de Baixa Automática

#### 3.1 Pedidos de Balcão
**Trigger**: `trigger_process_balcao_item_inventory`
- Dispara ao inserir item em `balcao_order_items`
- Verifica se é item direto do estoque (`item_type = 'direct'`)
- Registra movimentação de saída automaticamente
- Atualiza estoque imediatamente

#### 3.2 Pedidos de Comanda
**Trigger**: `trigger_process_comanda_item_inventory`
- Dispara ao inserir item em `comanda_items`
- Verifica se é item direto do estoque (`item_type = 'direct'`)
- Registra movimentação de saída automaticamente
- Atualiza estoque imediatamente

### 4. Views para Relatórios

#### 4.1 `inventory_movements_detailed`
Visão completa das movimentações com:
- Nome do item e unidade
- Categoria
- Nome do usuário que criou
- Nome do item do menu
- Número do pedido de balcão
- Direção da movimentação (Entrada/Saída)
- Label do tipo de movimentação

#### 4.2 `inventory_movements_summary`
Resumo por item de estoque com:
- Estoque atual
- Total de movimentações
- Total de entradas e saídas
- Quantidade total entrada e saída
- Custo total de entradas
- Data da última movimentação

### 5. Políticas RLS

- **SELECT**: Usuários podem ver movimentações da sua empresa
- **INSERT**: Funcionários e admins podem criar movimentações

### 6. Índices para Performance

- `idx_inventory_movements_empresa_id`
- `idx_inventory_movements_inventory_item_id`
- `idx_inventory_movements_movement_type`
- `idx_inventory_movements_created_at`
- `idx_inventory_movements_balcao_order_id`
- `idx_inventory_movements_comanda_id`
- `idx_inventory_movements_item_date`

## Fluxo de Funcionamento

### Pedido de Balcão
```
1. Usuário adiciona item ao pedido
2. INSERT em balcao_order_items
3. Trigger verifica se é item direto do estoque
4. Se sim, chama register_inventory_movement()
5. Função valida estoque disponível
6. Registra movimentação em inventory_movements
7. Atualiza current_stock em inventory_items
```

### Pedido de Comanda
```
1. Usuário adiciona item à comanda
2. INSERT em comanda_items
3. Trigger verifica se é item direto do estoque
4. Se sim, chama register_inventory_movement()
5. Função valida estoque disponível
6. Registra movimentação em inventory_movements
7. Atualiza current_stock em inventory_items
```

## Tipos de Movimentação

### Entradas
- **entrada_compra**: Compra de produtos
- **entrada_ajuste**: Ajuste de inventário (correção para mais)
- **entrada_devolucao**: Devolução de produtos

### Saídas
- **saida_venda**: Venda através de pedidos (automático)
- **saida_perda**: Perda ou quebra de produtos
- **saida_ajuste**: Ajuste de inventário (correção para menos)
- **saida_transferencia**: Transferência entre estoques

## Exemplo de Uso Manual

### Registrar Entrada de Compra
```sql
SELECT register_inventory_movement(
  p_inventory_item_id := 'uuid-do-item',
  p_movement_type := 'entrada_compra',
  p_quantity := 50,
  p_unit_cost := 10.50,
  p_notes := 'Compra de fornecedor XYZ',
  p_reference_document := 'NF-12345'
);
```

### Registrar Perda
```sql
SELECT register_inventory_movement(
  p_inventory_item_id := 'uuid-do-item',
  p_movement_type := 'saida_perda',
  p_quantity := 5,
  p_notes := 'Produto vencido'
);
```

## Consultas Úteis

### Ver movimentações de um item
```sql
SELECT * FROM inventory_movements_detailed
WHERE inventory_item_id = 'uuid-do-item'
ORDER BY created_at DESC;
```

### Ver resumo de todos os itens
```sql
SELECT * FROM inventory_movements_summary
ORDER BY last_movement_at DESC;
```

### Ver movimentações do dia
```sql
SELECT * FROM inventory_movements_detailed
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Ver itens com estoque baixo e suas movimentações
```sql
SELECT 
  ii.name,
  ii.current_stock,
  ii.min_stock,
  ims.total_quantity_out as saidas_totais,
  ims.last_movement_at
FROM inventory_items ii
JOIN inventory_movements_summary ims ON ii.id = ims.inventory_item_id
WHERE ii.current_stock <= ii.min_stock
ORDER BY ii.current_stock ASC;
```

## Validações Implementadas

1. ✅ Quantidade deve ser positiva
2. ✅ Verifica estoque disponível antes de dar baixa
3. ✅ Registra estoque antes e depois da movimentação
4. ✅ Identifica usuário que criou a movimentação
5. ✅ Vincula movimentação à origem (pedido/comanda)
6. ✅ Atualiza estoque atomicamente

## Próximos Passos Sugeridos

1. **Interface de Gestão de Estoque**
   - Tela para visualizar movimentações
   - Filtros por tipo, período, item
   - Gráficos de entrada/saída

2. **Alertas de Estoque**
   - Notificação quando estoque baixo
   - Alerta de produtos sem movimentação

3. **Relatórios**
   - Relatório de movimentações por período
   - Análise de perdas
   - Custo médio de produtos

4. **Integração com Receitas**
   - Baixa automática de ingredientes ao preparar pratos
   - Cálculo de custo real baseado em movimentações

## Migração Aplicada

- **Arquivo**: `supabase/migrations/20250208000001_inventory_movements_system.sql`
- **Data**: 08/02/2025
- **Projeto**: wznycskqsavpmejwpksp (desenvolvimento)
- **Status**: ✅ Aplicada com sucesso

## Observações Importantes

- A baixa no estoque ocorre **imediatamente** ao adicionar o item ao pedido
- Apenas itens com `item_type = 'direct'` têm baixa automática
- Itens preparados (receitas) precisarão de implementação futura
- Todas as movimentações são rastreáveis e auditáveis
- O sistema valida estoque antes de permitir a venda
