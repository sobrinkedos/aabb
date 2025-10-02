import { supabase } from '../lib/supabase';
import { RegistroEmpresaData, Empresa, UsuarioEmpresa } from '../types/multitenant';
import { PrimeiroUsuarioUtils } from '../utils/primeiroUsuarioUtils';
import { ConfigurationService } from './configurationService';

export interface RegistroResult {
  success: boolean;
  error?: string;
  empresa?: Empresa;
  usuario?: UsuarioEmpresa;
}

export class RegistroEmpresaService {
  /**
   * Registra uma nova empresa com o primeiro usuário como SUPER_ADMIN
   */
  static async registrarEmpresa(dados: RegistroEmpresaData): Promise<RegistroResult> {
    try {
      // 1. Validar dados de entrada
      const validacao = this.validarDadosRegistro(dados);
      if (!validacao.valido) {
        return { success: false, error: validacao.erro };
      }

      // 2. Verificar se CNPJ já existe
      const cnpjExiste = await this.verificarCNPJExistente(dados.cnpj);
      if (cnpjExiste) {
        return { success: false, error: 'CNPJ já cadastrado no sistema' };
      }

      // 3. Criar usuário no Supabase Auth como ADMINISTRADOR
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dados.email_admin,
        password: dados.senha,
        options: {
          data: {
            name: dados.nome_admin,
            full_name: dados.nome_admin,
            role: 'admin' // CRÍTICO: Definir como admin, não employee
          }
        }
      });

      if (authError || !authData.user) {
        console.error('Erro ao criar usuário no auth:', authError);
        return { success: false, error: authError?.message || 'Erro ao criar usuário' };
      }

      // 4. Criar empresa
      const empresaResult = await this.criarEmpresa(dados, authData.user.id);
      if (!empresaResult.success || !empresaResult.empresa) {
        return { success: false, error: empresaResult.error };
      }

      return empresaResult;
    } catch (error) {
      console.error('Erro no registro da empresa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
  /**
   * Valida os dados de registro
   */
  private static validarDadosRegistro(dados: RegistroEmpresaData): { valido: boolean; erro?: string } {
    if (!dados.nome_empresa?.trim()) {
      return { valido: false, erro: 'Nome da empresa é obrigatório' };
    }

    if (!dados.cnpj?.trim()) {
      return { valido: false, erro: 'CNPJ é obrigatório' };
    }

    if (!this.validarCNPJ(dados.cnpj)) {
      return { valido: false, erro: 'CNPJ inválido' };
    }

    if (!dados.nome_admin?.trim()) {
      return { valido: false, erro: 'Nome do administrador é obrigatório' };
    }

    if (!dados.email_admin?.trim()) {
      return { valido: false, erro: 'Email é obrigatório' };
    }

    if (!this.validarEmail(dados.email_admin)) {
      return { valido: false, erro: 'Email inválido' };
    }

    if (!dados.senha || dados.senha.length < 8) {
      return { valido: false, erro: 'Senha deve ter pelo menos 8 caracteres' };
    }

    if (dados.senha !== dados.confirmar_senha) {
      return { valido: false, erro: 'Senhas não coincidem' };
    }

    return { valido: true };
  }

  /**
   * Valida CNPJ
   */
  private static validarCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação dos dígitos verificadores
    let soma = 0;
    let peso = 2;
    
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cleanCNPJ[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cleanCNPJ[12]) !== digito1) return false;
    
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cleanCNPJ[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const resto2 = soma % 11;
    const digito2 = resto2 < 2 ? 0 : 11 - resto2;
    
    return parseInt(cleanCNPJ[13]) === digito2;
  }

  /**
   * Valida email
   */
  private static validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  } 
 /**
   * Verifica se CNPJ já existe
   */
  private static async verificarCNPJExistente(cnpj: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id')
        .eq('cnpj', cnpj)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao verificar CNPJ:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error);
      return false;
    }
  }

  /**
   * Cria a empresa no banco de dados
   */
  private static async criarEmpresa(dados: RegistroEmpresaData, userId: string): Promise<RegistroResult> {
    try {
      // Usar service role para criar empresa (bypass RLS)
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      let empresaData;
      let empresaError;

      if (serviceRoleKey && serviceRoleKey !== import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // Usar service role se disponível
        const { createClient } = await import('@supabase/supabase-js');
        const serviceClient = createClient(supabaseUrl, serviceRoleKey);
        
        const result = await serviceClient
          .from('empresas')
          .insert({
            nome: dados.nome_empresa,
            cnpj: dados.cnpj,
            email_admin: dados.email_admin,
            telefone: dados.telefone_empresa,
            endereco: dados.endereco,
            status: 'ativo'
          })
          .select()
          .single();
          
        empresaData = result.data;
        empresaError = result.error;
      } else {
        // Fallback para cliente normal
        const result = await supabase
          .from('empresas')
          .insert({
            nome: dados.nome_empresa,
            cnpj: dados.cnpj,
            email_admin: dados.email_admin,
            telefone: dados.telefone_empresa,
            endereco: dados.endereco,
            status: 'ativo'
          })
          .select()
          .single();
          
        empresaData = result.data;
        empresaError = result.error;
      }

      if (empresaError || !empresaData) {
        console.error('Erro ao criar empresa:', empresaError);
        return { success: false, error: empresaError?.message || 'Erro ao criar empresa' };
      }

      const empresa = empresaData;

      // Criar primeiro usuário como SUPER_ADMIN
      const usuarioResult = await PrimeiroUsuarioUtils.criarPrimeiroUsuario({
        user_id: userId,
        empresa_id: empresa.id,
        nome_completo: dados.nome_admin,
        email: dados.email_admin,
        telefone: dados.telefone_admin,
        cargo: 'Administrador Principal'
      });

      if (!usuarioResult.success) {
        // Se falhou ao criar usuário, tentar reverter criação da empresa
        await supabase.from('empresas').delete().eq('id', empresa.id);
        return { success: false, error: usuarioResult.error };
      }

      // Marcar para mostrar onboarding após login
      sessionStorage.setItem('show_onboarding', 'true');
      sessionStorage.setItem('onboarding_user_name', dados.nome_admin);
      sessionStorage.setItem('onboarding_company_name', dados.nome_empresa);

      return {
        success: true,
        empresa: empresa as Empresa,
        usuario: { id: usuarioResult.usuarioId } as UsuarioEmpresa
      };
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}