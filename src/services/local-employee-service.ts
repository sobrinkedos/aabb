/**
 * Serviço Local de Funcionários
 * 
 * Fallback para quando o Supabase Auth não estiver configurado
 * Armazena credenciais localmente para desenvolvimento
 */

import { Employee } from '../types/employee.types';
import { EmployeeAuthCredentials, EmployeeAuthResult } from './employee-auth-service';

interface LocalEmployeeCredentials {
  employeeId: string;
  email: string;
  username: string;
  password: string;
  temporaryPassword: boolean;
  createdAt: string;
}

export class LocalEmployeeService {
  private static instance: LocalEmployeeService;
  private readonly storageKey = 'local_employee_credentials';

  static getInstance(): LocalEmployeeService {
    if (!LocalEmployeeService.instance) {
      LocalEmployeeService.instance = new LocalEmployeeService();
    }
    return LocalEmployeeService.instance;
  }

  /**
   * Salva credenciais localmente
   */
  async saveEmployeeCredentials(employee: Employee, credentials: EmployeeAuthCredentials): Promise<EmployeeAuthResult> {
    try {
      const existingCredentials = this.getStoredCredentials();
      
      // Verificar duplicatas
      const emailExists = existingCredentials.some(cred => cred.email === credentials.email);
      if (emailExists) {
        return {
          success: false,
          error: `Email ${credentials.email} já está em uso`
        };
      }

      const usernameExists = existingCredentials.some(cred => cred.username === credentials.username);
      if (usernameExists) {
        return {
          success: false,
          error: `Nome de usuário ${credentials.username} já está em uso`
        };
      }

      // Adicionar nova credencial
      const newCredential: LocalEmployeeCredentials = {
        employeeId: employee.id || `temp_${Date.now()}`,
        email: credentials.email,
        username: credentials.username,
        password: credentials.password,
        temporaryPassword: credentials.temporaryPassword,
        createdAt: new Date().toISOString()
      };

      const updatedCredentials = [...existingCredentials, newCredential];
      localStorage.setItem(this.storageKey, JSON.stringify(updatedCredentials));

      console.log('💾 Credenciais salvas localmente:', { 
        email: credentials.email, 
        username: credentials.username 
      });

      return {
        success: true,
        userId: newCredential.employeeId,
        needsPasswordChange: credentials.temporaryPassword
      };

    } catch (error) {
      console.error('❌ Erro ao salvar credenciais localmente:', error);
      return {
        success: false,
        error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Verifica se um email já existe
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const credentials = this.getStoredCredentials();
    return credentials.some(cred => cred.email === email);
  }

  /**
   * Verifica se um username já existe
   */
  async checkUsernameExists(username: string): Promise<boolean> {
    const credentials = this.getStoredCredentials();
    return credentials.some(cred => cred.username === username);
  }

  /**
   * Valida credenciais de login
   */
  async validateLogin(emailOrUsername: string, password: string): Promise<LocalEmployeeCredentials | null> {
    const credentials = this.getStoredCredentials();
    
    const found = credentials.find(cred => 
      (cred.email === emailOrUsername || cred.username === emailOrUsername) && 
      cred.password === password
    );

    return found || null;
  }

  /**
   * Lista todas as credenciais (para debug)
   */
  listAllCredentials(): LocalEmployeeCredentials[] {
    return this.getStoredCredentials();
  }

  /**
   * Remove credenciais de um funcionário
   */
  async removeEmployeeCredentials(employeeId: string): Promise<boolean> {
    try {
      const credentials = this.getStoredCredentials();
      const filtered = credentials.filter(cred => cred.employeeId !== employeeId);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      
      console.log('🗑️ Credenciais removidas localmente:', employeeId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover credenciais:', error);
      return false;
    }
  }

  /**
   * Atualiza senha de um funcionário
   */
  async updatePassword(employeeId: string, newPassword: string, isTemporary: boolean = false): Promise<boolean> {
    try {
      const credentials = this.getStoredCredentials();
      const index = credentials.findIndex(cred => cred.employeeId === employeeId);
      
      if (index === -1) {
        return false;
      }

      credentials[index].password = newPassword;
      credentials[index].temporaryPassword = isTemporary;
      
      localStorage.setItem(this.storageKey, JSON.stringify(credentials));
      
      console.log('🔑 Senha atualizada localmente:', employeeId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      return false;
    }
  }

  /**
   * Limpa todas as credenciais (para reset)
   */
  clearAllCredentials(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🧹 Todas as credenciais locais foram removidas');
  }

  /**
   * Exporta credenciais para backup
   */
  exportCredentials(): string {
    const credentials = this.getStoredCredentials();
    return JSON.stringify(credentials, null, 2);
  }

  /**
   * Importa credenciais de backup
   */
  importCredentials(jsonData: string): boolean {
    try {
      const credentials = JSON.parse(jsonData);
      
      // Validar estrutura
      if (!Array.isArray(credentials)) {
        throw new Error('Formato inválido');
      }

      localStorage.setItem(this.storageKey, JSON.stringify(credentials));
      console.log('📥 Credenciais importadas com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar credenciais:', error);
      return false;
    }
  }

  /**
   * Obtém credenciais armazenadas
   */
  private getStoredCredentials(): LocalEmployeeCredentials[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao ler credenciais locais:', error);
      return [];
    }
  }

  /**
   * Gera relatório de credenciais para debug
   */
  generateReport(): string {
    const credentials = this.getStoredCredentials();
    
    const report = `
📊 RELATÓRIO DE CREDENCIAIS LOCAIS
================================

Total de funcionários: ${credentials.length}

Funcionários cadastrados:
${credentials.map((cred, index) => `
${index + 1}. ${cred.username} (${cred.email})
   - ID: ${cred.employeeId}
   - Senha temporária: ${cred.temporaryPassword ? 'Sim' : 'Não'}
   - Criado em: ${new Date(cred.createdAt).toLocaleString('pt-BR')}
`).join('')}

⚠️ IMPORTANTE: Estas credenciais são apenas para desenvolvimento local.
Em produção, use o Supabase Auth configurando a VITE_SUPABASE_SERVICE_ROLE_KEY.
    `.trim();

    return report;
  }
}