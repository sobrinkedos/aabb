# Documento de Requisitos - Aplicativo Nativo do Garçom

## Introdução

O aplicativo nativo do garçom é uma ferramenta especializada para otimizar o atendimento no restaurante/bar do clube, permitindo que os garçons gerenciem mesas, comandas e pedidos de forma eficiente através de dispositivos móveis. O app deve funcionar offline, sincronizar automaticamente e integrar-se completamente com o sistema de caixa e cozinha.

## Requisitos

### Requisito 1

**História do Usuário:** Como um garçom, eu quero visualizar o layout das mesas em tempo real, para que eu possa identificar rapidamente quais mesas estão ocupadas, livres ou precisam de atenção.

#### Critérios de Aceitação

1. QUANDO abro o app ENTÃO o sistema DEVE exibir mapa visual das mesas com status colorido
2. QUANDO mesa muda status ENTÃO o sistema DEVE atualizar cor automaticamente (livre=verde, ocupada=vermelho, aguardando=amarelo)
3. QUANDO toco em mesa ENTÃO o sistema DEVE mostrar detalhes da comanda e tempo de ocupação
4. QUANDO há pedido pronto ENTÃO o sistema DEVE destacar mesa com notificação visual
5. QUANDO mesa precisa atenção ENTÃO o sistema DEVE permitir sinalização de outros garçons

### Requisito 2

**História do Usuário:** Como um garçom, eu quero abrir e gerenciar comandas, para que eu possa registrar consumo dos clientes de forma organizada e precisa.

#### Critérios de Aceitação

1. QUANDO cliente chega ENTÃO o sistema DEVE permitir abrir nova comanda selecionando mesa
2. QUANDO abro comanda ENTÃO o sistema DEVE registrar horário, garçom responsável e número da mesa
3. QUANDO adiciono consumo ENTÃO o sistema DEVE permitir buscar itens por categoria ou nome
4. QUANDO cliente pede conta ENTÃO o sistema DEVE calcular total com taxas e permitir divisão
5. QUANDO finalizo comanda ENTÃO o sistema DEVE processar pagamento e liberar mesa

### Requisito 3

**História do Usuário:** Como um garçom, eu quero fazer pedidos para cozinha e bar, para que os itens sejam preparados rapidamente e na ordem correta.

#### Critérios de Aceitação

1. QUANDO seleciono item ENTÃO o sistema DEVE permitir especificar quantidade e observações
2. QUANDO envio pedido ENTÃO o sistema DEVE transmitir imediatamente para cozinha/bar
3. QUANDO item fica pronto ENTÃO o sistema DEVE notificar qual mesa e itens para entrega
4. QUANDO entrego item ENTÃO o sistema DEVE permitir marcar como servido
5. QUANDO há cancelamento ENTÃO o sistema DEVE comunicar cozinha/bar e ajustar comanda

### Requisito 4

**História do Usuário:** Como um garçom, eu quero acessar cardápio atualizado, para que eu possa informar preços, ingredientes e disponibilidade aos clientes.

#### Critérios de Aceitação

1. QUANDO consulto cardápio ENTÃO o sistema DEVE mostrar itens organizados por categoria
2. QUANDO item está indisponível ENTÃO o sistema DEVE sinalizar claramente e impedir pedido
3. QUANDO cliente pergunta ingredientes ENTÃO o sistema DEVE exibir composição detalhada
4. QUANDO há promoção ENTÃO o sistema DEVE destacar ofertas especiais
5. QUANDO preço muda ENTÃO o sistema DEVE atualizar automaticamente no app

### Requisito 5

**História do Usuário:** Como um garçom, eu quero processar diferentes formas de pagamento, para que eu possa finalizar comandas conforme preferência do cliente.

#### Critérios de Aceitação

1. QUANDO cliente quer pagar ENTÃO o sistema DEVE oferecer opções (dinheiro, cartão, PIX, conta do clube)
2. QUANDO pagamento é cartão ENTÃO o sistema DEVE integrar com máquina de cartão
3. QUANDO é PIX ENTÃO o sistema DEVE gerar QR code para pagamento
4. QUANDO é conta do clube ENTÃO o sistema DEVE validar limite e debitar automaticamente
5. QUANDO há gorjeta ENTÃO o sistema DEVE permitir adicionar valor ou percentual

### Requisito 6

**História do Usuário:** Como um garçom, eu quero trabalhar offline, para que eu possa continuar atendendo mesmo quando há problemas de conexão.

#### Critérios de Aceitação

