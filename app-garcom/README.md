# App Garçom - Sistema de Mesas e Comandas

Aplicativo móvel nativo para garçons gerenciarem mesas, comandas e pedidos no restaurante/bar do clube.

## 🚀 Tecnologias

- **React Native** com Expo
- **TypeScript** para type safety
- **Redux Toolkit** para gerenciamento de estado
- **React Navigation** para navegação
- **TanStack Query** para cache e sincronização
- **Supabase** para backend e real-time
- **AsyncStorage** para persistência local

## 📱 Funcionalidades

- ✅ Visualização de mapa de mesas em tempo real
- ✅ Gerenciamento completo de comandas
- ✅ Sistema de pedidos integrado com cozinha
- ✅ Cardápio mobile otimizado
- ✅ Múltiplas formas de pagamento
- ✅ Funcionamento offline com sincronização
- ✅ Notificações push
- ✅ Comunicação entre funcionários
- ✅ Relatórios de desempenho

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   Edite o arquivo `.env` com suas configurações do Supabase.

4. Execute o projeto:
   ```bash
   npm start
   ```

## 📝 Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS
- `npm run web` - Executa no navegador
- `npm run lint` - Executa o linter
- `npm run lint:fix` - Corrige problemas do linter
- `npm run format` - Formata o código com Prettier
- `npm run type-check` - Verifica tipos TypeScript

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── screens/        # Telas da aplicação
├── services/       # Serviços (API, sincronização, etc.)
├── store/          # Configuração do Redux
├── types/          # Definições de tipos TypeScript
└── utils/          # Utilitários e constantes
```

## 🔧 Configuração

### Variáveis de Ambiente

- `EXPO_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `EXPO_PUBLIC_ENVIRONMENT` - Ambiente (development/production)
- `EXPO_PUBLIC_DEBUG_MODE` - Modo debug (true/false)

### ESLint e Prettier

O projeto está configurado com ESLint e Prettier para manter a qualidade e consistência do código.

## 📱 Desenvolvimento

### Estrutura de Componentes

Todos os componentes seguem o padrão:
- Tipagem TypeScript completa
- Props interface definida
- Estilos usando StyleSheet
- Documentação JSDoc quando necessário

### Gerenciamento de Estado

- **Redux Toolkit** para estado global
- **React Query** para cache de dados da API
- **AsyncStorage** para persistência local

### Sincronização Offline

O app funciona completamente offline e sincroniza automaticamente quando a conexão é restaurada.

## 🚀 Deploy

O projeto está configurado para build e deploy automático usando:
- Expo Application Services (EAS)
- Over-the-air updates
- Distribuição via App Store e Google Play

## 📄 Licença

Este projeto é propriedade do clube e destinado ao uso interno.