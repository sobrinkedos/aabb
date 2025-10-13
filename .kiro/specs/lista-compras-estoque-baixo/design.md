# Documento de Design

## Visão Geral

A funcionalidade de Lista de Compras de Estoque Baixo será implementada como uma extensão do módulo de estoque existente, adicionando uma nova rota e componentes para gerenciar e compartilhar listas de itens que precisam ser repostos. A solução utilizará React Router para navegação, Context API para gerenciamento de estado e integração com WhatsApp Web API.

## Arquitetura

### Componentes Principais

```
src/pages/Inventory/
├── index.tsx (existente - será modificado)
├── ItemModal.tsx (existente)
├── InventoryItemCard.tsx (existente)
├── ListaEstoqueBaixo.tsx (novo)
├── ModalWhatsApp.tsx (novo)
└── HistoricoListaCompras.tsx (novo)

src/components/
├── ItemListaCompras.tsx (novo)
├── CompartilharWhatsApp.tsx (novo)
└── EditorTemplate.tsx (novo)

src/contexts/
├── AppContext.tsx (será estendido)
└── ListaComprasContext.tsx (novo)

src/types/
└── index.ts (será estendido)
```

### Fluxo de Navegação

1. **Dashboard Estoque** → Clique no card "Itens com Estoque Baixo"
2. **Lista de Estoque Baixo** → Visualização, edição e seleção de itens
3. **Modal WhatsApp** → Inserção de número e geração de mensagem
4. **WhatsApp Web/App** → Envio da mensagem formatada
5. **Histórico** → Visualização de listas salvas (opcional)

## Componentes e Interfaces

### 1. Componente ListaEstoqueBaixo

**Responsabilidades:**
- Filtrar e exibir itens com estoque baixo
- Permitir edição de quantidades sugeridas
- Gerenciar seleção de itens para compra
- Integrar com modal de WhatsApp

**Interface de Props:**
```typescript
interface ListaEstoqueBaixoProps {
  // Sem props - usa contexto
}
```

**Estado Interno:**
```typescript
interface EstadoEstoqueBaixo {
  itensSelecionados: Map<string, ItemListaCompras>;
  estaEditando: boolean;
  mostrarModalWhatsApp: boolean;
}
```

### 2. Componente ModalWhatsApp

**Responsabilidades:**
- Capturar número de telefone
- Validar formato do número
- Gerar mensagem formatada
- Abrir WhatsApp com mensagem

**Interface de Props:**
```typescript
interface ModalWhatsAppProps {
  estaAberto: boolean;
  aoFechar: () => void;
  itens: ItemListaCompras[];
  aoEnviar: (numeroTelefone: string, mensagem: string) => void;
}
```

### 3. Componente ItemListaCompras

**Responsabilidades:**
- Exibir informações do item
- Permitir edição de quantidade
- Controlar seleção do item

**Interface de Props:**
```typescript
interface ItemListaComprasProps {
  item: InventoryItem;
  quantidadeSugerida: number;
  estaSelecionado: boolean;
  aoMudarQuantidade: (quantidade: number) => void;
  aoMudarSelecao: (selecionado: boolean) => void;
}
```

## Modelos de Dados

### Extensões aos Tipos Existentes

```typescript
// Adicionar ao src/types/index.ts

export interface ItemListaCompras {
  idItemInventario: string;
  nome: string;
  categoria: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  unidade: string;
  quantidadeSugerida: number;
  fornecedor?: string;
  estaSelecionado: boolean;
}

export interface ListaCompras {
  id: string;
  criadoEm: Date;
  itens: ItemListaCompras[];
  status: 'rascunho' | 'enviada' | 'concluida';
  enviadoPara?: string;
  observacoes?: string;
}

export interface TemplateWhatsApp {
  id: string;
  nome: string;
  cabecalho: string;
  formatoItem: string;
  rodape: string;
  ehPadrao: boolean;
}
```

### Banco de Dados (Supabase)

**Nova Tabela: listas_compras**
```sql
CREATE TABLE listas_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'rascunho',
  enviado_para TEXT,
  observacoes TEXT,
  criado_por UUID REFERENCES profiles(id),
  total_itens INTEGER DEFAULT 0
);
```

**Nova Tabela: itens_lista_compras**
```sql
CREATE TABLE itens_lista_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_compras_id UUID REFERENCES listas_compras(id) ON DELETE CASCADE,
  item_inventario_id UUID REFERENCES inventory_items(id),
  quantidade_sugerida INTEGER NOT NULL,
  estoque_atual INTEGER NOT NULL,
  estoque_minimo INTEGER NOT NULL,
  esta_selecionado BOOLEAN DEFAULT true
);
```

**Nova Tabela: templates_whatsapp**
```sql
CREATE TABLE templates_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cabecalho TEXT NOT NULL,
  formato_item TEXT NOT NULL,
  rodape TEXT NOT NULL,
  eh_padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Tratamento de Erros

### Validações

1. **Número de Telefone:**
   - Formato brasileiro: (XX) XXXXX-XXXX
   - Validação com regex
   - Feedback visual em tempo real

2. **Quantidades:**
   - Valores positivos apenas
   - Máximo de 9999 unidades
   - Validação no onChange

3. **Seleção de Itens:**
   - Pelo menos 1 item deve estar selecionado
   - Aviso antes de enviar lista vazia

### Tratamento de Erros

```typescript
// Tipos de erro específicos
enum ErroListaCompras {
  TELEFONE_INVALIDO = 'TELEFONE_INVALIDO',
  NENHUM_ITEM_SELECIONADO = 'NENHUM_ITEM_SELECIONADO',
  WHATSAPP_INDISPONIVEL = 'WHATSAPP_INDISPONIVEL',
  FALHA_AO_SALVAR = 'FALHA_AO_SALVAR'
}