1. QUANDO perco conexão ENTÃO o sistema DEVE continuar funcionando com dados locais
2. QUANDO faço pedido offline ENTÃO o sistema DEVE armazenar para enviar quando conectar
3. QUANDO conexão retorna ENTÃO o sistema DEVE sincronizar automaticamente todos os dados
4. QUANDO há conflito ENTÃO o sistema DEVE priorizar dados mais recentes ou alertar para resolução
5. QUANDO estou offline ENTÃO o sistema DEVE indicar claramente status da conexão

### Requisito 7

**História do Usuário:** Como um garçom, eu quero receber notificações importantes, para que eu seja alertado sobre pedidos prontos, chamadas de clientes e situações urgentes.

#### Critérios de Aceitação

1. QUANDO pedido fica pronto ENTÃO o sistema DEVE notificar com som e vibração
2. QUANDO cliente chama ENTÃO o sistema DEVE alertar qual mesa precisa de atenção
3. QUANDO há problema na cozinha ENTÃO o sistema DEVE comunicar atraso ou cancelamento
4. QUANDO turno termina ENTÃO o sistema DEVE lembrar de fechar comandas pendentes
5. QUANDO há emergência ENTÃO o sistema DEVE permitir comunicação rápida com gerência

### Requisito 8

**História do Usuário:** Como um garçom, eu quero dividir contas facilmente, para que eu possa atender grupos que querem pagar separadamente.

#### Critérios de Aceitação

1. QUANDO cliente quer dividir ENTÃO o sistema DEVE permitir separar itens por pessoa
2. QUANDO divido igualmente ENTÃO o sistema DEVE calcular valor por pessoa automaticamente
3. QUANDO divido por consumo ENTÃO o sistema DEVE permitir alocar itens específicos
4. QUANDO há desconto ENTÃO o sistema DEVE aplicar proporcionalmente ou em conta específica
5. QUANDO finalizo divisão ENTÃO o sistema DEVE gerar comprovantes separados

### Requisito 9

**História do Usuário:** Como um garçom, eu quero acompanhar meu desempenho, para que eu possa melhorar atendimento e controlar minhas vendas e gorjetas.

#### Critérios de Aceitação

1. QUANDO consulto relatório ENTÃO o sistema DEVE mostrar vendas do dia/turno
2. QUANDO vejo gorjetas ENTÃO o sistema DEVE exibir total recebido e média por mesa
3. QUANDO analiso tempo ENTÃO o sistema DEVE mostrar tempo médio de atendimento por mesa
4. QUANDO comparo performance ENTÃO o sistema DEVE permitir ver histórico de dias anteriores
5. QUANDO há meta ENTÃO o sistema DEVE indicar progresso e valor restante para atingir

### Requisito 10

**História do Usuário:** Como um garçom, eu quero comunicar com outros funcionários, para que eu possa coordenar atendimento e resolver situações em equipe.

#### Critérios de Aceitação

1. QUANDO preciso ajuda ENTÃO o sistema DEVE permitir chamar outro garçom ou supervisor
2. QUANDO há informação importante ENTÃO o sistema DEVE permitir enviar mensagem para equipe
3. QUANDO cliente tem pedido especial ENTÃO o sistema DEVE comunicar detalhes para cozinha
4. QUANDO há problema ENTÃO o sistema DEVE permitir reportar para gerência com foto
5. QUANDO turno muda ENTÃO o sistema DEVE permitir passar informações para próximo garçom

### Requisito 11

**História do Usuário:** Como um garçom, eu quero gerenciar reservas de mesa, para que eu possa organizar chegadas e otimizar ocupação do restaurante.

#### Critérios de Aceitação

1. QUANDO consulto reservas ENTÃO o sistema DEVE mostrar agenda do dia com horários e nomes
2. QUANDO cliente chega ENTÃO o sistema DEVE permitir confirmar presença e alocar mesa
3. QUANDO há atraso ENTÃO o sistema DEVE alertar sobre reservas não confirmadas
4. QUANDO mesa é solicitada ENTÃO o sistema DEVE verificar disponibilidade e permitir reserva
5. QUANDO há cancelamento ENTÃO o sistema DEVE liberar mesa e notificar outros garçons

### Requisito 12

**História do Usuário:** Como um supervisor, eu quero monitorar operação em tempo real, para que eu possa identificar gargalos e otimizar atendimento.

#### Critérios de Aceitação

1. QUANDO acesso dashboard ENTÃO o sistema DEVE mostrar status de todas as mesas
2. QUANDO há demora ENTÃO o sistema DEVE alertar sobre mesas com tempo excessivo
3. QUANDO analiso fluxo ENTÃO o sistema DEVE mostrar tempo médio por etapa do atendimento
4. QUANDO há problema ENTÃO o sistema DEVE permitir redirecionar garçons para áreas críticas
5. QUANDO turno termina ENTÃO o sistema DEVE gerar relatório de performance da equipe