# Como Testar o Sistema de Movimentação de Estoque

## Status Atual ✅

O sistema está **100% funcional** e pronto para uso! Todos os componentes estão configurados:

1. ✅ Tabela `inventory_movements` criada
2. ✅ Triggers de baixa automática ativos
3. ✅ Função `register_inventory_movement()` funcionando
4. ✅ Views de relatórios disponíveis
5. ✅ Itens diretos do estoque sincronizados com o menu

## Itens Disponíveis para Teste

Os seguintes itens estão configurados como **itens diretos do estoque** e darão baixa automática:

| Item | Estoque Atual | Tipo |
|------|---------------|------|
| Refrigerante Coca-cola 350ml lata | 30 unidades | direct |
| Cerveja Skol 350ml lata | 30 unidades | direct |
| Água mineral sem gás 500ml | 30 unidades | direct |
| Suco de laranja natural 300ml | 30 unidades | direct |

## Como Testar a Baixa Automática

### Teste 1: Pedido de Balcão

1. Acesse o **Balcão** no sistema
2. Crie um novo pedido
3. Adicione um dos itens acima (ex: Coca-Cola)
4. Quantidade: 2 unidades
5. Finalize o pedido

**Resultado Esperado:**
- Estoque da Coca-Cola: 30 → 28 unidades
- Registro criado em `inventory_movements`
- Tipo: `saida_venda`
- Referência: `BALCAO-{order_id}`

### Teste 2: Pedido de Comanda

1. Acesse **Comandas** no sistema
2. Abra uma nova comanda
3. Adicione um dos itens acima (ex: Cerveja Skol)
4. Quantidade: 3 unidades
5. Confirme o pedido

**Resultado Esperado:**
- Estoque da Skol: 30 → 27 unidades
- Registro criado em `inventory_movements`
- Tipo: `saida_venda`
- Referência: `COMANDA-{comanda_id}`

## Como Verificar as Movimentações

### Opção 1: Via SQL (Supabase)

```sql
-- Ver todas as movimentações
SELECT * FROM inventory_movements_detailed
ORDER BY created_at DESC
LIMIT 10;

-- Ver movimentações de um item específico
SELECT * FROM inventory_movements_detailed
WHERE item_name LIKE '%Coca%'
ORDER BY created_at DESC;

-- Ver resumo por item
SELECT * FROM inventory_movements_summary
WHERE item_name LIKE '%Coca%';
```

### Opção 2: Via Interface (Em Desenvolvimento)

O componente `InventoryMovementsModal` foi criado e pode ser integrado na página de estoque para visualizar as movimentações de cada item.

## Validações Implementadas

### 1. Estoque Insuficiente
Se tentar vender mais do que há em estoque:
```
❌ ERRO: Estoque insuficiente. Disponível: 2, Solicitado: 5
```

### 2. Item Não Encontrado
Se o item do estoque não existir:
```
❌ ERRO: Item de estoque não encontrado: {id}
```

### 3. Usuário Não Identificado
Se não conseguir identificar quem fez a movimentação:
```
❌ ERRO: Usuário não identificado para registrar movimentação
```

## Tipos de Movimentação Suportados

### Entradas (Aumentam Estoque)
- `entrada_compra`: Compra de fornecedor
- `entrada_ajuste`: Ajuste de inventário (correção)
- `entrada_devolucao`: Devolução de cliente

### Saídas (Diminuem Estoque)
- `saida_venda`: Venda (automática via pedidos) ⭐
- `saida_perda`: Perda ou quebra
- `saida_ajuste`: Ajuste de inventário (correção)
- `saida_transferencia`: Transferência entre estoques

## Registrar Movimentação Manual

Para registrar entradas ou outras movimentações manualmente:

```sql
-- Exemplo: Entrada de compra
SELECT register_inventory_movement(
  p_inventory_item_id := '59419c7b-d144-45f6-bce8-edc44476f989', -- ID da Coca-Cola
  p_movement_type := 'entrada_compra',
  p_quantity := 50,
  p_unit_cost := 3.50,
  p_notes := 'Compra do fornecedor ABC',
  p_reference_document := 'NF-12345'
);

-- Exemplo: Perda de produto
SELECT register_inventory_movement(
  p_inventory_item_id := '59419c7b-d144-45f6-bce8-edc44476f989',
  p_movement_type := 'saida_perda',
  p_quantity := 5,
  p_notes := 'Produtos vencidos'
);
```

## Próximos Passos

### 1. Interface de Movimentações
- [ ] Adicionar botão "Ver Movimentações" na lista de estoque
- [ ] Integrar `InventoryMovementsModal` component
- [ ] Adicionar filtros por período e tipo

### 2. Entrada Manual de Estoque
- [ ] Criar formulário para registrar compras
- [ ] Adicionar opção para registrar perdas
- [ ] Implementar ajustes de inventário

### 3. Relatórios
- [ ] Relatório de movimentações por período
- [ ] Análise de perdas
- [ ] Custo médio de produtos
- [ ] Giro de estoque

### 4. Alertas
- [ ] Notificação quando estoque baixo
- [ ] Alerta de produtos sem movimentação
- [ ] Aviso de produtos próximos ao vencimento

## Troubleshooting

### Problema: Baixa não está acontecendo

**Verificações:**
1. O item está marcado como `item_type = 'direct'` no menu?
2. O item tem `direct_inventory_item_id` preenchido?
3. O item do estoque tem `available_for_sale = true`?
4. Os triggers estão ativos?

**Solução:**
```sql
-- Verificar configuração do item
SELECT 
  mi.name,
  mi.item_type,
  mi.direct_inventory_item_id,
  ii.available_for_sale
FROM menu_items mi
LEFT JOIN inventory_items ii ON mi.direct_inventory_item_id = ii.id
WHERE mi.name LIKE '%Coca%';

-- Reexecutar sincronização
SELECT sync_inventory_to_menu();
```

### Problema: Erro ao criar pedido

**Possíveis causas:**
- Estoque insuficiente
- Item não encontrado
- Permissões RLS

**Verificar logs:**
```sql
-- Ver últimos erros no Postgres
SELECT * FROM pg_stat_activity
WHERE state = 'idle in transaction (aborted)';
```

## Contato

Se encontrar algum problema ou tiver dúvidas, verifique:
1. Logs do Supabase (Postgres)
2. Console do navegador (erros JavaScript)
3. Documentação em `SISTEMA_MOVIMENTACAO_ESTOQUE.md`
