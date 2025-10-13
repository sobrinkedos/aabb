# Plano de Implementação - Melhorias no Modal de Cadastro de Funcionário

- [x] 1. Configurar estrutura base do componente modal
  - Criar componente EmployeeModal com layout responsivo e rolagem vertical
  - Implementar sistema de overlay e controle de abertura/fechamento
  - Configurar altura máxima (90vh) e overflow-y: auto para rolagem
  - Adicionar header e footer fixos (sticky) com body rolável
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implementar sistema de tipos e interfaces
  - Criar types/employee.types.ts com interface Employee completa
  - Definir types/permissions.types.ts com sistema de permissões
  - Implementar enum EmployeeRole com todos os cargos (waiter, cook, cashier, supervisor, manager, admin)
  - Adicionar tipos para MobileAppAccess e MobilePermission
  - _Requisitos: 2.1, 2.2, 3.1, 7.1_

- [ ] 3. Criar estrutura de banco de dados
  - Aplicar migração para tabela employees com campos completos
  - Criar tabela employee_permissions para controle granular
  - Implementar tabela permission_history para auditoria
  - Adicionar tabelas mobile_app_access e mobile_permissions para app-garcom
  - Configurar RLS (Row Level Security) para isolamento por empresa
  - _Requisitos: 2.3, 6.1, 6.2_

- [x] 4. Desenvolver componentes de formulário
  - Implementar PersonalInfoSection com campos nome, CPF, telefone
  - Criar ContactSection com email e validação de unicidade
  - Desenvolver RoleSection com seleção de função e descrição
  - Adicionar campos de data de contratação e observações
  - _Requisitos: 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 5. Implementar sistema de permissões granulares
  - Criar PermissionsSection com organização por módulos
  - Implementar checkboxes para cada permissão (view, create, edit, delete, manage)
  - Organizar permissões por categorias (Bar, Cozinha, Caixa, Relatórios, etc.)
  - Adicionar seção específica para permissões do app-garcom
  - _Requisitos: 2.1, 2.2, 2.3_

- [x] 6. Desenvolver perfis de permissão pré-definidos
  - Criar utils/permissionPresets.ts com ROLE_PRESETS
  - Implementar aplicação automática de permissões por função
  - Adicionar lógica para garçom receber acesso ao app-garcom automaticamente
  - Permitir customização manual após aplicar preset
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implementar sistema de validação completo
  - Criar useEmployeeValidation hook com todas as regras
  - Validar CPF com formato e verificação de duplicidade
  - Implementar validação de email com formato e unicidade
  - Adicionar validação condicional baseada na função selecionada
  - Exibir erros em tempo real com destaque visual
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Desenvolver hook de gerenciamento do formulário
  - Criar useEmployeeForm com estado completo do modal
  - Implementar controle de loading, saving, errors e isDirty
  - Adicionar lógica de salvamento com tratamento de erros
  - Integrar configuração automática de acesso mobile para garçons
  - _Requisitos: 7.2, 7.3_

- [ ] 9. Implementar integração com app-garcom
  - Criar função configureMobileAccess para garçons
  - Implementar inserção automática em mobile_app_access
  - Aplicar permissões específicas do mobile (tables, orders, menu, customers)
  - Configurar limite de dispositivos e sincronização
  - _Requisitos: Integração específica com app-garcom_

- [ ] 10. Adicionar sistema de histórico e auditoria
  - Implementar registro de mudanças na permission_history
  - Criar função para consultar histórico de permissões
  - Adicionar interface para visualizar alterações anteriores
  - Implementar funcionalidade de reverter permissões
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11. Implementar acessibilidade e navegação por teclado
  - Adicionar atributos ARIA (role="dialog", aria-modal, aria-labelledby)
  - Implementar trap de foco dentro do modal
  - Configurar navegação por Tab e fechamento com Escape
  - Adicionar labels descritivos e screen reader support
  - _Requisitos: 7.4_

- [x] 12. Desenvolver sistema de organização visual
  - Implementar seções colapsáveis para organizar campos
  - Adicionar indicadores visuais de progresso de preenchimento
  - Criar destaque visual para campos com erro de validação
  - Implementar navegação entre seções mantendo contexto
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Criar testes unitários e de integração
  - Escrever testes para renderização e comportamento do modal
  - Testar sistema de rolagem e responsividade
  - Implementar testes de validação e tratamento de erros
  - Criar testes de integração para salvamento e permissões
  - Testar aplicação automática de permissões para garçons
  - _Requisitos: 7.5_

- [ ] 14. Implementar otimizações de performance
  - Adicionar lazy loading para PermissionsSection
  - Implementar memoização de componentes pesados
  - Otimizar re-renders com React.memo e useMemo
  - Configurar debounce para validações em tempo real
  - _Requisitos: 7.1, 7.2_

- [x] 15. Integrar modal com sistema existente
  - Conectar modal com página de funcionários existente
  - Implementar botão "Novo Funcionário" que abre o modal
  - Adicionar funcionalidade de edição de funcionários existentes
  - Configurar refresh da lista após salvamento
  - Testar integração completa com fluxo de usuário
  - _Requisitos: 7.3, 7.4, 7.5_