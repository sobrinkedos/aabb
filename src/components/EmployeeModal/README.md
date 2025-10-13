# Modal de Funcionário - Sistema Melhorado

## Visão Geral

O novo modal de funcionário resolve os problemas identificados no sistema anterior:

✅ **Rolagem vertical adequada** - Modal responsivo com altura máxima de 90vh e rolagem suave
✅ **Sistema de permissões completo** - Controle granular de acesso por módulo e ação
✅ **Integração com app-garcom** - Configuração automática de acesso mobile para garçons
✅ **Validação robusta** - Validação em tempo real com feedback visual
✅ **Acessibilidade** - Navegação por teclado, ARIA labels e trap de foco

## Componentes

### EmployeeModal
Componente principal que orquestra todo o formulário.

```tsx
<EmployeeModal
  isOpen={true}
  onClose={() => setShowModal(false)}
  onSave={handleSave}
  mode="create" // ou "edit"
  employee={existingEmployee} // opcional para edição
/>
```

### PersonalInfoSection
Seção para dados pessoais (nome, CPF, email, telefone, data de contratação).

### RoleSection
Seção para seleção de função com aplicação automática de permissões.

### PermissionsSection
Seção para configuração granular de permissões por módulo.

## Funcionalidades

### Sistema de Permissões

As permissões são organizadas por módulos:
- **Bar/Atendimento** - Gestão de pedidos e atendimento
- **Cozinha** - Controle de preparo e status de pedidos
- **Caixa** - Pagamentos e fechamento
- **Relatórios** - Visualização de dados e métricas
- **Estoque** - Controle de inventário
- **Clientes** - Gestão de cadastro de clientes
- **Configurações** - Configurações do sistema
- **App Garçom** - Acesso ao aplicativo mobile

### Perfis Pré-definidos

Cada função tem um conjunto padrão de permissões:

- **Garçom** - Atendimento + acesso ao app mobile
- **Cozinheiro** - Cozinha + visualização de pedidos
- **Caixa** - Pagamentos + relatórios básicos
- **Supervisor** - Operações gerais + relatórios
- **Gerente** - Acesso amplo + configurações básicas
- **Administrador** - Acesso total

### Integração com App-Garcom

Quando um funcionário é cadastrado como garçom:
1. Recebe automaticamente acesso ao app mobile
2. Permissões específicas são aplicadas (mesas, pedidos, cardápio)
3. Limite de 2 dispositivos simultâneos
4. Sincronização automática com o sistema principal

### Validação

- **CPF** - Formato e verificação de duplicidade
- **Email** - Formato e unicidade
- **Telefone** - Formato brasileiro
- **Campos obrigatórios** - Nome, CPF, email, função, data de contratação

### Acessibilidade

- Navegação por teclado (Tab, Shift+Tab, Escape)
- ARIA labels e roles apropriados
- Trap de foco dentro do modal
- Suporte a screen readers

## Uso

### Cadastro de Novo Funcionário

```tsx
const handleCreateEmployee = async (employee: Employee) => {
  try {
    await createEmployee(employee);
    // Funcionário criado com sucesso
    // Se for garçom, acesso mobile configurado automaticamente
  } catch (error) {
    // Tratar erro
  }
};

<EmployeeModal
  isOpen={showNewModal}
  onClose={() => setShowNewModal(false)}
  onSave={handleCreateEmployee}
  mode="create"
/>
```

### Edição de Funcionário Existente

```tsx
const handleUpdateEmployee = async (employee: Employee) => {
  try {
    await updateEmployee(employee.id, employee);
    // Funcionário atualizado com sucesso
  } catch (error) {
    // Tratar erro
  }
};

<EmployeeModal
  isOpen={showEditModal}
  onClose={() => setShowEditModal(false)}
  onSave={handleUpdateEmployee}
  employee={selectedEmployee}
  mode="edit"
/>
```

## Estrutura de Dados

### Employee Interface

```typescript
interface Employee {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  role: EmployeeRole;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  hire_date: Date;
  observations?: string;
}
```

### Permission Interface

```typescript
interface Permission {
  id: string;
  module: ModuleType;
  action: ActionType;
  resource?: string;
}
```

## Testes

Execute os testes com:

```bash
npm test src/components/EmployeeModal
```

Os testes cobrem:
- Renderização do modal
- Funcionalidade de rolagem
- Acessibilidade
- Validação de formulário
- Integração de permissões

## Migração do Sistema Anterior

O sistema mantém compatibilidade com o backend existente através de funções de conversão:

- `convertEmployeeToBarEmployee()` - Converte do novo formato para o antigo
- `convertBarEmployeeToEmployee()` - Converte do antigo formato para o novo

Isso permite uma migração gradual sem quebrar a funcionalidade existente.