# Documento de Design - Módulo de Gestão de Cardápio

## Visão Geral

O módulo de gestão de cardápio expandirá significativamente as funcionalidades existentes do sistema ClubManager Pro, transformando o simples cadastro de itens em uma solução completa para gestão gastronômica. O módulo integrará receitas detalhadas, controle nutricional, precificação dinâmica, gestão de disponibilidade e cardápio digital interativo.

## Arquitetura

### Tecnologias Base
- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Estado:** React Context API + React Hook Form
- **Roteamento:** React Router DOM v7
- **UI Components:** Lucide React + Framer Motion
- **Validação:** Validação nativa do React Hook Form

### Padrões Arquiteturais
- **Component-Based Architecture:** Componentes reutilizáveis e modulares
- **Context Pattern:** Gerenciamento de estado global via React Context
- **Repository Pattern:** Abstração de acesso a dados via Supabase
- **Real-time Updates:** Subscriptions do Supabase para atualizações em tempo real

## Componentes e Interfaces

### 1. Estrutura de Dados (Extensões do Schema)

#### Tabela: recipe_ingredients
```sql
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  is_optional BOOLEAN DEFAULT FALSE,
  alternative_ingredients JSONB, -- Array de ingredientes alternativos
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: recipes
```sql
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  instructions TEXT,
  prep_time INTEGER, -- minutos
  cook_time INTEGER, -- minutos
  servings INTEGER DEFAULT 1,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  cost_per_serving DECIMAL(10,2),
  margin_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: nutritional_info
```sql
CREATE TABLE public.nutritional_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
  calories_per_serving DECIMAL(8,2),
  protein_g DECIMAL(8,2),
  carbs_g DECIMAL(8,2),
  fat_g DECIMAL(8,2),
  fiber_g DECIMAL(8,2),
  sodium_mg DECIMAL(8,2),
  allergens TEXT[], -- Array de alérgenos
  dietary_restrictions TEXT[], -- vegetarian, vegan, gluten-free, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: menu_combos
```sql
CREATE TABLE public.menu_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  combo_items JSONB NOT NULL, -- Array de {menu_item_id, quantity}
  original_price DECIMAL(10,2),
  combo_price DECIMAL(10,2),
  discount_percentage DECIMAL(5,2),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: price_history
