# Design Document

## Overview

O sistema de gerenciamento de funcionários é uma solução completa para criação,
gerenciamento e controle de acesso de funcionários em estabelecimentos. O
sistema integra múltiplas tabelas do banco de dados (bar_employees,
usuarios_empresa, permissoes_usuario) com o sistema de autenticação Supabase
Auth, proporcionando um fluxo unificado de criação de funcionários com
credenciais automáticas e permissões baseadas em funções.

## Architecture

### Arquitetura Geral

O sistema segue uma arquitetura em camadas com separação clara de
responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ EmployeeModal   │  │ CredentialsModal│  │ BarEmployees │ │
│  │                 │  │                 │  │ Module       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │EmployeeCreation │  │ useBarEmployees │  │ Permission   │ │
│  │ Service         │  │ Hook            │  │ Presets      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Supabase Client │  │ Supabase Admin  │  │ Database     │ │
│  │ (anon key)      │  │ (service role)  │  │ Tables       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Criação de Funcionário**: UI → EmployeeCreationService → Supabase (Auth +
   Database)
2. **Autenticação**: Supabase Auth → Profile Creation → Permission Assignment
3. **Gerenciamento**: UI → Hooks → Database Operations
4. **Controle de Acesso**: Login → Permission Check → Module Access

## Components and Interfaces

### Core Service: EmployeeCreationService

**Responsabilidades:**

- Orquestrar todo o processo de criação de funcionários
- Gerenciar fallbacks para problemas de Auth
- Integrar múltiplas tabelas do banco
- Gerar credenciais automáticas

**Interface Principal:**

```typescript
interface EmployeeCreationData {
  // Dados básicos
  nome_completo: string;
  email: string;
  telefone?: string;
  cpf?: string;

  // Função no estabelecimento
  bar_role: "atendente" | "garcom" | "cozinheiro" | "barman" | "gerente";
  shift_preference?: "manha" | "tarde" | "noite" | "qualquer";
  specialties?: string[];
  commission_rate?: number;
  observacoes?: string;

  // Configurações de sistema
  cargo: string;
  tipo_usuario?: "funcionario" | "administrador";
  papel?: "USER" | "MANAGER" | "ADMIN";
  tem_acesso_sistema: boolean;

  // Permissões específicas
  permissoes_modulos: ModulePermissions;
}

interface EmployeeCreationResult {
  success: boolean;
  employee_id?: string;
  user_id?: string;
  usuario_empresa_id?: string;
  credentials?: {
    email: string;
    senha_temporaria: string;
    deve_alterar_senha: boolean;
  };
  error?: string;
  details?: CreationDetails;
}
```

### UI Components

**EmployeeModal**

- Formulário unificado para criação/edição
- Validação de dados em tempo real
- Integração com sistema de permissões
- Suporte a diferentes modos (create/edit)

**CredentialsModal**

- Exibição segura de credenciais geradas
- Opções de cópia e impressão
- Instruções para primeiro acesso

**BarEmployeesModule**

- Lista completa de funcionários
- Filtros por função e status
- Ações de gerenciamento (ativar/desativar/editar)
- Estatísticas em tempo real

### Hooks de Gerenciamento

**useBarEmployees**

- CRUD operations para funcionários
- Filtros e busca
- Estatísticas agregadas
- Cache e sincronização

**useEmployeeCreation**

- Wrapper para EmployeeCreationService
- Estados de loading e erro
- Integração com permissões padrão

## Data Models

### Tabelas Principais

**bar_employees**

```sql
CREATE TABLE bar_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES auth.users(id),
  bar_role TEXT NOT NULL,
  shift_preference TEXT DEFAULT 'qualquer',
  specialties TEXT[],
  commission_rate DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**usuarios_empresa**

```sql
CREATE TABLE usuarios_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  empresa_id UUID NOT NULL,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT NOT NULL,
  tipo_usuario TEXT DEFAULT 'funcionario',
  status TEXT DEFAULT 'ativo',
  senha_provisoria BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  tem_acesso_sistema BOOLEAN DEFAULT false,
  papel TEXT DEFAULT 'USER',
  is_primeiro_usuario BOOLEAN DEFAULT false,
  tentativas_login_falhadas INTEGER DEFAULT 0,
  total_logins INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**permissoes_usuario**

```sql
CREATE TABLE permissoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_empresa_id UUID REFERENCES usuarios_empresa(id),
  modulo TEXT NOT NULL,
  permissoes JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modelo de Permissões

```typescript
interface ModulePermission {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  administrar: boolean;
}