// Manipulador centralizado
const tratarErroListaCompras = (erro: ErroListaCompras) => {
  switch (erro) {
    case ErroListaCompras.TELEFONE_INVALIDO:
      return 'Número de telefone inválido. Use o formato (XX) XXXXX-XXXX';
    case ErroListaCompras.NENHUM_ITEM_SELECIONADO:
      return 'Selecione pelo menos um item para enviar';
    // ... outros casos
  }
};
```

## Estratégia de Testes

### Testes Unitários

1. **Componentes:**
   - Renderização correta dos itens
   - Validação de formulários
   - Interações do usuário

2. **Utilitários:**
   - Formatação de mensagem WhatsApp
   - Validação de número de telefone
   - Cálculo de quantidades sugeridas

3. **Context/Hooks:**
   - Gerenciamento de estado
   - Persistência de dados
   - Integração com Supabase

### Testes de Integração

1. **Fluxo Completo:**
   - Dashboard → Lista → WhatsApp → Envio
   - Salvamento e recuperação de listas
   - Sincronização com estoque

2. **APIs Externas:**
   - Integração WhatsApp Web
   - Fallback para WhatsApp mobile
   - Tratamento de erros de rede

### Casos de Teste Específicos

```typescript
describe('ListaEstoqueBaixo', () => {
  test('deve filtrar itens com estoqueAtual <= estoqueMinimo', () => {
    // Teste de filtro
  });
  
  test('deve calcular quantidades sugeridas corretamente', () => {
    // Teste de cálculo: (estoqueMinimo * 2) - estoqueAtual
  });
  
  test('deve agrupar itens por categoria', () => {
    // Teste de agrupamento
  });
});

describe('IntegracaoWhatsApp', () => {
  test('deve formatar mensagem corretamente', () => {
    // Teste de formatação
  });
  
  test('deve validar número de telefone', () => {
    // Teste de validação
  });
});
```

## Considerações de Performance

### Otimizações

1. **Carregamento Sob Demanda:**
   - Componente ListaEstoqueBaixo carregado sob demanda
   - Histórico paginado (10 listas por página)

2. **Memoização:**
   - useMemo para cálculos de quantidades
   - useCallback para manipuladores de eventos
   - React.memo para componentes de lista

3. **Debouncing:**
   - Edição de quantidades com debounce de 300ms
   - Busca no histórico com debounce de 500ms

### Gerenciamento de Estado

```typescript
// Context otimizado
const ListaComprasContext = createContext({
  itensEstoqueBaixo: [],
  itensSelecionados: new Map(),
  estaCarregando: false,
  // Ações memoizadas
  atualizarQuantidade: useCallback(...),
  alternarSelecao: useCallback(...),
  gerarMensagemWhatsApp: useCallback(...)
});
```

## Considerações de Segurança

### Validações de Segurança

1. **Sanitização:**
   - Escape de caracteres especiais na mensagem
   - Validação de entrada do usuário
   - Prevenção de XSS

2. **Autorização:**
   - Verificar permissões antes de acessar lista
   - Políticas RLS no Supabase
   - Validação de propriedade das listas

3. **Dados Sensíveis:**
   - Não armazenar números de telefone
   - Logs sem informações pessoais
   - Criptografia de templates personalizados

### Políticas RLS (Supabase)

```sql
-- listas_compras
CREATE POLICY "Usuários podem gerenciar suas próprias listas de compras" 
ON listas_compras FOR ALL 
USING (criado_por = auth.uid());

-- itens_lista_compras
CREATE POLICY "Usuários podem gerenciar itens em suas listas" 
ON itens_lista_compras FOR ALL 
USING (
  lista_compras_id IN (
    SELECT id FROM listas_compras WHERE criado_por = auth.uid()
  )
);
```

## Pontos de Integração

### Integração WhatsApp

**Método 1: WhatsApp Web (Preferencial)**
```typescript
const abrirWhatsAppWeb = (telefone: string, mensagem: string) => {
  const mensagemCodificada = encodeURIComponent(mensagem);
  const url = `https://web.whatsapp.com/send?phone=${telefone}&text=${mensagemCodificada}`;
  window.open(url, '_blank');
};
```

**Método 2: WhatsApp Mobile (Alternativo)**
```typescript
const abrirWhatsAppMobile = (telefone: string, mensagem: string) => {
  const mensagemCodificada = encodeURIComponent(mensagem);
  const url = `whatsapp://send?phone=${telefone}&text=${mensagemCodificada}`;
  window.location.href = url;
};
```

### Sistema de Templates

**Template Padrão:**
```
🏪 *{nomeClube}* - Lista de Compras
📅 {data} às {hora}

📋 *ITENS PARA REPOSIÇÃO:*

{itensPorCategoria}

💡 *Observações:*
- Quantidades baseadas no estoque mínimo
- Verificar disponibilidade com fornecedores
- Priorizar itens em falta total

👤 Solicitado por: {nomeUsuario}
📞 Contato: {telefoneUsuario}

---
Sistema AABB - Gestão de Estoque
```

**Variáveis Disponíveis:**
- `{nomeClube}` - Nome do clube
- `{data}` - Data atual
- `{hora}` - Hora atual
- `{itensPorCategoria}` - Lista formatada por categoria
- `{nomeUsuario}` - Nome do usuário
- `{telefoneUsuario}` - Telefone do usuário (opcional)
- `{totalItens}` - Total de itens na lista
- `{valorTotal}` - Valor estimado (se disponível)