```sql
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES public.menu_items(id),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  reason TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Interfaces TypeScript

```typescript
export interface Recipe {
  id: string;
  menuItemId: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  costPerServing: number;
  marginPercentage: number;
  ingredients: RecipeIngredient[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  unit: string;
  isOptional: boolean;
  alternativeIngredients?: AlternativeIngredient[];
}

export interface AlternativeIngredient {
  inventoryItemId: string;
  quantity: number;
  costAdjustment: number;
}

export interface NutritionalInfo {
  id: string;
  menuItemId: string;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  allergens: string[];
  dietaryRestrictions: string[];
}

export interface MenuCombo {
  id: string;
  name: string;
  description: string;
  comboItems: ComboItem[];
  originalPrice: number;
  comboPrice: number;
  discountPercentage: number;
  validFrom?: Date;
  validUntil?: Date;
  active: boolean;
  createdAt: Date;
}

export interface ComboItem {
  menuItemId: string;
  quantity: number;
  menuItem?: MenuItem;
}

export interface PriceHistory {
  id: string;
  menuItemId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedBy: string;
  changedAt: Date;
}

export interface ExtendedMenuItem extends MenuItem {
  recipe?: Recipe;
  nutritionalInfo?: NutritionalInfo;
  priceHistory?: PriceHistory[];
  availabilityStatus: 'available' | 'out_of_stock' | 'paused' | 'seasonal';
  seasonalPeriod?: {
    startMonth: number;
    endMonth: number;
  };
}
```

### 3. Componentes React

#### MenuManagementDashboard
```typescript
interface MenuManagementDashboardProps {
  // Dashboard principal com KPIs e navegação rápida
}
```

#### RecipeBuilder
```typescript
interface RecipeBuilderProps {
  menuItemId?: string;
  recipe?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}
```

#### NutritionalInfoForm
```typescript
interface NutritionalInfoFormProps {
  menuItemId: string;
  nutritionalInfo?: NutritionalInfo;
  onSave: (info: NutritionalInfo) => void;
}
```

#### PricingManager
```typescript
interface PricingManagerProps {
  menuItem: ExtendedMenuItem;
  onPriceUpdate: (newPrice: number, reason: string) => void;
}
```

#### ComboBuilder
```typescript
interface ComboBuilderProps {
  combo?: MenuCombo;
  availableItems: MenuItem[];
  onSave: (combo: MenuCombo) => void;
}
```

#### DigitalMenu
```typescript
interface DigitalMenuProps {
  categoryFilter?: string;
  dietaryFilter?: string[];
  allergenFilter?: string[];
  showNutritionalInfo?: boolean;
  onItemSelect?: (item: ExtendedMenuItem) => void;
}
```

## Modelos de Dados

### Fluxo de Cálculo de Custos
1. **Custo Base:** Soma dos custos de todos os ingredientes da receita
2. **Custo por Porção:** Custo base dividido pelo número de porções
3. **Preço Sugerido:** Custo por porção × (1 + margem percentual)
4. **Alertas:** Quando custo de ingrediente aumenta > 10%, notificar gestor

### Gestão de Disponibilidade
```typescript
enum AvailabilityStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out_of_stock', // Ingrediente em falta
  PAUSED = 'paused', // Pausado manualmente
  SEASONAL = 'seasonal' // Fora da temporada
}
```

### Sistema de Sazonalidade
```typescript
interface SeasonalConfig {
  startMonth: number; // 1-12
  endMonth: number; // 1-12
  autoActivate: boolean;
  notificationDays: number; // Dias antes para notificar
}
```

## Tratamento de Erros

### Validações de Negócio
1. **Receita sem ingredientes:** Impedir salvamento
2. **Margem negativa:** Alertar quando preço < custo
3. **Ingrediente inexistente:** Validar se item existe no estoque
4. **Combo inválido:** Verificar se todos os itens estão disponíveis

### Tratamento de Falhas
```typescript
interface ErrorHandler {
  handleRecipeCalculationError: (error: Error) => void;
  handleInventoryConnectionError: (error: Error) => void;
  handlePriceUpdateError: (error: Error) => void;
}
```

### Estados de Loading
- **Calculando custos:** Durante recálculo automático de preços
- **Sincronizando estoque:** Ao verificar disponibilidade
- **Salvando receita:** Durante operações CRUD

## Estratégia de Testes

### Testes Unitários
- **Cálculo de custos:** Verificar precisão matemática
- **Validações de formulário:** Testar regras de negócio
- **Formatação de dados:** Garantir consistência

### Testes de Integração
- **Sincronização com estoque:** Verificar atualizações em tempo real
- **Cálculo automático:** Testar triggers de recálculo
- **Persistência de dados:** Validar operações CRUD

### Testes E2E
- **Fluxo completo de receita:** Criar receita → calcular custo → definir preço
- **Gestão de combos:** Criar combo → aplicar desconto → validar preço final
- **Cardápio digital:** Filtrar itens → visualizar informações → fazer pedido

## Integrações

### Módulo de Estoque
- **Real-time sync:** Atualização automática de disponibilidade
- **Cost tracking:** Monitoramento de mudanças de preço
- **Stock alerts:** Notificações quando ingrediente acaba

### Módulo de Vendas
- **Price updates:** Sincronização de preços em tempo real
- **Combo pricing:** Aplicação automática de descontos
- **Order validation:** Verificar disponibilidade antes de confirmar pedido

### Sistema de Notificações
- **Cost alerts:** Quando margem fica abaixo do mínimo
- **Seasonal reminders:** Notificar sobre itens sazonais
- **Stock warnings:** Alertar sobre ingredientes em falta

## Performance e Otimização

### Caching Strategy
- **Menu items:** Cache local com TTL de 5 minutos
- **Nutritional data:** Cache persistente (raramente muda)
- **Price calculations:** Cache de cálculos complexos

### Database Optimization
- **Indexes:** Criar índices em campos de busca frequente
- **Materialized views:** Para relatórios de performance
- **Partitioning:** Histórico de preços por data

### Real-time Updates
- **Selective subscriptions:** Apenas dados relevantes para o usuário
- **Debounced updates:** Evitar atualizações excessivas
- **Optimistic updates:** UI responsiva com rollback em caso de erro