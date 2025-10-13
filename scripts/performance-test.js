#!/usr/bin/env node

/**
 * Script para testar e comparar performance entre versões otimizada e original
 */

const fs = require('fs');
const path = require('path');

const PERFORMANCE_CONFIG_PATH = path.join(__dirname, '../src/config/performance.ts');

function updatePerformanceConfig(useOptimized) {
  const configContent = `// Configurações de performance para o sistema
export const PERFORMANCE_CONFIG = {
  // Ativar versão otimizada do AppContext
  USE_OPTIMIZED_CONTEXT: ${useOptimized},
  
  // Ativar versão otimizada do Dashboard
  USE_OPTIMIZED_DASHBOARD: ${useOptimized},
  
  // Configurações de carregamento lazy
  LAZY_LOADING: {
    // Carregar menu items apenas quando necessário
    MENU_ITEMS: ${useOptimized},
    
    // Carregar inventory apenas quando necessário
    INVENTORY: ${useOptimized},
    
    // Carregar members apenas quando necessário
    MEMBERS: ${useOptimized},
    
    // Carregar kitchen/bar orders apenas quando necessário
    KITCHEN_BAR_ORDERS: ${useOptimized}
  },
  
  // Configurações de cache
  CACHE: {
    // Tempo de cache para dados do dashboard (em ms)
    DASHBOARD_CACHE_TIME: 30000, // 30 segundos
    
    // Tempo de cache para estatísticas (em ms)
    STATS_CACHE_TIME: 60000, // 1 minuto
    
    // Limite de itens em cache
    MAX_CACHED_ITEMS: 100
  },
  
  // Configurações de paginação
  PAGINATION: {
    // Número de pedidos carregados inicialmente
    INITIAL_ORDERS_LIMIT: ${useOptimized ? 20 : 100},
    
    // Número de itens de estoque baixo mostrados
    LOW_STOCK_LIMIT: ${useOptimized ? 10 : 50},
    
    // Número de notificações mantidas
    NOTIFICATIONS_LIMIT: ${useOptimized ? 5 : 20}
  },
  
  // Configurações de real-time
  REALTIME: {
    // Debounce para atualizações em tempo real (em ms)
    UPDATE_DEBOUNCE: ${useOptimized ? 500 : 100},
    
    // Intervalo mínimo entre atualizações (em ms)
    MIN_UPDATE_INTERVAL: ${useOptimized ? 1000 : 500},
    
    // Desabilitar subscriptions desnecessárias
    DISABLE_UNUSED_SUBSCRIPTIONS: ${useOptimized}
  },
  
  // Configurações de animações
  ANIMATIONS: {
    // Reduzir animações para melhor performance
    REDUCE_MOTION: false,
    
    // Duração padrão das animações (em segundos)
    DEFAULT_DURATION: ${useOptimized ? 0.3 : 0.5},
    
    // Delay entre animações em sequência (em segundos)
    STAGGER_DELAY: ${useOptimized ? 0.05 : 0.1}
  }
};

// Função para verificar se deve usar versão otimizada
export const shouldUseOptimized = (feature: keyof typeof PERFORMANCE_CONFIG) => {
  return PERFORMANCE_CONFIG[feature] === true;
};

// Função para obter configuração específica
export const getPerformanceConfig = <T extends keyof typeof PERFORMANCE_CONFIG>(
  key: T
): typeof PERFORMANCE_CONFIG[T] => {
  return PERFORMANCE_CONFIG[key];
};`;

  fs.writeFileSync(PERFORMANCE_CONFIG_PATH, configContent);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'enable':
      updatePerformanceConfig(true);
      console.log('✅ Otimizações ATIVADAS');
      console.log('📊 Execute "npm run dev" para testar');
      break;
      
    case 'disable':
      updatePerformanceConfig(false);
      console.log('❌ Otimizações DESATIVADAS (versão original)');
      console.log('📊 Execute "npm run dev" para testar');
      break;
      
    case 'status':
      const currentConfig = fs.readFileSync(PERFORMANCE_CONFIG_PATH, 'utf8');
      const isOptimized = currentConfig.includes('USE_OPTIMIZED_CONTEXT: true');
      console.log(`📊 Status atual: ${isOptimized ? 'OTIMIZADO' : 'ORIGINAL'}`);
      break;
      
    default:
      console.log(`
🚀 Script de Teste de Performance

Comandos disponíveis:
  enable   - Ativa todas as otimizações
  disable  - Desativa otimizações (versão original)
  status   - Mostra status atual

Exemplos:
  node scripts/performance-test.js enable
  node scripts/performance-test.js disable
  node scripts/performance-test.js status

📊 Para medir performance:
1. Abra DevTools (F12)
2. Vá para aba "Performance"
3. Recarregue a página
4. Compare os tempos de carregamento
      `);
  }
}

main();