interface ModulePermissions {
  [moduleName: string]: ModulePermission;
}
```

**Módulos do Sistema:**

- dashboard: Painel principal
- monitor_bar: Monitoramento do bar
- atendimento_bar: Atendimento e pedidos
- monitor_cozinha: Cozinha e preparação
- gestao_caixa: Caixa e pagamentos
- clientes: Gestão de clientes
- funcionarios: Gestão de funcionários
- relatorios: Relatórios e análises
- configuracoes: Configurações do sistema

## Error Handling

### Estratégia de Fallback

O sistema implementa uma estratégia robusta de fallback para lidar com falhas:

1. **Auth Fallback**: Se a criação no Supabase Auth falhar, o funcionário é
   criado sem credenciais
2. **Metadata Fallback**: Se falhar com metadata, tenta novamente sem metadata
3. **Partial Success**: Permite sucesso parcial com avisos apropriados
4. **Cleanup**: Remove dados criados em caso de falha crítica

### Tipos de Erro

```typescript
enum ErrorType {
  VALIDATION_ERROR = "validation_error",
  AUTH_ERROR = "auth_error",
  DATABASE_ERROR = "database_error",
  PERMISSION_ERROR = "permission_error",
  NETWORK_ERROR = "network_error",
}

interface ErrorDetails {
  type: ErrorType;
  message: string;
  field?: string;
  code?: string;
  recoverable: boolean;
}
```

### Tratamento por Camada

**Service Layer:**

- Logs detalhados para debugging
- Retry automático para erros temporários
- Fallback para operações críticas

**UI Layer:**

- Mensagens de erro user-friendly
- Estados de loading apropriados
- Opções de retry para o usuário

## Testing Strategy

### Testes Unitários

**EmployeeCreationService:**

- Teste de criação completa com sucesso
- Teste de fallback para Auth
- Teste de validação de dados
- Teste de cleanup em caso de erro

**Hooks:**

- Teste de estados de loading
- Teste de operações CRUD
- Teste de filtros e busca
- Teste de cache e sincronização

### Testes de Integração

**Fluxo Completo:**

- Criação de funcionário end-to-end
- Login com credenciais geradas
- Verificação de permissões
- Operações de gerenciamento

**Cenários de Erro:**

- Falha na criação do Auth
- Problemas de conectividade
- Dados inválidos
- Permissões insuficientes

### Testes de UI

**Componentes:**

- Renderização correta dos formulários
- Validação em tempo real
- Interações do usuário
- Estados de loading e erro

**Fluxos de Usuário:**

- Criação de funcionário completa
- Edição de dados existentes
- Visualização de detalhes
- Gerenciamento de status

## Security Considerations

### Autenticação e Autorização

**Row Level Security (RLS):**

- Políticas por empresa (multi-tenant)
- Controle de acesso baseado em função
- Isolamento de dados entre empresas

**Permissões Granulares:**

- Controle por módulo e ação
- Hierarquia de funções
- Auditoria de acessos

### Proteção de Dados

**Credenciais:**

- Senhas temporárias seguras
- Força alteração no primeiro login
- Não armazenamento de senhas em plain text

**Dados Pessoais:**

- Validação de CPF e email
- Logs de auditoria
- Conformidade com LGPD

## Performance Considerations

### Otimizações de Banco

**Índices:**

```sql
CREATE INDEX idx_bar_employees_empresa_id ON bar_employees(empresa_id);
CREATE INDEX idx_bar_employees_active ON bar_employees(is_active);
CREATE INDEX idx_usuarios_empresa_email ON usuarios_empresa(email);
CREATE INDEX idx_permissoes_usuario_empresa ON permissoes_usuario(usuario_empresa_id);
```

**Queries Otimizadas:**

- Joins eficientes entre tabelas relacionadas
- Paginação para listas grandes
- Cache de permissões frequentes

### Frontend

**Lazy Loading:**

- Componentes carregados sob demanda
- Dados paginados
- Imagens e recursos otimizados

**State Management:**

- Cache inteligente de dados
- Sincronização eficiente
- Debounce em buscas

## Deployment and Monitoring

### Configuração de Ambiente

**Variáveis Necessárias:**

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (para admin operations)

**Configurações de Segurança:**

- RLS habilitado
- Políticas de acesso configuradas
- Rate limiting ativo

### Monitoramento

**Métricas Importantes:**

- Taxa de sucesso na criação de funcionários
- Tempo de resposta das operações
- Erros de autenticação
- Uso de permissões por módulo

**Logs de Auditoria:**

- Criação/edição de funcionários
- Alterações de permissões
- Tentativas de acesso negadas
- Operações administrativas
