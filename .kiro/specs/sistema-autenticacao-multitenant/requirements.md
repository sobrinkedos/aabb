# Requirements Document

## Introduction

Este documento define os requisitos para um sistema completo de autenticação e gerenciamento de usuários multitenant. O sistema permitirá que empresas se registrem de forma independente, com cada empresa tendo seu próprio administrador e conjunto de usuários isolados. O administrador da empresa poderá gerenciar funcionários, definir permissões de acesso aos módulos do sistema e configurar aspectos específicos da empresa através de uma página de configurações.

## Requirements

### Requirement 1 - Registro de Empresa e Administrador

**User Story:** Como proprietário de uma empresa, eu quero me registrar no sistema criando uma conta de administrador, para que eu possa ter acesso exclusivo aos dados da minha empresa.

#### Critérios de Aceitação

1. QUANDO um usuário acessa a página de registro ENTÃO o sistema DEVE apresentar um formulário solicitando dados da empresa e do administrador
2. QUANDO o formulário é preenchido com dados válidos ENTÃO o sistema DEVE criar uma nova empresa no banco de dados
3. QUANDO a empresa é criada ENTÃO o sistema DEVE criar automaticamente o usuário administrador vinculado à empresa
4. QUANDO o registro é concluído ENTÃO o sistema DEVE enviar um email de confirmação para o administrador
5. QUANDO o administrador confirma o email ENTÃO o sistema DEVE ativar a conta e permitir o primeiro login
6. SE já existe uma empresa com o mesmo CNPJ ENTÃO o sistema DEVE rejeitar o registro e exibir mensagem de erro

### Requirement 2 - Isolamento de Dados por Empresa (Multitenancy)

**User Story:** Como administrador de uma empresa, eu quero que os dados da minha empresa sejam completamente isolados de outras empresas, para garantir privacidade e segurança.

#### Critérios de Aceitação

1. QUANDO um usuário faz login ENTÃO o sistema DEVE identificar a empresa do usuário e filtrar todos os dados por essa empresa
2. QUANDO qualquer consulta é executada ENTÃO o sistema DEVE aplicar automaticamente filtros de empresa (tenant_id)
3. SE um usuário tenta acessar dados de outra empresa ENTÃO o sistema DEVE negar o acesso e registrar a tentativa
4. QUANDO dados são criados ENTÃO o sistema DEVE automaticamente associar o tenant_id da empresa do usuário logado
5. QUANDO relatórios são gerados ENTÃO o sistema DEVE incluir apenas dados da empresa do usuário logado

### Requirement 3 - Gerenciamento de Funcionários pelo Administrador

**User Story:** Como administrador da empresa, eu quero cadastrar funcionários e definir se eles terão acesso ao sistema, para controlar quem pode usar as funcionalidades.

#### Critérios de Aceitação

1. QUANDO o administrador acessa a página Funcionários ENTÃO o sistema DEVE exibir lista de funcionários da empresa
2. QUANDO o administrador cadastra um novo funcionário ENTÃO o sistema DEVE permitir marcar se o funcionário terá acesso ao sistema
3. SE o funcionário terá acesso ao sistema ENTÃO o sistema DEVE gerar automaticamente usuário e senha provisória
4. QUANDO usuário e senha são gerados ENTÃO o sistema DEVE enviar credenciais por email para o funcionário
5. QUANDO o funcionário faz primeiro login ENTÃO o sistema DEVE obrigar a alteração da senha provisória
6. QUANDO o administrador desativa um funcionário ENTÃO o sistema DEVE bloquear imediatamente o acesso do usuário

### Requirement 4 - Sistema de Permissões por Módulos

**User Story:** Como administrador da empresa, eu quero definir quais módulos cada funcionário pode acessar, para controlar as funcionalidades disponíveis para cada usuário.

#### Critérios de Aceitação

