# 🚀 ClubManager Pro - Sistema de Gerenciamento de Clubes

Bem-vindo ao **ClubManager Pro**, um sistema modular e escalável projetado para modernizar e otimizar a gestão de clubes recreativos e esportivos. Esta aplicação foi construída com tecnologias de ponta para oferecer uma experiência de usuário fluida, performance em tempo real e uma arquitetura flexível.

## 🔑 Acesso e Demonstração

Para explorar todas as funcionalidades do sistema, você pode utilizar o acesso de demonstração:

1.  **Acesso Rápido:** Na tela de login, clique no botão **"🚀 Entrar como Demo"**.
2.  **Login Manual:** Utilize as seguintes credenciais:
    *   **Email:** `demo@clubmanager.com`
    *   **Senha:** `demo123456`

O usuário de demonstração possui perfil de **administrador**, garantindo acesso irrestrito a todos os módulos implementados.

---

## ✨ Funcionalidades Implementadas

O sistema já conta com uma base sólida e quatro módulos principais totalmente funcionais, todos integrados com o Supabase para persistência de dados e atualizações em tempo real.

### 1. 📊 **Dashboard Executivo**
O ponto central do sistema, oferecendo uma visão geral e em tempo real das operações mais importantes.
- **KPIs Principais:** Faturamento do dia, total de vendas, pedidos pendentes e itens com estoque baixo.
- **Pedidos Recentes:** Acompanhe os últimos pedidos com status e valor.
- **Alertas de Estoque:** Lista dinâmica de itens que precisam de reposição urgente.
- **Navegação Rápida:** Atalhos para os principais módulos do sistema.

### 2. 🍻 **Módulo Bar**
Gestão completa do fluxo de vendas do bar, desde o pedido até a entrega.
- **Criação de Pedidos:** Interface modal intuitiva para adicionar itens a uma comanda ou mesa.
- **Gestão de Comandas:** Visualização de todos os pedidos em cards, com filtros por status (Pendente, Preparando, Pronto, Entregue).
- **Atualização de Status:** Altere o status de um pedido com um único clique, notificando outros setores em tempo real.
- **Cálculo Automático:** O valor total do pedido é calculado automaticamente.

### 3. 👨‍🍳 **Módulo Cozinha**
Interface otimizada para a equipe da cozinha gerenciar o preparo dos pratos.
- **Fila de Pedidos Inteligente:** Os pedidos da cozinha são exibidos em cards, com priorização automática baseada no tempo de espera.
- **Informações Claras:** Cada card exibe os itens, quantidades, observações e tempo estimado de preparo.
- **Controle de Status:** A equipe pode marcar um pedido como "Em Preparo" e "Pronto", atualizando o status para todo o sistema.
- **Gestão de Cardápio:** Ferramentas para adicionar, editar e controlar a disponibilidade dos pratos.

### 4. 📦 **Módulo Estoque**
Controle preciso de todos os insumos e produtos do clube.
- **Dashboard de Inventário:** KPIs como valor total do estoque, contagem de itens e alertas de estoque baixo.
- **Lista de Itens:** Visualização detalhada de cada item, incluindo estoque atual, mínimo, custo e fornecedor.
- **Gestão CRUD:** Adicione, edite e remova itens do inventário através de um formulário completo.
- **Alertas Visuais:** Itens com estoque baixo são destacados automaticamente na lista.

### 5. 👥 **Módulo Membros**
Gerenciamento centralizado de todos os sócios do clube.
- **Dashboard de Membros:** KPIs como total de sócios, membros ativos e novos registros no último mês.
- **Visualização em Grid:** Apresentação dos membros em cards visuais com foto, nome, status e plano.
- **Busca e Filtros:** Encontre membros rapidamente por nome ou status.
- **Gestão CRUD:** Adicione novos sócios e edite perfis existentes com facilidade.

