# Documento de Requisitos

## Introdução

Esta funcionalidade permite aos usuários visualizar uma lista detalhada dos itens com estoque baixo e compartilhar essa lista via WhatsApp para facilitar o processo de compras e reposição de estoque. O objetivo é otimizar o gerenciamento de compras e garantir que o clube nunca fique sem produtos essenciais.

## Requisitos

### Requisito 1

**História do Usuário:** Como um gerente de estoque, eu quero visualizar uma lista detalhada dos itens com estoque baixo, para que eu possa identificar rapidamente quais produtos precisam ser repostos.

#### Critérios de Aceitação

1. QUANDO o usuário clica no card "Itens com Estoque Baixo" no dashboard do módulo de estoque ENTÃO o sistema DEVE abrir uma página dedicada com a lista completa de itens com estoque baixo
2. QUANDO a página de estoque baixo é carregada ENTÃO o sistema DEVE exibir todos os itens onde estoqueAtual <= estoqueMinimo
3. QUANDO um item é exibido na lista ENTÃO o sistema DEVE mostrar nome, categoria, estoque atual, estoque mínimo, unidade, fornecedor e quantidade sugerida para compra
4. QUANDO não há itens com estoque baixo ENTÃO o sistema DEVE exibir uma mensagem informativa "Parabéns! Todos os itens estão com estoque adequado"

### Requisito 2

**História do Usuário:** Como um gerente de estoque, eu quero compartilhar a lista de compras via WhatsApp, para que eu possa enviar rapidamente para fornecedores ou responsáveis pelas compras.

#### Critérios de Aceitação

1. QUANDO o usuário está na página de estoque baixo ENTÃO o sistema DEVE exibir um botão "Compartilhar no WhatsApp"
2. QUANDO o usuário clica no botão "Compartilhar no WhatsApp" ENTÃO o sistema DEVE abrir um modal para inserir o número de telefone
3. QUANDO o usuário insere um número válido e confirma ENTÃO o sistema DEVE gerar uma mensagem formatada com a lista de compras
4. QUANDO a mensagem é gerada ENTÃO o sistema DEVE abrir o WhatsApp Web/App com a mensagem pré-preenchida para o número informado
5. QUANDO a mensagem é formatada ENTÃO o sistema DEVE incluir data/hora, nome do clube, lista de itens com quantidades sugeridas e assinatura do responsável

### Requisito 3

**História do Usuário:** Como um usuário, eu quero que a lista de compras seja bem formatada e profissional, para que os fornecedores possam entender facilmente o que precisa ser comprado.

#### Critérios de Aceitação

1. QUANDO a mensagem do WhatsApp é gerada ENTÃO o sistema DEVE formatar com cabeçalho contendo nome do clube e data
2. QUANDO os itens são listados ENTÃO o sistema DEVE agrupar por categoria para melhor organização
3. QUANDO cada item é listado ENTÃO o sistema DEVE incluir nome, quantidade atual, quantidade mínima e quantidade sugerida para compra
4. QUANDO a mensagem é finalizada ENTÃO o sistema DEVE incluir rodapé com informações de contato e assinatura
5. QUANDO há fornecedor específico para um item ENTÃO o sistema DEVE destacar essa informação na lista

### Requisito 4

**História do Usuário:** Como um usuário, eu quero poder editar a lista antes de enviar, para que eu possa ajustar quantidades ou remover itens conforme necessário.

#### Critérios de Aceitação

1. QUANDO o usuário visualiza a lista de estoque baixo ENTÃO o sistema DEVE permitir editar a quantidade sugerida para cada item
2. QUANDO o usuário edita uma quantidade ENTÃO o sistema DEVE validar que o valor é maior que zero
3. QUANDO o usuário marca/desmarca itens ENTÃO o sistema DEVE incluir/excluir da lista de compras
4. QUANDO o usuário gera a mensagem ENTÃO o sistema DEVE usar apenas os itens selecionados com as quantidades editadas
5. QUANDO há alterações não salvas ENTÃO o sistema DEVE exibir um aviso antes de sair da página

### Requisito 5

**História do Usuário:** Como um usuário, eu quero salvar listas de compras para referência futura, para que eu possa acompanhar o histórico de pedidos e compras realizadas.

#### Critérios de Aceitação

1. QUANDO o usuário gera uma lista de compras ENTÃO o sistema DEVE oferecer a opção de salvar a lista
2. QUANDO uma lista é salva ENTÃO o sistema DEVE armazenar data, itens, quantidades e status (pendente/enviada/concluída)
3. QUANDO o usuário acessa o histórico ENTÃO o sistema DEVE exibir todas as listas salvas ordenadas por data
4. QUANDO uma lista histórica é visualizada ENTÃO o sistema DEVE permitir reenviar ou duplicar a lista
5. QUANDO uma compra é realizada ENTÃO o sistema DEVE permitir marcar a lista como "concluída" e atualizar o estoque

### Requisito 6

**História do Usuário:** Como um administrador, eu quero configurar templates de mensagem personalizados, para que as mensagens enviadas sigam o padrão de comunicação do clube.

#### Critérios de Aceitação

1. QUANDO o administrador acessa configurações ENTÃO o sistema DEVE permitir editar o template da mensagem do WhatsApp
2. QUANDO o template é editado ENTÃO o sistema DEVE permitir usar variáveis como {clube}, {data}, {itens}, {responsavel}
3. QUANDO um template é salvo ENTÃO o sistema DEVE validar a sintaxe das variáveis
4. QUANDO uma mensagem é gerada ENTÃO o sistema DEVE usar o template personalizado configurado
5. QUANDO não há template personalizado ENTÃO o sistema DEVE usar um template padrão profissional