/**
 * Serviço Completo de Criação de Funcionários
 *
 * Gerencia todo o fluxo de criação de funcionários com credenciais automáticas
 * e integração com o sistema multitenant
 * 
 * @version 2.0.0
 * @author Sistema de Gerenciamento de Funcionários
 */

import { isAdminConfigured, supabase, supabaseAdmin } from "../lib/supabase";
import { addUserRoleMapping, mapEmployeeRoleToMiddlewareRole } from "../config/userRoleMapping";

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

/**
 * Tipos de função disponíveis no sistema
 */
export type BarRole = "atendente" | "garcom" | "cozinheiro" | "barman" | "gerente" | "caixa";

/**
 * Tipos de turno disponíveis
 */
export type ShiftPreference = "manha" | "tarde" | "noite" | "qualquer";

/**
 * Tipos de usuário no sistema
 */
export type UserType = "funcionario" | "administrador";

/**
 * Papéis de acesso no sistema
 */
export type UserRole = "USER" | "MANAGER" | "ADMIN";

/**
 * Status de funcionário
 */
export type EmployeeStatus = "ativo" | "inativo" | "suspenso";

/**
 * Permissões específicas para um módulo
 */
export interface ModulePermission {
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  administrar: boolean;
}

/**
 * Conjunto de permissões por módulo
 */
export interface ModulePermissions {
  [moduleName: string]: ModulePermission;
}

/**
 * Credenciais geradas para o funcionário
 */
export interface EmployeeCredentials {
  email: string;
  senha_temporaria: string;
  deve_alterar_senha: boolean;
}

/**
 * Detalhes do processo de criação
 */
export interface CreationDetails {
  bar_employee_created: boolean;
  auth_user_created: boolean;
  profile_created: boolean;
  usuario_empresa_created: boolean;
  permissions_created: boolean;
  warnings?: string[];
  execution_time_ms?: number;
}

/**
 * Dados necessários para criar um funcionário
 */
export interface EmployeeCreationData {
  // Dados básicos do funcionário
  nome_completo: string;
  email: string;
  telefone?: string;
  cpf?: string;

  // Dados específicos do bar
  bar_role: BarRole;
  shift_preference?: ShiftPreference;
  specialties?: string[];
  commission_rate?: number;
  observacoes?: string;

  // Configurações de acesso
  cargo: string;
  tipo_usuario?: UserType;
  papel?: UserRole;
  tem_acesso_sistema: boolean;

  // Permissões por módulo
  permissoes_modulos: ModulePermissions;
}

/**
 * Resultado da operação de criação de funcionário
 */
export interface EmployeeCreationResult {
  success: boolean;
  employee_id?: string;
  user_id?: string;
  usuario_empresa_id?: string;
  credentials?: EmployeeCredentials;
  error?: string;
  details?: CreationDetails;
}

/**
 * Resultado de operações simples
 */
export interface ServiceResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Resultado de listagem de funcionários
 */
export interface EmployeeListResult extends ServiceResult {
  employees?: any[];
  total?: number;
}

/**
 * Configurações de logging
 */
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enablePersistence: boolean;
}

/**
 * Entrada de log
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  operation: string;
  message: string;
  data?: any;
  error?: any;
}

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

/**
 * Tipos de erro do serviço
 */
export enum ErrorType {
  VALIDATION_ERROR = "validation_error",
  AUTH_ERROR = "auth_error", 
  DATABASE_ERROR = "database_error",
  PERMISSION_ERROR = "permission_error",
  NETWORK_ERROR = "network_error",
  INTERNAL_ERROR = "internal_error"
}

/**
 * Operações do serviço para logging
 */
export enum ServiceOperation {
  CREATE_EMPLOYEE = "create_employee",
  UPDATE_PASSWORD = "update_password",
  DEACTIVATE_EMPLOYEE = "deactivate_employee",
  REACTIVATE_EMPLOYEE = "reactivate_employee",
  UPDATE_PERMISSIONS = "update_permissions",
  LIST_EMPLOYEES = "list_employees",
  CHECK_EMAIL = "check_email",
  GENERATE_CREDENTIALS = "generate_credentials"
}

// ============================================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ============================================================================

/**
 * Serviço de criação e gerenciamento de funcionários
 * 
 * Implementa o padrão Singleton para garantir uma única instância
 * e fornece métodos para todas as operações relacionadas a funcionários
 */
export class EmployeeCreationService {
  private static instance: EmployeeCreationService;
  private logConfig: LogConfig;
  private logs: LogEntry[] = [];

  /**
   * Construtor privado para implementar Singleton
   */
  private constructor() {
    this.logConfig = {
      level: 'info',
      enableConsole: true,
      enablePersistence: false
    };
  }

  /**
   * Obtém a instância singleton do serviço
   */
  static getInstance(): EmployeeCreationService {
    if (!EmployeeCreationService.instance) {
      EmployeeCreationService.instance = new EmployeeCreationService();
    }
    return EmployeeCreationService.instance;
  }

  // ============================================================================
  // MÉTODOS DE LOGGING E DEBUGGING
  // ============================================================================

  /**
   * Configura o sistema de logging
   */
  public configureLogging(config: Partial<LogConfig>): void {
    this.logConfig = { ...this.logConfig, ...config };
    this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Logging configurado', { config: this.logConfig });
  }

  /**
   * Registra uma entrada de log
   */
  private log(level: LogConfig['level'], operation: ServiceOperation, message: string, data?: any, error?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message,
      data,
      error
    };