### 🔒 **Autenticação e Segurança**
- **Integração com Supabase Auth:** Sistema de login seguro com gerenciamento de sessão.
- **Perfis de Usuário:** Tabela `profiles` associada aos usuários para armazenamento de informações adicionais, como o nível de permissão (`role`).
- **Políticas de Segurança (RLS):** Estrutura de banco de dados pronta para a implementação de regras de acesso em nível de linha, garantindo que cada usuário veja apenas os dados que tem permissão.

---

## 🔄 Fluxo de Utilização (Exemplo Prático)

1.  **Login:** Um funcionário do bar acessa o sistema com seu email e senha.
2.  **Novo Pedido (Bar):** Ele vai ao **Módulo Bar**, clica em "Novo Pedido", informa o número da mesa (ex: 12), adiciona 2 sucos e 1 porção de batatas, e confirma. O pedido é criado com o status "Pendente".
3.  **Notificação em Tempo Real (Cozinha):** Instantaneamente, o novo pedido aparece na tela do **Módulo Cozinha**, pois contém um item alimentar. O card do pedido é destacado com prioridade "Normal".
4.  **Preparo (Cozinha):** O cozinheiro clica em "Iniciar Preparo". O status do pedido muda para "Preparando" em todo o sistema.
5.  **Gestão de Estoque (Gerente):** Ao mesmo tempo, um gerente no **Módulo Estoque** nota que as batatas estão com estoque baixo, pois o card do item está vermelho. Ele clica em "Editar", atualiza a quantidade após uma nova entrega e salva. O alerta desaparece.
6.  **Pedido Pronto (Cozinha):** O cozinheiro finaliza o prato e clica em "Marcar como Pronto".
7.  **Entrega (Bar):** O garçom vê no **Módulo Bar** que o pedido da mesa 12 está "Pronto". Ele retira o pedido e clica em "Marcar como Entregue". O pedido é finalizado.
8.  **Análise (Dashboard):** O valor do pedido é somado ao "Faturamento Hoje" no **Dashboard Executivo**.

---

## 🏆 Sugestões para Evolução (Próximos Passos)

Para tornar o **ClubManager Pro** uma solução de nível enterprise, sugerimos as seguintes implementações:

### Módulos Adicionais
-   **Módulo Financeiro:**
    -   Controle de fluxo de caixa (contas a pagar e a receber).
    -   Integração com gateways de pagamento para cobrança de mensalidades.
    -   Geração de faturas e relatórios financeiros detalhados.
-   **Módulo de Reservas:**
    -   Sistema para reserva de quadras, quiosques e salões de festa.
    -   Calendário de disponibilidade com pagamento online integrado.
-   **Portal do Sócio:**
    -   Área exclusiva para membros consultarem seus extratos, fazerem reservas e atualizarem seus dados cadastrais.

### Melhorias de Funcionalidades
-   **Relatórios Avançados:**
    -   Criação de gráficos interativos para análise de vendas por produto, faturamento por período, etc.
    -   Funcionalidade para exportar dados (pedidos, membros, estoque) para `CSV` ou `PDF`.
-   **Permissões Granulares:**
    -   Expandir o sistema de `roles` (`admin`, `manager`, `employee`) para controlar o acesso a funcionalidades específicas dentro de cada módulo.
-   **Notificações Push:**
    -   Implementar notificações via Web Push API para alertar a equipe sobre novos pedidos ou alertas críticos, mesmo com a aplicação em segundo plano.

### Melhorias Técnicas e de UX
-   **Testes Automatizados:**
    -   Implementar uma suíte de testes (unitários e de integração) com ferramentas como Vitest e React Testing Library para garantir a estabilidade do código.
-   **Modo Offline:**
    -   Utilizar Service Workers para permitir que funcionalidades críticas (como criar um pedido) funcionem mesmo com instabilidade na conexão de internet.
-   **Dark Mode:**
    -   Adicionar um tema escuro para melhorar a usabilidade em ambientes com pouca luz.
