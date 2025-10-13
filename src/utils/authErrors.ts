// Utilitários para tratamento de erros de autenticação

export interface AuthErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  action?: 'retry' | 'redirect' | 'contact_support';
}

// Mapeamento de erros comuns do Supabase
const ERROR_MAPPINGS: Record<string, AuthErrorInfo> = {
  // Erros de rede
  'Failed to fetch': {
    code: 'NETWORK_ERROR',
    message: 'Falha na conexão com o servidor',
    userMessage: 'Problema de conexão. Verifique sua internet e tente novamente.',
    retryable: true,
    action: 'retry'
  },
  
  // Erros de autenticação
  'Invalid login credentials': {
    code: 'INVALID_CREDENTIALS',
    message: 'Credenciais inválidas',
    userMessage: 'Email ou senha incorretos. Verifique seus dados e tente novamente.',
    retryable: false
  },
  
  'Email not confirmed': {
    code: 'EMAIL_NOT_CONFIRMED',
    message: 'Email não confirmado',
    userMessage: 'Confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
    retryable: false
  },
  
  'Too many requests': {
    code: 'RATE_LIMIT',
    message: 'Muitas tentativas',
    userMessage: 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
    retryable: true
  },
  
  'User not found': {
    code: 'USER_NOT_FOUND',
    message: 'Usuário não encontrado',
    userMessage: 'Conta não encontrada. Verifique o email ou crie uma nova conta.',
    retryable: false
  },
  
  'Invalid Refresh Token': {
    code: 'INVALID_REFRESH_TOKEN',
    message: 'Token de sessão inválido',
    userMessage: 'Sua sessão expirou. Faça login novamente.',
    retryable: false,
    action: 'redirect'
  },
  
  // Erros de perfil
  'Profile not found': {
    code: 'PROFILE_NOT_FOUND',
    message: 'Perfil não encontrado',
    userMessage: 'Erro na configuração da conta. Entre em contato com o suporte.',
    retryable: false,
    action: 'contact_support'
  },
  
  // Erros de permissão
  'Insufficient permissions': {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Permissões insuficientes',
    userMessage: 'Você não tem permissão para acessar este recurso.',
    retryable: false
  }
};

/**
 * Processa erros de autenticação e retorna informações estruturadas
 */
export function processAuthError(error: any): AuthErrorInfo {
  const errorMessage = error?.message || error?.error_description || String(error);
  
  // Procurar por mapeamentos conhecidos
  for (const [pattern, errorInfo] of Object.entries(ERROR_MAPPINGS)) {
    if (errorMessage.includes(pattern)) {
      return errorInfo;
    }
  }
  
  // Erro genérico
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    userMessage: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
    retryable: true,
    action: 'retry'
  };
}

/**
 * Classe para gerenciar retry de operações de autenticação
 */
export class AuthRetryManager {
  private retryCount = 0;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 segundo

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: any) => void
  ): Promise<T> {
    while (this.retryCount < this.maxRetries) {
      try {
        const result = await operation();
        this.reset();
        return result;
      } catch (error) {
        this.retryCount++;
        
        const errorInfo = processAuthError(error);
        
        if (!errorInfo.retryable || this.retryCount >= this.maxRetries) {
          throw error;
        }
        
        if (onRetry) {
          onRetry(this.retryCount, error);
        }
        
        // Exponential backoff
        const delay = this.baseDelay * Math.pow(2, this.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  reset() {
    this.retryCount = 0;
  }
  
  getRetryCount() {
    return this.retryCount;
  }
}

/**
 * Logger para erros de autenticação
 */
export class AuthErrorLogger {
  private static instance: AuthErrorLogger;
  
  static getInstance(): AuthErrorLogger {
    if (!AuthErrorLogger.instance) {
      AuthErrorLogger.instance = new AuthErrorLogger();
    }
    return AuthErrorLogger.instance;
  }
  
  logError(error: any, context: string, userId?: string) {
    const errorInfo = processAuthError(error);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      userId,
      errorCode: errorInfo.code,
      errorMessage: errorInfo.message,
      originalError: error,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth Error:', logEntry);
    }
    
    // Aqui você pode adicionar integração com serviços de logging
    // como Sentry, LogRocket, etc.
    
    return logEntry;
  }
}

/**
 * Hook para tratamento de erros de autenticação
 */
export function useAuthErrorHandler() {
  const logger = AuthErrorLogger.getInstance();
  
  const handleError = (error: any, context: string = 'auth') => {
    const errorInfo = processAuthError(error);
    logger.logError(error, context);
    
    return errorInfo;
  };
  
  const createRetryManager = () => new AuthRetryManager();
  
  return {
    handleError,
    createRetryManager,
    processAuthError
  };
}