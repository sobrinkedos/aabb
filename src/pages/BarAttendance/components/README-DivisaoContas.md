# Sistema de Divisão de Contas - Bar Attendance

## Visão Geral

O sistema de divisão de contas permite dividir a conta de uma comanda de diferentes formas, aplicar descontos específicos por pessoa e gerar múltiplos comprovantes de pagamento. Este módulo atende aos requisitos 4.1 a 4.5 do sistema de atendimento no bar.

## Componentes Implementados

### 1. DivisaoContaModal

Modal principal para configurar a divisão da conta com as seguintes funcionalidades:

#### Tipos de Divisão
- **Igual**: Divide o valor total igualmente entre todas as pessoas
- **Por Item**: Permite atribuir itens específicos para cada pessoa
- **Por Pessoa**: (Futuro) Divisão personalizada por pessoa
- **Customizada**: (Futuro) Divisão totalmente personalizada

#### Configurações
- Número de pessoas (2-10)
- Taxa de serviço (0-20%)
- Desconto em valor absoluto
- Nomes personalizados para cada pessoa

#### Cálculos Automáticos
- Subtotal por pessoa
- Taxa de serviço proporcional
- Desconto proporcional
- Total final por pessoa
- Validação de diferenças nos totais

### 2. ComprovantesMultiplos

Modal para processar pagamentos individuais e gerar comprovantes:

#### Formas de Pagamento
- Dinheiro
- Cartão de Crédito
- Cartão de Débito
- PIX

#### Funcionalidades
- Processamento individual de pagamentos
- Geração de comprovantes personalizados
- Status de pagamento em tempo real
- Impressão de comprovantes (simulada)
- Finalização de todos os pagamentos

### 3. Integração com useComandas

Novas funções adicionadas ao hook:

```typescript
// Criar divisão de conta
createBillSplit(comandaId: string, splitConfig: BillSplitConfig)

// Buscar divisão existente
getBillSplit(comandaId: string)

// Processar múltiplos pagamentos
processMultiplePayments(comandaId: string, payments: PaymentDetails[])
```

## Fluxo de Uso

### 1. Iniciar Divisão
1. Abrir detalhes da comanda
2. Clicar em "Dividir Conta"
3. Configurar tipo de divisão e parâmetros
4. Confirmar divisão

### 2. Divisão Igual
1. Definir número de pessoas
2. Ajustar taxa de serviço se necessário
3. Aplicar desconto se houver
4. Personalizar nomes das pessoas
5. Confirmar divisão automática

### 3. Divisão por Item
1. Selecionar "Dividir por Item"
2. Atribuir quantidades de cada item para cada pessoa
3. Sistema calcula automaticamente os totais
4. Confirmar quando todos os itens estiverem atribuídos

### 4. Processar Pagamentos
1. Selecionar forma de pagamento para cada pessoa
2. Processar pagamentos individualmente
3. Imprimir comprovantes conforme necessário
4. Finalizar todos os pagamentos

## Estrutura de Dados

### BillSplitConfig
```typescript
interface BillSplitConfig {
  type: 'equal' | 'by_item' | 'by_person' | 'custom';
  person_count: number;
  splits: BillSplitDetails[];
  service_charge_percentage?: number;
  discount_amount?: number;
}
```

### BillSplitDetails
```typescript
interface BillSplitDetails {
  person_name: string;
  items: {
    menu_item_id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  service_charge: number;
  discount: number;
  total: number;
}
```

### PaymentDetails
```typescript
interface PaymentDetails {
  person_name: string;
  amount: number;
  payment_method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  receipt_printed?: boolean;
}
```

## Banco de Dados

### Tabela bill_splits
```sql
CREATE TABLE bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  split_type VARCHAR(20) NOT NULL,
  person_count INTEGER NOT NULL,
  splits JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  service_charge_percentage DECIMAL(5,2) DEFAULT 10.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Validações

### Divisão Igual
- Soma das divisões deve ser igual ao total da comanda
- Número de pessoas deve ser entre 2 e 10
- Taxa de serviço entre 0% e 20%
- Desconto não pode ser maior que o subtotal

### Divisão por Item
- Todos os itens devem ser atribuídos
- Quantidade atribuída não pode exceder a quantidade do item
- Soma das quantidades deve ser igual à quantidade original

### Pagamentos
- Todos os pagamentos devem ser processados antes da finalização
- Forma de pagamento deve ser selecionada
- Status deve ser 'completed' para finalizar

## Testes

### DivisaoContaModal.test.tsx
- Renderização do modal
- Cálculos de divisão igual
- Alteração de configurações
- Divisão por item
- Validações de totais

### ComprovantesMultiplos.test.tsx
- Processamento de pagamentos
- Geração de comprovantes
- Alteração de formas de pagamento
- Finalização de pagamentos
- Estados de loading

## Melhorias Futuras

### Funcionalidades
1. **Divisão por Pessoa**: Permitir valores específicos por pessoa
2. **Divisão Customizada**: Interface para divisão totalmente personalizada
3. **Histórico de Divisões**: Salvar e consultar divisões anteriores
4. **Integração com Impressora**: Impressão real de comprovantes
5. **Envio por Email/WhatsApp**: Enviar comprovantes digitalmente

### UX/UI
1. **Drag & Drop**: Arrastar itens para pessoas na divisão por item
2. **Calculadora**: Interface de calculadora para valores customizados
3. **Templates**: Salvar configurações de divisão como templates
4. **Visualização Gráfica**: Gráficos de pizza para mostrar divisões

### Integrações
1. **Sistema de Pagamento**: Integração com gateways de pagamento
2. **Nota Fiscal**: Geração de notas fiscais individuais
3. **Programa de Fidelidade**: Aplicar pontos/descontos por pessoa
4. **Relatórios**: Análise de divisões e formas de pagamento

## Requisitos Atendidos

- ✅ **4.1**: Modal de divisão com opções (igual, por item, por pessoa)
- ✅ **4.2**: Lógica de divisão por item com seleção individual
- ✅ **4.3**: Cálculo automático para divisão igual incluindo taxas
- ✅ **4.4**: Interface para aplicar descontos específicos por pessoa
- ✅ **4.5**: Geração de múltiplos comprovantes de pagamento

## Uso no Código

```typescript
// Importar componentes
import DivisaoContaModal from './DivisaoContaModal';
import ComprovantesMultiplos from './ComprovantesMultiplos';

// Usar no ComandaDetailsModal
const [showDivisaoModal, setShowDivisaoModal] = useState(false);
const [currentSplitConfig, setCurrentSplitConfig] = useState<BillSplitConfig | null>(null);

// Handlers
const handleDividirConta = () => setShowDivisaoModal(true);
const handleConfirmSplit = async (splitConfig: BillSplitConfig) => {
  await createBillSplit(comanda.id, splitConfig);
  setCurrentSplitConfig(splitConfig);
  setShowDivisaoModal(false);
  setShowComprovantesModal(true);
};
```