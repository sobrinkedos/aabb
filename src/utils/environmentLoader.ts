/**
 * Carregador de Configurações de Ambiente
 * 
 * Utilitário para carregar configurações específicas baseadas no ambiente atual.
 * Suporta carregamento dinâmico de arquivos .env específicos.
 * 
 * @version 1.0.0
 */

import { EnvironmentConfig } from '../config/environment';

// ============================================================================
// INTERFACES
// ============================================================================

interface EnvironmentFile {
  [key: string]: string;
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Detecta o ambiente atual baseado em múltiplas fontes
 */
export function detectCurrentEnvironment(): "development" | "production" {
  // 1. Variável de ambiente explícita
  if (import.meta.env.VITE_ENVIRONMENT === "production") {
    return "production";
  }
  
  // 2. Branch Git
  const gitBranch = import.meta.env.VITE_GIT_BRANCH;
  if (gitBranch === "main" || gitBranch === "master") {
    return "production";
  }
  
  // 3. URL de produção detectada
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl.includes('jtfdzjmravketpkwjkvp')) {
    return "production";
  }
  
  // 4. Padrão: desenvolvimento
  return "development";
}

/**
 * Carrega configurações do ambiente especificado
 */
export function loadEnvironmentConfig(environment: "development" | "production"): EnvironmentConfig {
  const config: EnvironmentConfig = {
    name: environment,
    supabaseUrl: "",
    supabaseAnonKey: "",
    supabaseServiceRoleKey: "",
    databaseName: "",
    gitBranch: "",
    debugMode: environment === "development",
    logLevel: environment === "development" ? "debug" : "error"
  };

  if (environment === "development") {
    config.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wznycskqsavpmejwpksp.supabase.co";
    config.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    config.supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
    config.databaseName = import.meta.env.VITE_DATABASE_NAME || "wznycskqsavpmejwpksp";
    config.gitBranch = "desenvolvimento";
  } else {
    config.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jtfdzjmravketpkwjkvp.supabase.co";
    config.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    config.supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";
    config.databaseName = import.meta.env.VITE_DATABASE_NAME || "jtfdzjmravketpkwjkvp";
    config.gitBranch = "main";
  }

  return config;
}

/**
 * Valida se uma configuração está completa
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): { isValid: boolean; missingFields: string[] } {
  const requiredFields: (keyof EnvironmentConfig)[] = [
    'supabaseUrl',
    'supabaseAnonKey', 
    'supabaseServiceRoleKey',
    'databaseName'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Obtém informações de debug do ambiente
 */
export function getEnvironmentDebugInfo(): Record<string, any> {
  return {
    // Variáveis de ambiente disponíveis
    environment: import.meta.env.VITE_ENVIRONMENT,
    gitBranch: import.meta.env.VITE_GIT_BRANCH,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    databaseName: import.meta.env.VITE_DATABASE_NAME,
    debugMode: import.meta.env.VITE_DEBUG_MODE,
    logLevel: import.meta.env.VITE_LOG_LEVEL,
    
    // Informações derivadas
    detectedEnvironment: detectCurrentEnvironment(),
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    
    // Metadados
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    location: window.location.href
  };
}

/**
 * Compara duas configurações de ambiente
 */
export function compareEnvironmentConfigs(config1: EnvironmentConfig, config2: EnvironmentConfig): {
  areEqual: boolean;
  differences: string[];
} {
  const differences: string[] = [];
  
  const fieldsToCompare: (keyof EnvironmentConfig)[] = [
    'name', 'supabaseUrl', 'databaseName', 'gitBranch', 'debugMode', 'logLevel'
  ];

  fieldsToCompare.forEach(field => {
    if (config1[field] !== config2[field]) {
      differences.push(`${field}: ${config1[field]} → ${config2[field]}`);
    }
  });

  return {
    areEqual: differences.length === 0,
    differences
  };
}

/**
 * Gera um relatório completo do ambiente
 */
export function generateEnvironmentReport(): string {
  const currentEnv = detectCurrentEnvironment();
  const config = loadEnvironmentConfig(currentEnv);
  const validation = validateEnvironmentConfig(config);
  const debugInfo = getEnvironmentDebugInfo();

  const report = `
# Relatório do Ambiente - ${new Date().toLocaleString()}

## Configuração Atual
- **Ambiente:** ${config.name}
- **Branch Git:** ${config.gitBranch}
- **Database:** ${config.databaseName}
- **Debug Mode:** ${config.debugMode ? 'Ativado' : 'Desativado'}
- **Log Level:** ${config.logLevel}

## Validação
- **Status:** ${validation.isValid ? '✅ Válido' : '❌ Inválido'}
- **Campos ausentes:** ${validation.missingFields.length > 0 ? validation.missingFields.join(', ') : 'Nenhum'}

## Conectividade
- **URL Supabase:** ${config.supabaseUrl}
- **Chave Anônima:** ${config.supabaseAnonKey ? '✅ Configurada' : '❌ Ausente'}
- **Chave de Serviço:** ${config.supabaseServiceRoleKey ? '✅ Configurada' : '❌ Ausente'}

## Informações de Debug
\`\`\`json
${JSON.stringify(debugInfo, null, 2)}
\`\`\`

---
Gerado automaticamente pelo EnvironmentLoader v1.0.0
`;

  return report;
}

/**
 * Salva o relatório do ambiente em um arquivo
 */
export function saveEnvironmentReport(): void {
  const report = generateEnvironmentReport();
  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `environment-report-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Hook React para usar configurações de ambiente
 */
export function useEnvironmentConfig() {
  const environment = detectCurrentEnvironment();
  const config = loadEnvironmentConfig(environment);
  const validation = validateEnvironmentConfig(config);

  return {
    environment,
    config,
    isValid: validation.isValid,
    missingFields: validation.missingFields,
    debugInfo: getEnvironmentDebugInfo()
  };
}