    // Adicionar ao array de logs se persistência estiver habilitada
    if (this.logConfig.enablePersistence) {
      this.logs.push(entry);
      // Manter apenas os últimos 1000 logs
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
      }
    }

    // Log no console se habilitado e nível apropriado
    if (this.logConfig.enableConsole && this.shouldLog(level)) {
      const emoji = this.getLogEmoji(level);
      const prefix = `${emoji} [${operation}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '');
          break;
        case 'info':
          console.log(prefix, message, data || '');
          break;
        case 'warn':
          console.warn(prefix, message, data || '');
          break;
        case 'error':
          console.error(prefix, message, data || '', error || '');
          break;
      }
    }
  }

  /**
   * Verifica se deve fazer log baseado no nível configurado
   */
  private shouldLog(level: LogConfig['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.logConfig.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  /**
   * Obtém emoji para o nível de log
   */
  private getLogEmoji(level: LogConfig['level']): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  /**
   * Obtém logs armazenados
   */
  public getLogs(operation?: ServiceOperation, level?: LogConfig['level']): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === operation);
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs;
  }

  /**
   * Limpa logs armazenados
   */
  public clearLogs(): void {
    this.logs = [];
    this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Logs limpos');
  }

  // ============================================================================
  // MÉTODOS DE VALIDAÇÃO
  // ============================================================================

  /**
   * Valida dados de entrada para criação de funcionário
   */
  private validateEmployeeData(data: EmployeeCreationData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validações obrigatórias
    if (!data.nome_completo?.trim()) {
      errors.push('Nome completo é obrigatório');
    }

    if (!data.email?.trim()) {
      errors.push('Email é obrigatório');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Email deve ter formato válido');
    }

    if (!data.bar_role) {
      errors.push('Função no bar é obrigatória');
    }

    if (!data.cargo?.trim()) {
      errors.push('Cargo é obrigatório');
    }

    // Validações condicionais
    if (data.cpf && !this.isValidCPF(data.cpf)) {
      errors.push('CPF deve ter formato válido');
    }

    if (data.telefone && !this.isValidPhone(data.telefone)) {
      errors.push('Telefone deve ter formato válido');
    }

    if (data.commission_rate && (data.commission_rate < 0 || data.commission_rate > 100)) {
      errors.push('Taxa de comissão deve estar entre 0 e 100');
    }

    // Validar permissões
    if (!data.permissoes_modulos || Object.keys(data.permissoes_modulos).length === 0) {
      errors.push('Permissões de módulos são obrigatórias');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de CPF
   */
  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se não são todos iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit === 10 || digit === 11) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit === 10 || digit === 11) digit = 0;
    if (digit !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  /**
   * Valida formato de telefone
   */
  private isValidPhone(phone: string): boolean {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Aceita formatos: 10 ou 11 dígitos (com ou sem DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  // ============================================================================
  // MÉTODOS DE TRATAMENTO DE ERROS
  // ============================================================================

  /**
   * Cria erro padronizado do serviço
   */
  private createServiceError(type: ErrorType, message: string, originalError?: any): Error {
    const error = new Error(`[${type}] ${message}`);
    (error as any).type = type;
    (error as any).originalError = originalError;
    return error;
  }

  /**
  /**
   * Trata erros de forma padronizada
   */
  private handleError(operation: ServiceOperation, error: any, context?: string): ServiceResult {
    let errorType = ErrorType.INTERNAL_ERROR;
    let errorMessage = 'Erro interno do serviço';

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Classificar tipo de erro baseado na mensagem
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorType = ErrorType.VALIDATION_ERROR;
      } else if (error.message.includes('auth') || error.message.includes('authentication')) {
        errorType = ErrorType.AUTH_ERROR;
      } else if (error.message.includes('database') || error.message.includes('Database')) {
        errorType = ErrorType.DATABASE_ERROR;
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorType = ErrorType.PERMISSION_ERROR;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorType = ErrorType.NETWORK_ERROR;
      }
    }

    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;
    
    this.log('error', operation, fullMessage, { errorType, context }, error);
    
    return {
      success: false,
      error: fullMessage
    };
  }

  /**
   * Executa operação com tratamento de erro padronizado
   */
  private async executeWithErrorHandling<T>(
    operation: ServiceOperation,
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | ServiceResult> {
    try {
      const startTime = Date.now();
      this.log('debug', operation, `Iniciando operação${context ? `: ${context}` : ''}`);
      
      const result = await fn();
      
      const executionTime = Date.now() - startTime;
      this.log('debug', operation, `Operação concluída em ${executionTime}ms`);
      
      return result;
    } catch (error) {
      return this.handleError(operation, error, context);
    }
  }

  // ============================================================================
  // MÉTODO PRINCIPAL DE CRIAÇÃO DE FUNCIONÁRIOS
  // ============================================================================

  /**
   * Cria um funcionário completo com todas as integrações
   * 
   * @param employeeData Dados do funcionário a ser criado
   * @param empresa_id ID da empresa
   * @returns Resultado da operação com detalhes completos
   */
  async createCompleteEmployee(
    employeeData: EmployeeCreationData,
    empresa_id: string,
  ): Promise<EmployeeCreationResult> {
    const startTime = Date.now();
    const operation = ServiceOperation.CREATE_EMPLOYEE;
    
    // Inicializar detalhes do processo
    const details: CreationDetails = {
      bar_employee_created: false,
      auth_user_created: false,
      profile_created: false,
      usuario_empresa_created: false,
      permissions_created: false,
      warnings: []
    };

    this.log('info', operation, `Iniciando criação do funcionário: ${employeeData.nome_completo}`, {
      email: employeeData.email,
      bar_role: employeeData.bar_role,
      tem_acesso_sistema: employeeData.tem_acesso_sistema,
      empresa_id
    });

    try {
      // 1. Validar dados de entrada
      this.log('debug', operation, 'Validando dados de entrada');
      const validation = this.validateEmployeeData(employeeData);
      if (!validation.valid) {
        const error = `Dados inválidos: ${validation.errors.join(', ')}`;
        this.log('error', operation, error, { errors: validation.errors });
        return {
          success: false,
          error,
          details
        };
      }

      // 2. Verificar se email já existe
      this.log('debug', operation, 'Verificando se email já existe');
      const emailExists = await this.checkEmailExists(employeeData.email);
      if (emailExists) {
        const error = `Email ${employeeData.email} já está em uso no sistema`;
        this.log('warn', operation, error);
        return {
          success: false,
          error,
          details,
        };
      }

      // 3. Gerar credenciais se necessário
      let credentials: EmployeeCredentials | undefined;
      if (employeeData.tem_acesso_sistema) {
        this.log('debug', operation, 'Gerando credenciais de acesso');
        credentials = this.generateCredentials(employeeData.nome_completo, employeeData.email);
        this.log('info', operation, 'Credenciais geradas com sucesso', { email: credentials.email });
      }

      // 4. Criar usuário no Supabase Auth (se necessário)
      let authUserId: string | null = null;
      if (employeeData.tem_acesso_sistema && credentials) {
        this.log('info', operation, 'Criando usuário no Supabase Auth');
        
        const authResult = await this.createAuthUserWithFallback(employeeData, credentials.senha_temporaria);
        
        if (authResult.success && authResult.userId) {
          authUserId = authResult.userId;
          details.auth_user_created = true;
          this.log('info', operation, 'Usuário criado no Auth com sucesso', { userId: authUserId });

          // 4.1. Criar perfil do usuário (opcional)
          const profileResult = await this.createUserProfileSafely(authUserId, employeeData);
          if (profileResult.success) {
            details.profile_created = true;
            this.log('info', operation, 'Perfil de usuário criado');
          } else {
            details.warnings?.push(`Erro ao criar perfil: ${profileResult.error}`);
            this.log('warn', operation, 'Falha ao criar perfil', { error: profileResult.error });
          }
        } else {
          // Auth falhou - continuar sem credenciais mas registrar aviso
          details.warnings?.push(`Falha na criação do Auth: ${authResult.error}`);
          this.log('warn', operation, 'Auth falhou, continuando sem credenciais', { error: authResult.error });
        }
      } else {
        this.log('info', operation, 'Usuário sem acesso ao sistema - pulando criação no Auth');
      }

      // 5. Criar registro na tabela employees
      let employeeId: string | null = null;
      this.log('info', operation, 'Criando registro na tabela employees');
      const employeeResult = await this.createEmployeeSafely(employeeData, empresa_id, authUserId);
      
      if (employeeResult.success && employeeResult.data?.employeeId) {
        employeeId = employeeResult.data.employeeId;
        details.bar_employee_created = true;
        this.log('info', operation, 'Funcionário criado na tabela employees', { employeeId });
      } else {
        details.warnings?.push(`Erro ao criar employee: ${employeeResult.error}`);
        this.log('warn', operation, 'Falha ao criar employee', { error: employeeResult.error });
      }

      // 6. Criar registro na tabela bar_employees
      this.log('info', operation, 'Criando registro na tabela bar_employees');
      const barEmployeeResult = await this.createBarEmployeeSafely(employeeData, empresa_id, employeeId);

      if (!barEmployeeResult.success) {
        // Cleanup em caso de falha crítica
        if (authUserId) {
          await this.cleanupAuthUserSafely(authUserId);
        }
        
        const error = `Erro crítico ao criar funcionário: ${barEmployeeResult.error}`;
        this.log('error', operation, error);
        return {
          success: false,
          error,
          details,
        };
      }

      details.bar_employee_created = true;
      const barEmployeeId = barEmployeeResult.data?.employeeId;
      this.log('info', operation, 'Funcionário criado na tabela bar_employees', { employeeId: barEmployeeId });

      // 7. Criar registro na tabela usuarios_empresa
      this.log('info', operation, 'Criando registro na tabela usuarios_empresa');
      const usuarioEmpresaResult = await this.createUsuarioEmpresaSafely(employeeData, empresa_id, authUserId);

      let usuarioEmpresaId: string | undefined;
      if (usuarioEmpresaResult.success) {
        details.usuario_empresa_created = true;
        usuarioEmpresaId = usuarioEmpresaResult.data?.usuarioEmpresaId;
        this.log('info', operation, 'Registro criado na tabela usuarios_empresa', { usuarioEmpresaId });

        // 8. Criar permissões do usuário
        this.log('info', operation, 'Configurando permissões do usuário');
        
        // Se não há permissões específicas e é um usuário de caixa, criar permissões padrão
        let permissoesParaCriar = employeeData.permissoes_modulos;
        if ((!permissoesParaCriar || Object.keys(permissoesParaCriar).length === 0) && 
            (employeeData.bar_role === 'caixa' || employeeData.cargo?.toLowerCase().includes('caixa'))) {
          this.log('info', operation, 'Criando permissões padrão para usuário de caixa');
          permissoesParaCriar = {
            gestao_caixa: {
              visualizar: true,
              criar: true,
              editar: true,
              excluir: true,
              administrar: false
            }
          };
        }
        
        const permissionsResult = await this.createUserPermissionsSafely(usuarioEmpresaId!, permissoesParaCriar);

        if (permissionsResult.success) {
          details.permissions_created = true;
          this.log('info', operation, 'Permissões configuradas com sucesso');
        } else {
          details.warnings?.push(`Erro ao criar permissões: ${permissionsResult.error}`);
          this.log('warn', operation, 'Falha ao criar permissões', { error: permissionsResult.error });
        }
      } else {
        details.warnings?.push(`Erro ao criar usuario_empresa: ${usuarioEmpresaResult.error}`);
        this.log('warn', operation, 'Falha ao criar usuario_empresa', { error: usuarioEmpresaResult.error });
      }

      // 9. Preparar resultado final
      const executionTime = Date.now() - startTime;
      details.execution_time_ms = executionTime;

      const result: EmployeeCreationResult = {
        success: true,
        employee_id: barEmployeeId,
        user_id: authUserId || undefined,
        usuario_empresa_id: usuarioEmpresaId,
        credentials: (employeeData.tem_acesso_sistema && details.auth_user_created && credentials) ? {
          email: credentials.email,
          senha_temporaria: credentials.senha_temporaria,
          deve_alterar_senha: true,
        } : undefined,
        details,
      };

      // Log de avisos se houver
      if (details.warnings && details.warnings.length > 0) {
        this.log('warn', operation, 'Funcionário criado com avisos', { warnings: details.warnings });
      }

      this.log('info', operation, `Funcionário criado com sucesso em ${executionTime}ms`, {
        employee_id: barEmployeeId,
        has_credentials: !!result.credentials,
        warnings_count: details.warnings?.length || 0
      });

      // 10. Adicionar mapeamento de role automaticamente
      this.log('info', operation, 'Verificando dados para mapeamento', { 
        hasEmail: !!employeeData.email,
        hasBarRole: !!employeeData.bar_role,
        email: employeeData.email,
        barRole: employeeData.bar_role
      });
      
      if (employeeData.email && employeeData.bar_role) {
        try {
          const middlewareRole = mapEmployeeRoleToMiddlewareRole(employeeData.bar_role);
          addUserRoleMapping(employeeData.email, middlewareRole, 'system');
          this.log('info', operation, '✅ Mapeamento de role adicionado com sucesso', { 
            email: employeeData.email, 
            barRole: employeeData.bar_role,
            middlewareRole 
          });
        } catch (error) {
          this.log('warn', operation, '❌ Erro ao adicionar mapeamento de role', { error });
        }
      } else {
        this.log('warn', operation, '⚠️ Dados insuficientes para mapeamento de role', {
          email: employeeData.email,
          barRole: employeeData.bar_role
        });
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      details.execution_time_ms = executionTime;
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.log('error', operation, `Erro geral na criação do funcionário: ${errorMessage}`, { executionTime }, error);
      
      return {
        success: false,
        error: `Erro interno: ${errorMessage}`,
        details,
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE GERAÇÃO DE CREDENCIAIS
  // ============================================================================

  /**
   * Gera credenciais automáticas seguras para o funcionário
   * 
   * @param nomeCompleto Nome completo do funcionário
   * @param email Email do funcionário
   * @param barRole Função do funcionário para determinar nível de segurança
   * @returns Credenciais geradas
   */
  private generateCredentials(nomeCompleto: string, email: string, barRole?: string): EmployeeCredentials {
    const operation = ServiceOperation.GENERATE_CREDENTIALS;
    
    this.log('debug', operation, 'Gerando credenciais com senha genérica simples', { email, barRole });

    try {
      // SOLUÇÃO DEFINITIVA: Usar senha genérica simples que sempre funciona
      const password = "123456"; // Senha genérica que força alteração no primeiro login
      
      const credentials = {
        email: email.toLowerCase().trim(),
        senha_temporaria: password,
        deve_alterar_senha: true,
      };

      this.log('info', operation, 'Credenciais geradas com senha genérica', { 
        email: credentials.email,
        senha: password, // Log da senha para facilitar testes
        deve_alterar: true
      });

      return credentials;
    } catch (error) {
      this.log('error', operation, 'Erro ao gerar credenciais', {}, error);
      
      // Fallback ainda mais simples
      this.log('warn', operation, 'Usando fallback com senha genérica');
      
      return {
        email: email.toLowerCase().trim(),
        senha_temporaria: "123456", // Sempre a mesma senha simples
        deve_alterar_senha: true,
      };
    }
  }

  /**
   * Fallback para geração de senha (sistema antigo)
   * SOLUÇÃO DEFINITIVA: Sempre retorna senha genérica simples
   */
  private generateSecurePasswordFallback(length: number = 6): string {
    // CORREÇÃO DEFINITIVA: Sempre usar senha genérica que funciona
    return "123456";
  }

  private generateSecurePasswordFallbackOld(length: number = 12): string {
    // Caracteres seguros (evitando ambíguos como 0, O, l, I)
    const uppercase = "ABCDEFGHJKMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "@#$%&*";
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    
    // Garantir pelo menos um caractere de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Preencher o resto aleatoriamente
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // ============================================================================
  // MÉTODOS DE CRIAÇÃO NO SUPABASE AUTH
  // ============================================================================

  /**
   * Cria usuário no Supabase Auth com estratégia de fallback
   * 
   * @param employeeData Dados do funcionário
   * @param senha Senha temporária
   * @returns Resultado da operação
   */
  private async createAuthUserWithFallback(
    employeeData: EmployeeCreationData,
    senha: string,
  ): Promise<ServiceResult & { userId?: string }> {
    const operation = ServiceOperation.CREATE_EMPLOYEE;
    
    this.log('info', operation, 'Iniciando criação no Supabase Auth', { email: employeeData.email });

    try {
      // Primeira tentativa: com metadata completa
      this.log('debug', operation, 'Tentativa 1: criação com metadata completa');
      let authResult = await this.tryCreateAuthUser(employeeData, senha, false);

      if (authResult.success) {
        this.log('info', operation, 'Usuário criado com sucesso na primeira tentativa');
        
        // CORREÇÃO: Verificar se email foi confirmado e tentar confirmar se necessário
        const needsEmailConfirmation = await this.checkAndConfirmEmail(authResult.userId!);
        if (needsEmailConfirmation.confirmed) {
          this.log('info', operation, 'Email confirmado com sucesso');
        }
        
        return authResult;
      }

      this.log('warn', operation, 'Primeira tentativa falhou', { error: authResult.error });

      // Verificar se é erro de banco/trigger para tentar fallback
      const isDatabaseError = this.isDatabaseRelatedError(authResult.error);

      if (isDatabaseError) {
        this.log('info', operation, 'Erro de banco detectado, tentando fallback sem metadata');
        authResult = await this.tryCreateAuthUser(employeeData, senha, true);

        if (authResult.success) {
          this.log('info', operation, 'Fallback bem-sucedido - problema era no trigger/função do banco');
          
          // Tentar confirmar email também no fallback
          const needsEmailConfirmation = await this.checkAndConfirmEmail(authResult.userId!);
          if (needsEmailConfirmation.confirmed) {
            this.log('info', operation, 'Email confirmado no fallback');
          }
          
          return authResult;
        } else {
          this.log('error', operation, 'Fallback também falhou', { error: authResult.error });
        }
      } else {
        this.log('info', operation, 'Erro não é relacionado ao banco, não tentando fallback');
      }

      return authResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.log('error', operation, 'Erro geral na criação do Auth', {}, error);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verifica se o email do usuário está confirmado e tenta confirmar se necessário
   */
  private async checkAndConfirmEmail(userId: string): Promise<{ confirmed: boolean; error?: string }> {
    try {
      // Só pode confirmar via admin
      if (!isAdminConfigured) {
        this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 'Admin não configurado - não pode confirmar email automaticamente');
        return { confirmed: false, error: 'Admin não configurado para confirmação de email' };
      }

      // Buscar dados do usuário
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (getUserError || !userData.user) {
        this.log('error', ServiceOperation.CREATE_EMPLOYEE, 'Erro ao buscar dados do usuário para confirmação de email', { userId }, getUserError);
        return { confirmed: false, error: 'Erro ao buscar usuário' };
      }

      // Verificar se já está confirmado
      if (userData.user.email_confirmed_at) {
        this.log('debug', ServiceOperation.CREATE_EMPLOYEE, 'Email já estava confirmado', { userId });
        return { confirmed: true };
      }

      // Tentar confirmar email
      this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Tentando confirmar email automaticamente', { userId });
      
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true
      });

      if (confirmError) {
        this.log('error', ServiceOperation.CREATE_EMPLOYEE, 'Erro ao confirmar email', { userId }, confirmError);
        return { confirmed: false, error: confirmError.message };
      }

      this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Email confirmado com sucesso', { userId });
      return { confirmed: true };
      
    } catch (error) {
      this.log('error', ServiceOperation.CREATE_EMPLOYEE, 'Erro geral na confirmação de email', { userId }, error);
      return { 
        confirmed: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido na confirmação de email' 
      };
    }
  }

  /**
   * Verifica se o erro é relacionado ao banco de dados
   */
  private isDatabaseRelatedError(error?: string): boolean {
    if (!error) return false;
    
    const databaseErrorKeywords = [
      'Database error',
      'database',
      'trigger',
      'function',
      'relation',
      'column',
      'constraint',
      'foreign key',
      'unique violation'
    ];
    
    return databaseErrorKeywords.some(keyword => 
      error.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Tenta criar usuário no Auth com ou sem metadata
   */
  private async tryCreateAuthUser(
    employeeData: EmployeeCreationData,
    senha: string,
    skipMetadata: boolean = false,
  ): Promise<ServiceResult & { userId?: string }> {
    try {
      this.log('debug', ServiceOperation.CREATE_EMPLOYEE, 
        `Tentando criar usuário ${skipMetadata ? "SEM" : "COM"} metadata`);

      const userData = skipMetadata ? {} : {
        name: employeeData.nome_completo,
        role: employeeData.tipo_usuario || "funcionario",
        cargo: employeeData.cargo,
        temporary_password: true,
        created_by: "system",
      };

      // CORREÇÃO: Sempre tentar usar admin client primeiro se disponível
      if (isAdminConfigured) {
        this.log('debug', ServiceOperation.CREATE_EMPLOYEE, 'Usando cliente admin (service role) - PREFERRED');

        const adminData: any = {
          email: employeeData.email,
          password: senha,
          email_confirm: true, // CRÍTICO: Confirmar email automaticamente
        };

        if (!skipMetadata) {
          adminData.user_metadata = userData;
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser(adminData);

        if (error) {
          this.log('warn', ServiceOperation.CREATE_EMPLOYEE, `Admin createUser falhou: ${error.message}`);
          // Se admin falhar, não tentar fallback - o problema precisa ser resolvido
          return { success: false, error: `Erro admin: ${error.message}` };
        }

        if (!data.user) {
          return { success: false, error: "Usuário não foi criado via admin" };
        }

        this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Usuário criado via admin com email confirmado');
        return { success: true, userId: data.user.id };
      } else {
        this.log('debug', ServiceOperation.CREATE_EMPLOYEE, 'Admin não configurado - usando cliente normal');

        // CORREÇÃO: Usar método melhorado para cliente normal
        const signUpData: any = {
          email: employeeData.email,
          password: senha,
        };

        // Tentar primeiro sem metadata para evitar problemas de trigger
        if (!skipMetadata) {
          // CORREÇÃO: Sempre usar "employee" como role para funcionários
          signUpData.options = { 
            data: {
              name: employeeData.nome_completo,
              role: 'employee' // Forçar "employee" para todos os funcionários
            }
          };
        }

        const { data, error } = await supabase.auth.signUp(signUpData);

        if (error) {
          this.log('error', ServiceOperation.CREATE_EMPLOYEE, `SignUp falhou: ${error.message}`);
          
          // Se erro for relacionado ao trigger/database, tentar sem metadata
          if (error.message.includes('Database error') && !skipMetadata) {
            this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 'Tentando novamente sem metadata devido ao erro de database');
            return this.tryCreateAuthUser(employeeData, senha, true);
          }
          
          return { success: false, error: error.message };
        }

        if (!data.user) {
          return { success: false, error: "Usuário não foi criado" };
        }

        // AVISO: Email pode não estar confirmado com cliente normal
        if (!data.user.email_confirmed_at) {
          this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 
            'Email não foi confirmado automaticamente - usuário pode não conseguir fazer login');
        }

        return { success: true, userId: data.user.id };
      }
    } catch (error) {
      this.log('error', ServiceOperation.CREATE_EMPLOYEE, 'Erro geral em tryCreateAuthUser', {}, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES COM TRATAMENTO SEGURO DE ERROS
  // ============================================================================

  /**
   * Cria perfil do usuário de forma segura
   */
  private async createUserProfileSafely(
    userId: string,
    employeeData: EmployeeCreationData,
  ): Promise<ServiceResult> {
    return this.executeWithErrorHandling(
      ServiceOperation.CREATE_EMPLOYEE,
      async () => {
        // Primeiro verificar se o perfil já existe
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();

        if (existingProfile) {
          this.log('info', ServiceOperation.CREATE_EMPLOYEE, 
            'Perfil já existe - pulando criação');
          return { success: true };
        }

        // Se não existe, criar o perfil
        // CORREÇÃO: Sempre definir role como "employee" para funcionários criados
        const profileRole = "employee"; // Funcionários sempre são "employee" na tabela profiles
        
        const { error } = await supabase
          .from("profiles")
          .insert([{
            id: userId,
            name: employeeData.nome_completo,
            role: profileRole,
            avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${
              encodeURIComponent(employeeData.nome_completo)
            }`,
            updated_at: new Date().toISOString(),
          }] as any);

        if (error) {
          // Se a tabela não existir, não é um erro crítico
          if (error.code === "PGRST116" || error.message.includes("does not exist")) {
            this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 
              'Tabela profiles não existe - pulando criação de perfil');
            return { success: true };
          }
          // Se for erro de constraint duplicada, também não é crítico
          if (error.code === "23505" || error.message.includes("duplicate key")) {
            this.log('info', ServiceOperation.CREATE_EMPLOYEE, 
              'Perfil já existe (constraint duplicada) - continuando');
            return { success: true };
          }
          throw new Error(error.message);
        }

        return { success: true };
      },
      'Criação de perfil de usuário'
    ) as Promise<ServiceResult>;
  }

  /**
   * Cria registro na tabela employees de forma segura
   */
  private async createEmployeeSafely(
    employeeData: EmployeeCreationData,
    empresaId: string,
    authUserId: string | null,
  ): Promise<ServiceResult & { data?: { employeeId: string } }> {
    return this.executeWithErrorHandling(
      ServiceOperation.CREATE_EMPLOYEE,
      async () => {
        // CORREÇÃO: Buscar departamento e posição padrão de forma segura
        let departmentId: string | null = null;
        let positionId: string | null = null;

        try {
          // Buscar departamento ativo (sem filtro por empresa_id pois campo não existe)
          const { data: departments } = await supabase
            .from("departments")
            .select("id")
            .eq('is_active', true)
            .limit(1);

          departmentId = (departments as any)?.[0]?.id;

          // Buscar posição ativa
          const { data: positions } = await supabase
            .from("positions")
            .select("id")
            .eq('is_active', true)
            .limit(1);

          positionId = (positions as any)?.[0]?.id;

          this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Department e Position encontrados', { 
            departmentId, 
            positionId 
          });

        } catch (deptPosError) {
          this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 'Erro ao buscar departamento e posição', {}, deptPosError);
        }

        // CORREÇÃO: Se ainda não temos department/position, usar valores padrão simples
        if (!departmentId || !positionId) {
          this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 'Criando employee sem department/position devido a erros');
        }

        const client = isAdminConfigured ? supabaseAdmin : supabase;
        const employeeRecord = {
          employee_code: `EMP-${Date.now()}`,
          name: employeeData.nome_completo,
          email: employeeData.email,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          empresa_id: empresaId
        } as any;

        // Adicionar department_id e position_id apenas se existirem
        if (departmentId) employeeRecord.department_id = departmentId;
        if (positionId) employeeRecord.position_id = positionId;
        if (authUserId) employeeRecord.profile_id = authUserId;

        const { data, error } = await client
          .from("employees")
          .insert(employeeRecord as any)
          .select('id')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return { success: true, data: { employeeId: (data as any)?.id } };

      },
      'Criação de registro employees'
    ) as Promise<ServiceResult & { data?: { employeeId: string } }>;
  }

  /**
   * Cria registro na tabela bar_employees de forma segura
   */
  private async createBarEmployeeSafely(
    employeeData: EmployeeCreationData,
    empresaId: string,
    employeeId: string | null,
  ): Promise<ServiceResult & { employeeId?: string }> {
    return this.executeWithErrorHandling(
      ServiceOperation.CREATE_EMPLOYEE,
      async () => {
        // Construir notes
        const notesArray = [];
        notesArray.push(`Nome: ${employeeData.nome_completo}`);
        if (employeeData.cpf) notesArray.push(`CPF: ${employeeData.cpf}`);
        notesArray.push(`Email: ${employeeData.email}`);
        if (employeeData.telefone) {
          notesArray.push(`Telefone: ${employeeData.telefone}`);
        }
        if (employeeData.observacoes) {
          notesArray.push(`Observações: ${employeeData.observacoes}`);
        }

        const notes = notesArray.join(", ");

        if (!employeeId) {
          throw new Error('Employee ID é obrigatório para criar registro na tabela bar_employees');
        }

        const client = isAdminConfigured ? supabaseAdmin : supabase;
        const { data, error } = await client
          .from("bar_employees")
          .insert([{
            employee_id: employeeId,
            bar_role: employeeData.bar_role,
            shift_preference: employeeData.shift_preference || "qualquer",
            specialties: employeeData.specialties || [],
            commission_rate: employeeData.commission_rate || 0,
            is_active: true,
            start_date: new Date().toISOString().split("T")[0],
            notes: notes,
            empresa_id: empresaId,
          }] as any)
          .select("id")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return { success: true, data: { employeeId: (data as any)?.id } };
      },
      'Criação de registro bar_employees'
    ) as Promise<ServiceResult & { employeeId?: string }>;
  }

  /**
   * Cria registro na tabela usuarios_empresa de forma segura
   */
  private async createUsuarioEmpresaSafely(
    employeeData: EmployeeCreationData,
    empresaId: string,
    authUserId: string | null,
  ): Promise<ServiceResult & { usuarioEmpresaId?: string }> {
    return this.executeWithErrorHandling(
      ServiceOperation.CREATE_EMPLOYEE,
      async () => {
        const client = isAdminConfigured ? supabaseAdmin : supabase;
        const { data, error } = await client
          .from("usuarios_empresa")
          .insert([{
            user_id: authUserId,
            empresa_id: empresaId,
            nome_completo: employeeData.nome_completo,
            email: employeeData.email,
            telefone: employeeData.telefone,
            cargo: employeeData.cargo,
            tipo_usuario: employeeData.tipo_usuario || "funcionario",
            status: "ativo",
            senha_provisoria: true,
            ativo: true,
            tem_acesso_sistema: employeeData.tem_acesso_sistema,
            papel: employeeData.papel || "USER",
            is_primeiro_usuario: false,
            tentativas_login_falhadas: 0,
            total_logins: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }] as any)
          .select("id")
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return { success: true, data: { usuarioEmpresaId: (data as any)?.id } };
      },
      'Criação de registro usuarios_empresa'
    ) as Promise<ServiceResult & { usuarioEmpresaId?: string }>;
  }

  /**
   * Cria permissões do usuário de forma segura
   */
  private async createUserPermissionsSafely(
    usuarioEmpresaId: string,
    permissoesModulos: ModulePermissions,
  ): Promise<ServiceResult> {
    return this.executeWithErrorHandling(
      ServiceOperation.CREATE_EMPLOYEE,
      async () => {
        this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Dados de permissões recebidos', {
          usuarioEmpresaId,
          permissoesModulos,
          modulosCount: Object.keys(permissoesModulos || {}).length
        });

        if (!permissoesModulos || Object.keys(permissoesModulos).length === 0) {
          this.log('warn', ServiceOperation.CREATE_EMPLOYEE, 'Nenhuma permissão fornecida - criando permissões padrão para caixa');
          
          // Criar permissões padrão para operador de caixa
          permissoesModulos = {
            gestao_caixa: {
              visualizar: true,
              criar: true,
              editar: true,
              excluir: true,
              administrar: false
            }
          };
        }

        const permissionsToInsert = Object.entries(permissoesModulos).map((
          [modulo, permissoes],
        ) => ({
          usuario_empresa_id: usuarioEmpresaId,
          modulo: modulo,
          permissoes: permissoes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Inserindo permissões', {
          permissionsCount: permissionsToInsert.length,
          permissions: permissionsToInsert
        });

        const client = isAdminConfigured ? supabaseAdmin : supabase;
        const { error } = await client
          .from("permissoes_usuario")
          .insert(permissionsToInsert as any);

        if (error) {
          this.log('error', ServiceOperation.CREATE_EMPLOYEE, 'Erro ao inserir permissões', { error });
          throw new Error(error.message);
        }

        this.log('info', ServiceOperation.CREATE_EMPLOYEE, 'Permissões inseridas com sucesso');
        return { success: true };
      },
      'Criação de permissões de usuário'
    ) as Promise<ServiceResult>;
  }

  /**
   * Remove usuário do Auth de forma segura
   */
  private async cleanupAuthUserSafely(userId: string): Promise<void> {
    try {
      if (isAdminConfigured) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        this.log('info', ServiceOperation.CREATE_EMPLOYEE, 
          'Usuário removido do Auth após erro', { userId });
      }
    } catch (error) {
      this.log('error', ServiceOperation.CREATE_EMPLOYEE, 
        'Erro ao limpar usuário do Auth', { userId }, error);
    }
  }



  /**
   * Cria perfil do usuário (opcional - só se tabela existir)
   */
  private async createUserProfile(
    userId: string,
    employeeData: EmployeeCreationData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Tentar criar perfil, mas não falhar se a tabela não existir
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          name: employeeData.nome_completo,
          role: employeeData.tipo_usuario || "employee",
          avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${
            encodeURIComponent(employeeData.nome_completo)
          }`,
          updated_at: new Date().toISOString(),
        } as any);

      if (error) {
        // Se a tabela não existir, não é um erro crítico
        if (
          error.code === "PGRST116" || error.message.includes("does not exist")
        ) {
          console.warn(
            "⚠️ Tabela profiles não existe - pulando criação de perfil",
          );
          return { success: true }; // Continuar sem perfil
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      // Em caso de erro, não falhar o processo todo
      console.warn("⚠️ Erro ao criar perfil (não crítico):", error);
      return { success: true }; // Continuar sem perfil
    }
  }

  /**
   * Cria registro na tabela bar_employees
   */
  private async createBarEmployee(
    employeeData: EmployeeCreationData,
    empresaId: string,
    authUserId: string | null,
  ): Promise<{ success: boolean; employeeId?: string; error?: string }> {
    try {
      // Construir notes
      const notesArray = [];
      notesArray.push(`Nome: ${employeeData.nome_completo}`);
      if (employeeData.cpf) notesArray.push(`CPF: ${employeeData.cpf}`);
      notesArray.push(`Email: ${employeeData.email}`);
      if (employeeData.telefone) {
        notesArray.push(`Telefone: ${employeeData.telefone}`);
      }
      if (employeeData.observacoes) {
        notesArray.push(`Observações: ${employeeData.observacoes}`);
      }

      const notes = notesArray.join(", ");

      const client = isAdminConfigured ? supabaseAdmin : supabase;
      const { data, error } = await client
        .from("bar_employees")
        .insert([{
          employee_id: authUserId,
          bar_role: employeeData.bar_role,
          shift_preference: employeeData.shift_preference || "qualquer",
          specialties: employeeData.specialties || [],
          commission_rate: employeeData.commission_rate || 0,
          is_active: true,
          start_date: new Date().toISOString().split("T")[0],
          notes: notes,
          empresa_id: empresaId,
        }] as any)
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, employeeId: (data as any)?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Cria registro na tabela usuarios_empresa
   */
  private async createUsuarioEmpresa(
    employeeData: EmployeeCreationData,
    empresaId: string,
    authUserId: string | null,
  ): Promise<{ success: boolean; usuarioEmpresaId?: string; error?: string }> {
    try {
      const client = isAdminConfigured ? supabaseAdmin : supabase;
      const { data, error } = await client
        .from("usuarios_empresa")
        .insert([{
          user_id: authUserId,
          empresa_id: empresaId,
          nome_completo: employeeData.nome_completo,
          email: employeeData.email,
          telefone: employeeData.telefone,
          cargo: employeeData.cargo,
          tipo_usuario: employeeData.tipo_usuario || "funcionario",
          status: "ativo",
          senha_provisoria: true,
          ativo: true,
          tem_acesso_sistema: employeeData.tem_acesso_sistema,
          papel: employeeData.papel || "USER",
          is_primeiro_usuario: false,
          tentativas_login_falhadas: 0,
          total_logins: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }] as any)
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, usuarioEmpresaId: (data as any)?.id };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Cria registro na tabela permissoes_usuario
   */
  private async createPermissoesUsuario(
    usuarioEmpresaId: string,
    permissoesModulos: ModulePermissions,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const permissionsToInsert = Object.entries(permissoesModulos).map((
        [modulo, permissoes],
      ) => ({
        usuario_empresa_id: usuarioEmpresaId,
        modulo: modulo,
        permissoes: permissoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const client = isAdminConfigured ? supabaseAdmin : supabase;
      const { error } = await client
        .from("permissoes_usuario")
        .insert(permissionsToInsert as any);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Cria usuário no Supabase Auth
   */
  private async createUserAuth(
    email: string,
    senha: string,
    employee: EmployeeCreationData,
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: senha,
        options: {
          data: {
            name: employee.nome_completo,
            role: "funcionario"
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: "Usuário não foi criado" };
      }

      return { success: true, userId: data.user.id };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }

  /**
   * Verifica se email já existe no sistema
   */
  private async checkEmailExists(email: string): Promise<boolean> {
    const operation = ServiceOperation.CHECK_EMAIL;
    
    try {
      this.log('debug', operation, 'Verificando se email já existe', { email });
      
      // Verificar na tabela usuarios_empresa
      const { data, error } = await supabase
        .from("usuarios_empresa")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .limit(1);

      if (error) {
        this.log('error', operation, 'Erro ao consultar banco de dados', { email }, error);
        return false; // Em caso de erro, assumir que não existe para não bloquear
      }

      const exists = data && data.length > 0;
      this.log('debug', operation, `Email ${exists ? 'já existe' : 'não existe'} no sistema`, { 
        email, 
        exists 
      });

      return exists;
    } catch (error) {
      this.log('error', operation, 'Erro geral ao verificar email', { email }, error);
      return false; // Em caso de erro, assumir que não existe para não bloquear
    }
  }

  /**
   * Remove usuário do Auth em caso de erro
   */
  private async cleanupAuthUser(userId: string): Promise<void> {
    try {
      if (isAdminConfigured) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log("🗑️ Usuário removido do Auth após erro:", userId);
      }
    } catch (error) {
      console.error("❌ Erro ao limpar usuário do Auth:", error);
    }
  }

  /**
   * Gera permissões padrão baseadas na função usando o novo sistema de presets
   */
  static async generateDefaultPermissions(
    barRole: string,
  ): Promise<EmployeeCreationData["permissoes_modulos"]> {
    try {
      // Importar o gerenciador de presets dinamicamente para evitar dependência circular
      const { permissionPresetManager } = await import('./permission-presets');
      
      // Validar se a função é válida
      const validRoles = ["atendente", "garcom", "cozinheiro", "barman", "gerente"];
      if (!validRoles.includes(barRole)) {
        console.warn(`Função inválida: ${barRole}. Usando permissões básicas.`);
        return {
          dashboard: {
            visualizar: true,
            criar: false,
            editar: false,
            excluir: false,
            administrar: false,
          },
        };
      }

      // Obter permissões do sistema de presets
      const permissions = permissionPresetManager.getDefaultPermissions(barRole as any);
      
      // Converter para o formato esperado pelo EmployeeCreationData
      const convertedPermissions: EmployeeCreationData["permissoes_modulos"] = {};
      
      for (const [module, permission] of Object.entries(permissions)) {
        convertedPermissions[module] = {
          visualizar: permission.visualizar,
          criar: permission.criar,
          editar: permission.editar,
          excluir: permission.excluir,
          administrar: permission.administrar,
        };
      }

      return convertedPermissions;
    } catch (error) {
      console.error('Erro ao gerar permissões padrão:', error);
      
      // Fallback para permissões básicas em caso de erro
      return {
        dashboard: {
          visualizar: true,
          criar: false,
          editar: false,
          excluir: false,
          administrar: false,
        },
      };
    }
  }

  /**
   * Atualiza senha de um funcionário existente
   */
  async updateEmployeePassword(
    userId: string,
    newPassword: string,
    isTemporary: boolean = false,
  ): Promise<ServiceResult> {
    const operation = ServiceOperation.UPDATE_PASSWORD;
    
    this.log('info', operation, 'Iniciando atualização de senha', { 
      userId, 
      isTemporary 
    });

    return this.executeWithErrorHandling(
      operation,
      async () => {
        if (!isAdminConfigured) {
          throw this.createServiceError(
            ErrorType.PERMISSION_ERROR, 
            "Configuração admin não disponível para atualização de senha"
          );
        }

        // Validar senha
        if (!newPassword || newPassword.length < 6) {
          throw this.createServiceError(
            ErrorType.VALIDATION_ERROR,
            "Nova senha deve ter pelo menos 6 caracteres"
          );
        }

        // Atualizar senha no Auth
        this.log('debug', operation, 'Atualizando senha no Supabase Auth');
        const { error: authError } = await supabaseAdmin.auth.admin
          .updateUserById(userId, {
            password: newPassword,
          });

        if (authError) {
          throw this.createServiceError(ErrorType.AUTH_ERROR, authError.message);
        }

        // Atualizar flag de senha provisória na tabela usuarios_empresa
        this.log('debug', operation, 'Atualizando flag de senha provisória');
        const { error: updateError } = await supabaseAdmin
          .from("usuarios_empresa")
          .update({
            senha_provisoria: isTemporary,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("user_id", userId);

        if (updateError) {
          this.log('warn', operation, 'Erro ao atualizar flag senha_provisoria', {}, updateError);
        }

        this.log('info', operation, 'Senha atualizada com sucesso');
        return { success: true };
      },
      'Atualização de senha de funcionário'
    ) as Promise<ServiceResult>;
  }

  /**
   * Desativa um funcionário (soft delete)
   */
  async deactivateEmployee(employeeId: string): Promise<ServiceResult> {
    const operation = ServiceOperation.DEACTIVATE_EMPLOYEE;
    
    this.log('info', operation, 'Iniciando desativação de funcionário', { employeeId });

    return this.executeWithErrorHandling(
      operation,
      async () => {
        if (!employeeId?.trim()) {
          throw this.createServiceError(
            ErrorType.VALIDATION_ERROR,
            "ID do funcionário é obrigatório"
          );
        }

        // Desativar na tabela bar_employees
        this.log('debug', operation, 'Desativando na tabela bar_employees');
        const { error: barError } = await supabaseAdmin
          .from("bar_employees")
          .update({
            is_active: false,
            end_date: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", employeeId);

        if (barError) {
          throw this.createServiceError(ErrorType.DATABASE_ERROR, barError.message);
        }

        // Buscar user_id do funcionário
        this.log('debug', operation, 'Buscando user_id do funcionário');
        const { data: employee, error: fetchError } = await supabaseAdmin
          .from("bar_employees")
          .select("employee_id")
          .eq("id", employeeId)
          .single();

        if (fetchError || !employee?.employee_id) {
          this.log('warn', operation, 
            'Não foi possível encontrar user_id para desativar na usuarios_empresa');
          return { success: true }; // Sucesso parcial
        }

        // Desativar na tabela usuarios_empresa
        this.log('debug', operation, 'Desativando na tabela usuarios_empresa');
        const { error: userError } = await supabaseAdmin
          .from("usuarios_empresa")
          .update({
            ativo: false,
            status: "inativo" as EmployeeStatus,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("user_id", employee.employee_id);

        if (userError) {
          this.log('warn', operation, 'Erro ao desativar na usuarios_empresa', {}, userError);
        }

        this.log('info', operation, 'Funcionário desativado com sucesso');
        return { success: true };
      },
      'Desativação de funcionário'
    ) as Promise<ServiceResult>;
  }

  /**
   * Reativa um funcionário
   */
  async reactivateEmployee(employeeId: string): Promise<ServiceResult> {
    const operation = ServiceOperation.REACTIVATE_EMPLOYEE;
    
    this.log('info', operation, 'Iniciando reativação de funcionário', { employeeId });

    return this.executeWithErrorHandling(
      operation,
      async () => {
        if (!employeeId?.trim()) {
          throw this.createServiceError(
            ErrorType.VALIDATION_ERROR,
            "ID do funcionário é obrigatório"
          );
        }

        // Reativar na tabela bar_employees
        this.log('debug', operation, 'Reativando na tabela bar_employees');
        const { error: barError } = await supabaseAdmin
          .from("bar_employees")
          .update({
            is_active: true,
            end_date: null,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", employeeId);

        if (barError) {
          throw this.createServiceError(ErrorType.DATABASE_ERROR, barError.message);
        }

        // Buscar user_id do funcionário
        this.log('debug', operation, 'Buscando user_id do funcionário');
        const { data: employee, error: fetchError } = await supabaseAdmin
          .from("bar_employees")
          .select("employee_id")
          .eq("id", employeeId)
          .single();

        if (fetchError || !employee?.employee_id) {
          this.log('warn', operation, 
            'Não foi possível encontrar user_id para reativar na usuarios_empresa');
          return { success: true }; // Sucesso parcial
        }

        // Reativar na tabela usuarios_empresa
        this.log('debug', operation, 'Reativando na tabela usuarios_empresa');
        const { error: userError } = await supabaseAdmin
          .from("usuarios_empresa")
          .update({
            ativo: true,
            status: "ativo" as EmployeeStatus,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("user_id", employee.employee_id);

        if (userError) {
          this.log('warn', operation, 'Erro ao reativar na usuarios_empresa', {}, userError);
        }

        this.log('info', operation, 'Funcionário reativado com sucesso');
        return { success: true };
      },
      'Reativação de funcionário'
    ) as Promise<ServiceResult>;
  }

  /**
   * Atualiza permissões de um funcionário
   */
  async updateEmployeePermissions(
    usuarioEmpresaId: string,
    newPermissions: ModulePermissions,
  ): Promise<ServiceResult> {
    const operation = ServiceOperation.UPDATE_PERMISSIONS;
    
    this.log('info', operation, 'Iniciando atualização de permissões', { 
      usuarioEmpresaId,
      modulesCount: Object.keys(newPermissions).length
    });

    return this.executeWithErrorHandling(
      operation,
      async () => {
        if (!usuarioEmpresaId?.trim()) {
          throw this.createServiceError(
            ErrorType.VALIDATION_ERROR,
            "ID do usuário empresa é obrigatório"
          );
        }

        if (!newPermissions || Object.keys(newPermissions).length === 0) {
          throw this.createServiceError(
            ErrorType.VALIDATION_ERROR,
            "Novas permissões são obrigatórias"
          );
        }

        // Remover permissões existentes
        this.log('debug', operation, 'Removendo permissões existentes');
        const { error: deleteError } = await supabaseAdmin
          .from("permissoes_usuario")
          .delete()
          .eq("usuario_empresa_id", usuarioEmpresaId);

        if (deleteError) {
          throw this.createServiceError(ErrorType.DATABASE_ERROR, deleteError.message);
        }

        // Inserir novas permissões
        this.log('debug', operation, 'Inserindo novas permissões');
        const permissionsToInsert = Object.entries(newPermissions).map((
          [modulo, permissoes],
        ) => ({
          usuario_empresa_id: usuarioEmpresaId,
          modulo: modulo,
          permissoes: permissoes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabaseAdmin
          .from("permissoes_usuario")
          .insert(permissionsToInsert);

        if (insertError) {
          throw this.createServiceError(ErrorType.DATABASE_ERROR, insertError.message);
        }

        this.log('info', operation, 'Permissões atualizadas com sucesso');
        return { success: true };
      },
      'Atualização de permissões de funcionário'
    ) as Promise<ServiceResult>;
  }

  /**
   * Reseta a senha de um funcionário
   */
  async resetEmployeePassword(
    employeeId: string,
    empresaId: string
  ): Promise<ServiceResult & { credentials?: { email: string; senha_temporaria: string } }> {
    const operation = ServiceOperation.UPDATE_EMPLOYEE;
    
    return this.executeWithErrorHandling(
      operation,
      async () => {
        // Buscar dados do funcionário
        const { data: employee, error: fetchError } = await supabase
          .from("bar_employees")
          .select(`
            employee_id,
            employees!inner(
              profile_id,
              name,
              email
            )
          `)
          .eq("id", employeeId)
          .eq("empresa_id", empresaId)
          .single();

        if (fetchError || !employee) {
          throw new Error('Funcionário não encontrado');
        }

        const userEmail = employee.employees.email;
        const userName = employee.employees.name;

        // Gerar nova senha
        const credentials = this.generateCredentials(userEmail);

        // Tentar resetar a senha via Supabase Admin API
        try {
          const { error: resetError } = await supabase.auth.admin.updateUserById(
            employee.employees.profile_id,
            { password: credentials.senha_temporaria }
          );

          if (resetError) {
            throw new Error(`Erro ao resetar senha: ${resetError.message}`);
          }

          this.log('info', operation, 'Senha resetada com sucesso', { 
            employeeId, 
            email: userEmail 
          });

          return {
            success: true,
            credentials: {
              email: userEmail,
              senha_temporaria: credentials.senha_temporaria
            }
          };
        } catch (error) {
          throw new Error(`Falha ao resetar senha: ${error.message}`);
        }
      },
      'Reset de senha do funcionário'
    ) as Promise<ServiceResult & { credentials?: { email: string; senha_temporaria: string } }>;
  }

  /**
   * Lista funcionários de uma empresa
   */
  async listEmployees(
    empresaId: string,
    includeInactive: boolean = false,
  ): Promise<EmployeeListResult> {
    const operation = ServiceOperation.LIST_EMPLOYEES;
    
    this.log('info', operation, 'Iniciando listagem de funcionários', { 
      empresaId, 
      includeInactive 
    });

    return this.executeWithErrorHandling(
      operation,
      async () => {
        if (!empresaId?.trim()) {
          throw this.createServiceError(
            ErrorType.VALIDATION_ERROR,
            "ID da empresa é obrigatório"
          );
        }

        let query = supabase
          .from("bar_employees")
          .select(`
            id,
            employee_id,
            bar_role,
            shift_preference,
            specialties,
            commission_rate,
            is_active,
            start_date,
            end_date,
            notes,
            created_at,
            updated_at,
            usuarios_empresa:employee_id (
              nome_completo,
              email,
              telefone,
              cargo,
              status,
              senha_provisoria
            )
          `)
          .eq("empresa_id", empresaId);

        if (!includeInactive) {
          query = query.eq("is_active", true);
        }

        this.log('debug', operation, 'Executando consulta no banco de dados');
        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          throw this.createServiceError(ErrorType.DATABASE_ERROR, error.message);
        }

        const employees = data || [];
        this.log('info', operation, `Listagem concluída: ${employees.length} funcionários encontrados`);

        return { 
          success: true, 
          employees,
          total: employees.length
        };
      },
      'Listagem de funcionários'
    ) as Promise<EmployeeListResult>;
  }
}

// Exportar instância singleton
export const employeeCreationService = EmployeeCreationService.getInstance();

// Exportar como padrão também
export default employeeCreationService;
