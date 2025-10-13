# Documento de Requisitos - Melhorias no Modal de Cadastro de Funcionário

## Introdução

O modal de cadastro de funcionário atual apresenta limitações importantes que afetam a usabilidade e funcionalidade do sistema. Especificamente, o modal não possui rolagem vertical adequada para acomodar todos os campos necessários, e não inclui um sistema de permissões para controlar o que cada funcionário pode executar dentro do sistema. Esta spec visa resolver essas limitações e criar uma experiência mais completa e profissional.

## Requisitos

### Requisito 1

**História do Usuário:** Como um administrador, eu quero que o modal de cadastro de funcionário tenha rolagem vertical adequada, para que eu possa visualizar e preencher todos os campos necessários sem problemas de interface.

#### Critérios de Aceitação

1. QUANDO abro o modal de cadastro ENTÃO o sistema DEVE exibir uma interface com altura máxima definida e rolagem vertical automática
2. QUANDO há muitos campos no formulário ENTÃO o sistema DEVE permitir rolagem suave sem cortar conteúdo
3. QUANDO redimensiono a janela ENTÃO o modal DEVE se adaptar mantendo a rolagem funcional
4. QUANDO uso dispositivos com telas menores ENTÃO o modal DEVE ser responsivo e manter a usabilidade
5. QUANDO rolo o conteúdo ENTÃO os botões de ação DEVEM permanecer visíveis e acessíveis

### Requisito 2

**História do Usuário:** Como um administrador, eu quero definir permissões específicas para cada funcionário, para que eu possa controlar exatamente quais funcionalidades cada pessoa pode acessar no sistema.

#### Critérios de Aceitação

1. QUANDO cadastro um funcionário ENTÃO o sistema DEVE permitir selecionar permissões granulares por módulo
2. QUANDO seleciono permissões ENTÃO o sistema DEVE organizar as opções por categorias (Bar, Cozinha, Caixa, Relatórios, etc.)
3. QUANDO defino um perfil de acesso ENTÃO o sistema DEVE salvar as permissões de forma estruturada no banco
4. QUANDO funcionário faz login ENTÃO o sistema DEVE aplicar as permissões definidas limitando o acesso
5. QUANDO modifico permissões ENTÃO o sistema DEVE atualizar o acesso em tempo real

### Requisito 3

**História do Usuário:** Como um administrador, eu quero ter perfis de permissão pré-definidos, para que eu possa aplicar rapidamente configurações comuns sem precisar selecionar cada permissão individualmente.

#### Critérios de Aceitação

1. QUANDO seleciono função do funcionário ENTÃO o sistema DEVE sugerir permissões apropriadas automaticamente
2. QUANDO escolho "Garçom" ENTÃO o sistema DEVE aplicar permissões de atendimento, pedidos e comandas
3. QUANDO escolho "Cozinheiro" ENTÃO o sistema DEVE aplicar permissões de cozinha e visualização de pedidos
4. QUANDO escolho "Caixa" ENTÃO o sistema DEVE aplicar permissões de pagamento e fechamento
5. QUANDO escolho "Supervisor" ENTÃO o sistema DEVE aplicar permissões ampliadas incluindo relatórios

### Requisito 4

**História do Usuário:** Como um administrador, eu quero validação completa dos dados do funcionário, para que eu possa garantir que todas as informações necessárias sejam coletadas corretamente.

#### Critérios de Aceitação

1. QUANDO preencho campos obrigatórios ENTÃO o sistema DEVE validar formato e completude em tempo real
2. QUANDO insiro CPF ENTÃO o sistema DEVE validar formato e verificar se já existe no sistema
3. QUANDO insiro email ENTÃO o sistema DEVE validar formato e unicidade
4. QUANDO seleciono função ENTÃO o sistema DEVE tornar campos específicos obrigatórios conforme o cargo
5. QUANDO submeto o formulário ENTÃO o sistema DEVE impedir envio se houver erros de validação

### Requisito 5

**História do Usuário:** Como um funcionário, eu quero que meus dados sejam organizados de forma clara no modal, para que eu possa revisar e confirmar as informações antes do cadastro.

#### Critérios de Aceitação

1. QUANDO visualizo o modal ENTÃO o sistema DEVE organizar campos em seções lógicas (Dados Pessoais, Contato, Função, Permissões)
2. QUANDO navego entre seções ENTÃO o sistema DEVE manter o contexto e dados preenchidos
3. QUANDO há erros de validação ENTÃO o sistema DEVE destacar claramente os campos problemáticos
4. QUANDO completo uma seção ENTÃO o sistema DEVE indicar visualmente o progresso
5. QUANDO reviso dados ENTÃO o sistema DEVE permitir edição fácil de qualquer campo

### Requisito 6

**História do Usuário:** Como um administrador, eu quero que o sistema mantenha histórico de permissões, para que eu possa auditar mudanças e reverter alterações se necessário.

#### Critérios de Aceitação

1. QUANDO modifico permissões ENTÃO o sistema DEVE registrar quem fez a alteração e quando
2. QUANDO consulto histórico ENTÃO o sistema DEVE mostrar todas as mudanças de permissão do funcionário
3. QUANDO há problemas de acesso ENTÃO o sistema DEVE permitir consultar permissões atuais vs anteriores
4. QUANDO funcionário é desligado ENTÃO o sistema DEVE manter histórico para auditoria
5. QUANDO preciso reverter ENTÃO o sistema DEVE permitir restaurar permissões de uma data específica

### Requisito 7

**História do Usuário:** Como um desenvolvedor, eu quero que o modal seja componentizado e reutilizável, para que eu possa manter consistência visual e facilitar manutenção futura.

#### Critérios de Aceitação

1. QUANDO implemento o modal ENTÃO o sistema DEVE usar componentes reutilizáveis para campos e validações
2. QUANDO adiciono novos campos ENTÃO o sistema DEVE permitir extensão sem quebrar funcionalidade existente
3. QUANDO aplico estilos ENTÃO o sistema DEVE manter consistência com o design system atual
4. QUANDO testo o componente ENTÃO o sistema DEVE ter cobertura de testes unitários adequada
5. QUANDO integro com backend ENTÃO o sistema DEVE ter tratamento robusto de erros e loading states