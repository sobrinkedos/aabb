# Plano de Implementação - Módulo de Gestão de Cardápio

- [x] 1. Configurar estrutura de banco de dados e migrações





  - Criar migração para tabelas de receitas, ingredientes, informações nutricionais, combos e histórico de preços
  - Implementar políticas RLS para as novas tabelas
  - Criar índices para otimização de consultas
  - _Requisitos: 1.1, 1.2, 1.3, 3.1, 3.2_

- [ ] 2. Estender interfaces TypeScript e tipos base
  - Adicionar interfaces Recipe, RecipeIngredient, NutritionalInfo, MenuCombo no arquivo types/index.ts
  - Estender interface MenuItem existente para ExtendedMenuItem
  - Criar enums para AvailabilityStatus e DietaryRestrictions
  - _Requisitos: 1.1, 2.1, 2.2, 4.1_

- [ ] 3. Implementar serviços de acesso a dados (Repository Layer)
  - Criar RecipeService para operações CRUD de receitas
  - Implementar NutritionalInfoService para gestão de dados nutricionais
  - Desenvolver ComboService para gestão de combos e promoções
  - Criar PricingService para cálculos de custo e histórico de preços
  - _Requisitos: 1.2, 1.3, 2.1, 3.1, 6.1_

- [ ] 4. Desenvolver componente RecipeBuilder para criação de receitas
  - Criar formulário para informações básicas da receita (tempo, porções, dificuldade)
  - Implementar seletor de ingredientes com busca e autocomplete
  - Adicionar funcionalidade de ingredientes alternativos
  - Implementar cálculo automático de custo por porção
  - Criar validações para receitas (mínimo de ingredientes, quantidades válidas)
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 5. Implementar componente NutritionalInfoForm
  - Criar formulário para inserção manual de dados nutricionais
  - Implementar cálculo automático baseado em ingredientes (quando possível)
  - Adicionar seleção de alérgenos com checkboxes
  - Criar seleção de restrições dietéticas (vegetariano, vegano, sem glúten)
  - Implementar validações nutricionais (valores não negativos, limites razoáveis)
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Desenvolver sistema de precificação dinâmica (PricingManager)
  - Criar componente para visualização de breakdown de custos
  - Implementar cálculo automático de preço sugerido baseado na margem
  - Adicionar alertas visuais quando margem fica abaixo do mínimo
  - Criar histórico de mudanças de preço com justificativas
  - Implementar comparação com preços de concorrência (campo manual)
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Criar sistema de categorização e organização do cardápio
  - Estender categorias existentes com subcategorias
  - Implementar ordenação customizável de itens dentro das categorias
  - Criar sistema de tags para facilitar busca (ex: "picante", "light", "especial")
  - Adicionar funcionalidade de busca avançada por ingredientes
  - Implementar filtros por tempo de preparo
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Implementar controle de disponibilidade em tempo real
  - Criar sistema de monitoramento de estoque de ingredientes
  - Implementar lógica para indisponibilizar pratos quando ingredientes acabam
  - Adicionar controle manual de disponibilidade (pausar itens)
  - Criar sistema de sazonalidade com ativação/desativação automática
  - Implementar notificações para chefs sobre mudanças de disponibilidade
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Desenvolver sistema de combos e promoções (ComboBuilder)
  - Criar interface para seleção de itens do combo
  - Implementar cálculo automático de desconto e preço final
  - Adicionar validação de viabilidade do combo (margem mínima)
  - Criar sistema de validade com datas de início e fim
  - Implementar condições especiais (válido apenas no almoço, etc.)
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Criar cardápio digital interativo (DigitalMenu)
  - Desenvolver layout responsivo para visualização do cardápio
  - Implementar galeria de fotos dos pratos com zoom
  - Adicionar filtros por categoria, restrições dietéticas e alérgenos
  - Criar visualização detalhada de informações nutricionais
  - Implementar sistema de personalização de pedidos (observações, modificações)
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Implementar dashboard de gestão do cardápio
  - Criar KPIs principais (itens mais vendidos, margem média, itens indisponíveis)
  - Implementar gráficos de performance por categoria
  - Adicionar alertas de itens com baixa rotação
  - Criar resumo de custos e margens por período
  - Implementar exportação de relatórios em PDF/Excel
  - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Desenvolver integração com módulo de estoque existente
  - Criar listeners para mudanças de preço de ingredientes
  - Implementar recálculo automático de custos quando preços mudam
  - Adicionar sincronização de disponibilidade baseada no estoque
  - Criar alertas quando ingredientes ficam abaixo do mínimo
  - Implementar sugestões de compra baseadas nas receitas
  - _Requisitos: 1.2, 3.1, 5.1, 5.2_

- [ ] 13. Implementar sistema de notificações e alertas
  - Criar notificações para mudanças significativas de custo (>10%)
  - Implementar alertas de margem baixa ou negativa
  - Adicionar notificações de itens sazonais próximos do período
  - Criar alertas de ingredientes em falta afetando receitas
  - Implementar notificações de combos com baixa performance
  - _Requisitos: 3.1, 5.4, 6.4, 8.4_

- [ ] 14. Criar testes unitários para lógica de negócio
  - Testar cálculos de custo e margem com diferentes cenários
  - Implementar testes para validações de receitas e ingredientes
  - Criar testes para lógica de disponibilidade e sazonalidade
  - Testar cálculos de combos e aplicação de descontos
  - Implementar testes para formatação de dados nutricionais
  - _Requisitos: Todos os requisitos - validação de implementação_

- [ ] 15. Implementar integração com sistema de pedidos existente
  - Estender OrderItem para incluir personalizações e observações
  - Implementar validação de disponibilidade antes de confirmar pedido
  - Adicionar aplicação automática de preços de combo
  - Criar sincronização de tempo de preparo estimado
  - Implementar envio de especificações detalhadas para a cozinha
  - _Requisitos: 7.3, 7.4, 7.5_

- [ ] 16. Criar interface de administração do cardápio
  - Desenvolver página principal de gestão com navegação entre seções
  - Implementar CRUD completo para itens do cardápio
  - Adicionar interface para gestão de receitas e ingredientes
  - Criar seção para configuração de combos e promoções
  - Implementar área de relatórios e análises
  - _Requisitos: 4.1, 6.1, 8.1, 8.2, 8.3_

- [ ] 17. Implementar otimizações de performance
  - Adicionar cache para cálculos de custo frequentes
  - Implementar lazy loading para imagens do cardápio
  - Criar índices de busca otimizados para ingredientes e receitas
  - Implementar debounce para recálculos automáticos
  - Adicionar paginação para listas grandes de itens
  - _Requisitos: Performance geral do sistema_

- [ ] 18. Realizar testes de integração e validação final
  - Testar fluxo completo: criar receita → calcular custo → definir preço → disponibilizar
  - Validar integração com estoque: mudança de preço → recálculo → alerta
  - Testar cardápio digital: filtrar → visualizar → personalizar → pedir
  - Validar sistema de combos: criar → aplicar desconto → vender
  - Testar notificações e alertas em cenários reais
  - _Requisitos: Validação de todos os requisitos implementados_