# Documento de Requisitos - Módulo de Gestão de Cardápio

## Introdução

O módulo de gestão de cardápio é responsável por controlar todos os itens disponíveis no bar e cozinha, incluindo preços, ingredientes, tempo de preparo, categorização e disponibilidade. O módulo básico já existe, mas precisa ser expandido com funcionalidades como receitas detalhadas, controle nutricional, sazonalidade, combos e integração com estoque.

## Requisitos

### Requisito 1

**História do Usuário:** Como um chef, eu quero criar receitas detalhadas para cada prato, para que eu possa padronizar preparo, controlar custos e garantir qualidade consistente.

#### Critérios de Aceitação

1. QUANDO crio receita ENTÃO o sistema DEVE permitir adicionar ingredientes com quantidades precisas
2. QUANDO adiciono ingrediente ENTÃO o sistema DEVE calcular custo baseado no preço atual do estoque
3. QUANDO altero receita ENTÃO o sistema DEVE recalcular automaticamente custo e margem
4. QUANDO há substituição ENTÃO o sistema DEVE permitir ingredientes alternativos com ajuste de custo
5. QUANDO finalizo receita ENTÃO o sistema DEVE gerar ficha técnica para a cozinha

### Requisito 2

**História do Usuário:** Como um nutricionista, eu quero informações nutricionais completas, para que eu possa oferecer opções saudáveis e atender restrições alimentares dos membros.

#### Critérios de Aceitação

1. QUANDO cadastro ingrediente ENTÃO o sistema DEVE incluir valores nutricionais por porção
2. QUANDO crio prato ENTÃO o sistema DEVE calcular automaticamente calorias, proteínas, carboidratos e gorduras
3. QUANDO há alérgeno ENTÃO o sistema DEVE destacar claramente na descrição do item
4. QUANDO membro tem restrição ENTÃO o sistema DEVE filtrar cardápio mostrando apenas opções adequadas
5. QUANDO exibo cardápio ENTÃO o sistema DEVE mostrar informações nutricionais de forma clara

### Requisito 3

**História do Usuário:** Como um gestor, eu quero controlar preços dinamicamente, para que eu possa ajustar valores baseado em custos, demanda e estratégia comercial.

#### Critérios de Aceitação

1. QUANDO custo de ingrediente aumenta ENTÃO o sistema DEVE alertar sobre impacto na margem
2. QUANDO defino margem mínima ENTÃO o sistema DEVE sugerir preço de venda automaticamente
3. QUANDO há promoção ENTÃO o sistema DEVE permitir preços especiais por período limitado
4. QUANDO comparo concorrência ENTÃO o sistema DEVE destacar itens com preços desalinhados
5. QUANDO analiso vendas ENTÃO o sistema DEVE mostrar elasticidade de preço por produto

### Requisito 4

**História do Usuário:** Como um funcionário do bar, eu quero cardápio organizado por categorias, para que eu possa encontrar rapidamente itens durante atendimento aos clientes.

#### Critérios de Aceitação

1. QUANDO acesso cardápio ENTÃO o sistema DEVE organizar por categorias (bebidas, pratos, sobremesas, etc.)
2. QUANDO busco item ENTÃO o sistema DEVE permitir pesquisa por nome, ingrediente ou categoria
3. QUANDO item não está disponível ENTÃO o sistema DEVE destacar visualmente ou ocultar
4. QUANDO há item em promoção ENTÃO o sistema DEVE destacar com preço especial
5. QUANDO seleciono item ENTÃO o sistema DEVE mostrar tempo de preparo estimado

### Requisito 5

**História do Usuário:** Como um chef, eu quero controlar disponibilidade em tempo real, para que eu possa gerenciar cardápio baseado no estoque disponível e capacidade da cozinha.

#### Critérios de Aceitação

1. QUANDO ingrediente acaba ENTÃO o sistema DEVE automaticamente indisponibilizar pratos que o utilizam
2. QUANDO cozinha está sobrecarregada ENTÃO o sistema DEVE permitir pausar itens com maior tempo de preparo
3. QUANDO há produto sazonal ENTÃO o sistema DEVE ativar/desativar automaticamente baseado no período
4. QUANDO faço pré-preparo ENTÃO o sistema DEVE aumentar disponibilidade de itens relacionados
5. QUANDO encerra expediente ENTÃO o sistema DEVE desativar itens que não podem ser preparados

### Requisito 6

**História do Usuário:** Como um gestor comercial, eu quero criar combos e promoções, para que eu possa aumentar ticket médio e oferecer valor agregado aos clientes.

#### Critérios de Aceitação

1. QUANDO crio combo ENTÃO o sistema DEVE permitir agrupar itens com desconto especial
2. QUANDO cliente seleciona combo ENTÃO o sistema DEVE aplicar preço promocional automaticamente
3. QUANDO há condição especial ENTÃO o sistema DEVE validar regras (ex: válido apenas no almoço)
4. QUANDO analiso performance ENTÃO o sistema DEVE mostrar vendas de combos vs itens individuais
5. QUANDO combo não é viável ENTÃO o sistema DEVE alertar sobre margem negativa

### Requisito 7

**História do Usuário:** Como um administrador, eu quero cardápio digital interativo, para que clientes possam visualizar opções, fazer pedidos e personalizar itens de forma autônoma.

#### Critérios de Aceitação

1. QUANDO cliente acessa cardápio ENTÃO o sistema DEVE exibir fotos, descrições e preços atualizados
2. QUANDO seleciona item ENTÃO o sistema DEVE permitir personalização (ponto da carne, acompanhamentos)
3. QUANDO faz pedido ENTÃO o sistema DEVE calcular total e permitir pagamento online
4. QUANDO há observação ENTÃO o sistema DEVE permitir comentários especiais para a cozinha
5. QUANDO pedido é confirmado ENTÃO o sistema DEVE enviar para cozinha com todas as especificações

### Requisito 8

**História do Usuário:** Como um analista, eu quero relatórios de performance do cardápio, para que eu possa identificar itens mais vendidos, lucrativos e oportunidades de melhoria.

#### Critérios de Aceitação

1. QUANDO acesso relatórios ENTÃO o sistema DEVE mostrar ranking de itens por vendas e margem
2. QUANDO analiso sazonalidade ENTÃO o sistema DEVE identificar padrões de consumo por período
3. QUANDO comparo categorias ENTÃO o sistema DEVE destacar segmentos com melhor performance
4. QUANDO há item com baixa rotação ENTÃO o sistema DEVE sugerir remoção ou promoção
5. QUANDO exporto dados ENTÃO o sistema DEVE gerar relatórios para análise externa