1. QUANDO o administrador edita um funcionário ENTÃO o sistema DEVE exibir lista de módulos disponíveis (Dashboard, Monitor Bar, Atendimento Bar, Monitor Cozinha, Gestão de Caixa, Clientes, Funcionários, Sócios)
2. QUANDO permissões são definidas ENTÃO o sistema DEVE salvar as permissões específicas para cada módulo
3. QUANDO um funcionário faz login ENTÃO o sistema DEVE carregar apenas os módulos permitidos no menu
4. SE um funcionário tenta acessar módulo não permitido ENTÃO o sistema DEVE negar acesso e redirecionar para página inicial
5. QUANDO permissões são alteradas ENTÃO o sistema DEVE aplicar as mudanças imediatamente na próxima requisição do usuário

### Requirement 5 - Autenticação Segura

**User Story:** Como usuário do sistema, eu quero fazer login de forma segura, para proteger minha conta e os dados da empresa.

#### Critérios de Aceitação

1. QUANDO um usuário faz login ENTÃO o sistema DEVE validar credenciais usando hash seguro da senha
2. QUANDO login é bem-sucedido ENTÃO o sistema DEVE gerar token JWT com informações do usuário e empresa
3. QUANDO token expira ENTÃO o sistema DEVE solicitar novo login automaticamente
4. SE há múltiplas tentativas de login falhadas ENTÃO o sistema DEVE bloquear temporariamente a conta
5. QUANDO usuário esquece a senha ENTÃO o sistema DEVE permitir reset via email com link temporário
6. QUANDO senha é alterada ENTÃO o sistema DEVE invalidar todas as sessões ativas do usuário

### Requirement 6 - Página de Configurações da Empresa

**User Story:** Como administrador da empresa, eu quero configurar aspectos específicos da minha empresa, para personalizar o sistema conforme minhas necessidades.

#### Critérios de Aceitação

1. QUANDO administrador acessa Configurações ENTÃO o sistema DEVE exibir seções organizadas de configurações
2. QUANDO configurações de empresa são alteradas ENTÃO o sistema DEVE salvar apenas para a empresa do usuário logado
3. QUANDO configurações de segurança são alteradas ENTÃO o sistema DEVE solicitar confirmação da senha atual
4. QUANDO configurações são salvas ENTÃO o sistema DEVE aplicar as mudanças imediatamente no sistema
5. SE configurações inválidas são inseridas ENTÃO o sistema DEVE exibir mensagens de erro específicas

### Requirement 7 - Auditoria e Logs de Segurança

**User Story:** Como administrador da empresa, eu quero visualizar logs de acesso e ações dos usuários, para monitorar a segurança e uso do sistema.

#### Critérios de Aceitação

1. QUANDO qualquer ação sensível é executada ENTÃO o sistema DEVE registrar log com usuário, data/hora e ação
2. QUANDO administrador acessa logs ENTÃO o sistema DEVE exibir apenas logs da sua empresa
3. QUANDO tentativas de acesso negadas ocorrem ENTÃO o sistema DEVE registrar detalhes da tentativa
4. QUANDO logs são consultados ENTÃO o sistema DEVE permitir filtros por usuário, data e tipo de ação
5. QUANDO logs atingem limite de armazenamento ENTÃO o sistema DEVE arquivar logs antigos automaticamente

### Requirement 8 - Gestão de Sessões e Segurança

**User Story:** Como usuário do sistema, eu quero que minha sessão seja gerenciada de forma segura, para evitar acessos não autorizados.

#### Critérios de Aceitação

1. QUANDO usuário fica inativo por período definido ENTÃO o sistema DEVE fazer logout automático
2. QUANDO usuário faz login em novo dispositivo ENTÃO o sistema DEVE notificar sobre nova sessão
3. QUANDO administrador desativa usuário ENTÃO o sistema DEVE invalidar imediatamente todas as sessões ativas
4. SE token é comprometido ENTÃO o sistema DEVE permitir invalidação manual de todas as sessões
5. QUANDO usuário faz logout ENTÃO o sistema DEVE invalidar o token atual e limpar dados locais