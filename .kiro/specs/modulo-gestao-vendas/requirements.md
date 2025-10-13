# Documento de Requisitos - Módulo de Gestão de Vendas

## Introdução

O módulo de gestão de vendas é o núcleo operacional do ClubManager Pro, responsável por processar todas as transações comerciais do clube. Este módulo já possui implementação básica para pedidos do bar e cozinha, mas precisa ser expandido para incluir gestão completa de vendas, controle de caixa, múltiplas formas de pagamento e integração com sistemas fiscais.

## Requisitos

### Requisito 1

**História do Usuário:** Como um funcionário do bar, eu quero processar pedidos de forma rápida e intuitiva, para que eu possa atender clientes eficientemente durante períodos de alta demanda.

#### Critérios de Aceitação

1. QUANDO seleciono itens do cardápio ENTÃO o sistema DEVE calcular o total automaticamente incluindo impostos
2. QUANDO adiciono um item ENTÃO o sistema DEVE verificar disponibilidade em estoque em tempo real
3. QUANDO finalizo o pedido ENTÃO o sistema DEVE gerar número único de identificação
4. QUANDO há modificações no pedido ENTÃO o sistema DEVE permitir edição antes da confirmação
5. QUANDO o pedido é confirmado ENTÃO o sistema DEVE enviar para a cozinha automaticamente se houver itens de comida

### Requisito 2

**História do Usuário:** Como um cliente, eu quero múltiplas opções de pagamento, para que eu possa escolher a forma mais conveniente de pagar minha conta.

#### Critérios de Aceitação

1. QUANDO finalizo um pedido ENTÃO o sistema DEVE oferecer opções: dinheiro, cartão, PIX e crédito de membro
2. QUANDO seleciono PIX ENTÃO o sistema DEVE gerar QR code e chave para pagamento instantâneo
3. QUANDO seleciono cartão ENTÃO o sistema DEVE integrar com terminal de pagamento
4. QUANDO seleciono crédito de membro ENTÃO o sistema DEVE verificar saldo disponível
5. QUANDO o pagamento é confirmado ENTÃO o sistema DEVE emitir comprovante fiscal

### Requisito 3

**História do Usuário:** Como um gestor, eu quero controlar o caixa diário, para que eu possa acompanhar entradas, saídas e fechamento de caixa de cada turno.

#### Critérios de Aceitação

1. QUANDO inicio um turno ENTÃO o sistema DEVE registrar valor inicial do caixa
2. QUANDO há vendas ENTÃO o sistema DEVE registrar todas as transações por forma de pagamento
3. QUANDO há sangria ou suprimento ENTÃO o sistema DEVE permitir registro com justificativa
4. QUANDO fecho o caixa ENTÃO o sistema DEVE calcular valor esperado vs valor físico
5. QUANDO há divergência ENTÃO o sistema DEVE exigir justificativa e aprovação de supervisor

### Requisito 4

**História do Usuário:** Como um funcionário, eu quero processar devoluções e cancelamentos, para que eu possa resolver problemas de atendimento de forma adequada.

#### Critérios de Aceitação

1. QUANDO um cliente solicita cancelamento ENTÃO o sistema DEVE permitir cancelar itens não iniciados na cozinha
2. QUANDO há devolução ENTÃO o sistema DEVE registrar motivo e autorização de supervisor
3. QUANDO processo estorno ENTÃO o sistema DEVE reverter pagamento na forma original
4. QUANDO há cancelamento parcial ENTÃO o sistema DEVE recalcular total e processar diferença

### Requisito 5

**História do Usuário:** Como um administrador, eu quero relatórios de vendas detalhados, para que eu possa analisar performance e tomar decisões estratégicas.

#### Critérios de Aceitação

1. QUANDO acesso relatórios ENTÃO o sistema DEVE mostrar vendas por período, produto e funcionário
2. QUANDO analiso produtos ENTÃO o sistema DEVE exibir ranking de mais vendidos e margem de lucro
3. QUANDO comparo períodos ENTÃO o sistema DEVE destacar crescimento ou declínio por categoria
4. QUANDO exporto dados ENTÃO o sistema DEVE gerar relatórios em PDF e CSV

### Requisito 6

**História do Usuário:** Como um funcionário, eu quero gerenciar comandas de mesa, para que eu possa controlar consumo de clientes que permanecem no clube por períodos prolongados.

#### Critérios de Aceitação

1. QUANDO abro uma comanda ENTÃO o sistema DEVE associar a uma mesa ou cliente específico
2. QUANDO adiciono itens ENTÃO o sistema DEVE acumular na comanda sem processar pagamento
3. QUANDO o cliente solicita conta ENTÃO o sistema DEVE exibir todos os itens consumidos
4. QUANDO fecho a comanda ENTÃO o sistema DEVE processar pagamento total e liberar mesa

### Requisito 7

**História do Usuário:** Como um gestor, eu quero integração fiscal completa, para que o clube esteja em conformidade com todas as obrigações tributárias.

#### Critérios de Aceitação

1. QUANDO processo uma venda ENTÃO o sistema DEVE emitir cupom fiscal eletrônico automaticamente
2. QUANDO há cancelamento ENTÃO o sistema DEVE emitir nota de cancelamento fiscal
3. QUANDO fecho o dia ENTÃO o sistema DEVE gerar arquivo SPED para contabilidade
4. QUANDO há auditoria ENTÃO o sistema DEVE fornecer relatórios fiscais completos

### Requisito 8

**História do Usuário:** Como um funcionário, eu quero sistema de desconto e promoções, para que eu possa aplicar ofertas especiais e fidelizar clientes.

#### Critérios de Aceitação

1. QUANDO aplico desconto ENTÃO o sistema DEVE exigir autorização baseada no valor e perfil do funcionário
2. QUANDO há promoção ativa ENTÃO o sistema DEVE aplicar automaticamente quando condições são atendidas
3. QUANDO membro tem desconto ENTÃO o sistema DEVE aplicar percentual baseado no tipo de associação
4. QUANDO há cupom ENTÃO o sistema DEVE validar código e aplicar desconto correspondente

### Requisito 9

**História do Usuário:** Como um funcionário do bar, eu quero fechar contas com controle de comissão de garçom, para que eu possa processar o fechamento completo incluindo a taxa de serviço.

#### Critérios de Aceitação

1. QUANDO clico no botão "Fechar Conta" ENTÃO o sistema DEVE abrir modal com lista completa dos produtos consumidos
2. QUANDO o modal é exibido ENTÃO o sistema DEVE mostrar totalizador geral da conta
3. QUANDO o modal é exibido ENTÃO o sistema DEVE apresentar campo para percentual de comissão com valor padrão de 10%
4. QUANDO modifico o percentual de comissão ENTÃO o sistema DEVE permitir valores de 0% a 30%
5. QUANDO o percentual é zerado ENTÃO o sistema DEVE aceitar 0% como valor válido
6. QUANDO confirmo o fechamento ENTÃO o sistema DEVE calcular valor total incluindo comissão
7. QUANDO a conta é fechada ENTÃO o sistema DEVE gerar pendência de pagamento no caixa
8. QUANDO a pendência é criada ENTÃO o sistema DEVE registrar valor total, comissão do garçom e método de pagamento selecionado