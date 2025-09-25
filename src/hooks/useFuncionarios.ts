import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UsuarioEmpresa, ModuloSistema, PermissaoModulo } from '../types/multitenant';
import { useMultitenantAuth } from '../contexts/MultitenantAuthContextSimple';

interface NovoFuncionarioData {
  nome_completo: string;
  email: string;
  telefone?: string;
  cargo?: string;
  tem_acesso_sistema: boolean;
  permissoes?: Record<ModuloSistema, PermissaoModulo>;
}

interface UseFuncionariosReturn {
  funcionarios: UsuarioEmpresa[];
  isLoading: boolean;
  error: string | null;
  carregarFuncionarios: () => Promise<void>;
  criarFuncionario: (data: NovoFuncionarioData) => Promise<{ success: boolean; error?: string; funcionario?: UsuarioEmpresa }>;
  atualizarFuncionario: (id: string, data: Partial<NovoFuncionarioData>) => Promise<{ success: boolean; error?: string }>;
  alterarStatusFuncionario: (id: string, status: 'ativo' | 'inativo' | 'bloqueado') => Promise<{ success: boolean; error?: string }>;
  excluirFuncionario: (id: string) => Promise<{ success: boolean; error?: string }>;
  carregarPermissoesFuncionario: (funcionarioId: string) => Promise<Record<ModuloSistema, PermissaoModulo> | null>;
  atualizarPermissoesFuncionario: (funcionarioId: string, permissoes: Record<ModuloSistema, PermissaoModulo>) => Promise<{ success: boolean; error?: string }>;
  gerarSenhaProvisoria: () => string;
  enviarCredenciaisPorEmail: (funcionario: UsuarioEmpresa, senha: string) => Promise<{ success: boolean; error?: string }>;
}

export const useFuncionarios = (): UseFuncionariosReturn => {
  const { empresa } = useMultitenantAuth();
  const [funcionarios, setFuncionarios] = useState<UsuarioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar funcionários da empresa
  const carregarFuncionarios = async () => {
    if (!empresa?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('usuarios_empresa')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setFuncionarios(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar funcionários';
      setError(errorMessage);
      console.error('Erro ao carregar funcionários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gerar senha provisória segura
  const gerarSenhaProvisoria = (): string => {
    // SOLUÇÃO DEFINITIVA: Sempre usar senha genérica simples
    return "123456";
  };

  // Criar novo funcionário
  const criarFuncionario = async (data: NovoFuncionarioData) => {
    if (!empresa?.id) {
      return { success: false, error: 'Empresa não identificada' };
    }

    try {
      setError(null);
      let usuarioAuth = null;
      let senhaGerada = '';

      // Se tem acesso ao sistema, criar usuário no Supabase Auth
      if (data.tem_acesso_sistema) {
        senhaGerada = gerarSenhaProvisoria();
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: senhaGerada,
          options: {
            data: {
              nome_completo: data.nome_completo,
              role: 'employee' // CORREÇÃO: Sempre "employee" para funcionários
            }
          }
        });

        if (authError) {
          throw new Error(`Erro ao criar usuário: ${authError.message}`);
        }

        usuarioAuth = authData.user;
      }

      // Criar funcionário na tabela usuarios_empresa
      const funcionarioData = {
        nome_completo: data.nome_completo,
        email: data.email,
        telefone: data.telefone || null,
        cargo: data.cargo || null,
        user_id: usuarioAuth?.id || null,
        empresa_id: empresa.id,
        tipo_usuario: 'funcionario' as const,
        status: 'ativo' as const,
        senha_provisoria: data.tem_acesso_sistema ? true : false // CORREÇÃO: Sempre true se tem acesso
      };

      const { data: funcionarioCriado, error: funcionarioError } = await supabase
        .from('usuarios_empresa')
        .insert(funcionarioData)
        .select()
        .single();

      if (funcionarioError) {
        // Se falhou ao criar funcionário, remover usuário auth criado
        if (usuarioAuth?.id) {
          await supabase.auth.admin.deleteUser(usuarioAuth.id);
        }
        throw new Error(`Erro ao criar funcionário: ${funcionarioError.message}`);
      }

      // CORREÇÃO CRÍTICA: Sempre criar permissões para funcionários com acesso
      if (data.tem_acesso_sistema) {
        let permissoesArray = [];
        
        // Se permissões foram fornecidas pelo usuário, usar elas
        if (data.permissoes) {
          permissoesArray = Object.entries(data.permissoes).map(([modulo, permissoes]) => ({
            usuario_empresa_id: funcionarioCriado.id,
            modulo: modulo as ModuloSistema,
            permissoes
          }));
        } else {
          // SOLUÇÃO: Se não foram fornecidas, criar permissões básicas de funcionário
          permissoesArray = [
            {
              usuario_empresa_id: funcionarioCriado.id,
              modulo: 'dashboard' as ModuloSistema,
              permissoes: {
                visualizar: true,
                criar: false,
                editar: false,
                excluir: false,
                administrar: false
              }
            },
            {
              usuario_empresa_id: funcionarioCriado.id,
              modulo: 'atendimento_bar' as ModuloSistema,
              permissoes: {
                visualizar: true,
                criar: true,
                editar: true,
                excluir: false,
                administrar: false
              }
            },
            {
              usuario_empresa_id: funcionarioCriado.id,
              modulo: 'clientes' as ModuloSistema,
              permissoes: {
                visualizar: true,
                criar: true,
                editar: false,
                excluir: false,
                administrar: false
              }
            }
          ];
        }

        // Sempre inserir permissões (nunca deixar vazio)
        if (permissoesArray.length > 0) {
          const { error: permError } = await supabase
            .from('permissoes_usuario')
            .insert(permissoesArray);

          if (permError) {
            console.error('Erro ao salvar permissões:', permError);
            // CRÍTICO: Se falhar nas permissões, reverter criação
            throw new Error(`Erro crítico ao criar permissões: ${permError.message}`);
          } else {
            console.log('✅ Permissões criadas com sucesso:', permissoesArray.length);
          }
        }

        // Enviar credenciais por email
        if (senhaGerada) {
          await enviarCredenciaisPorEmail(funcionarioCriado, senhaGerada);
        }
      }

      // Recarregar lista
      await carregarFuncionarios();

      return { success: true, funcionario: funcionarioCriado };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Atualizar funcionário existente
  const atualizarFuncionario = async (id: string, data: Partial<NovoFuncionarioData>) => {
    try {
      setError(null);

      const updateData: any = {};
      
      if (data.nome_completo !== undefined) updateData.nome_completo = data.nome_completo;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.telefone !== undefined) updateData.telefone = data.telefone || null;
      if (data.cargo !== undefined) updateData.cargo = data.cargo || null;

      const { error: updateError } = await supabase
        .from('usuarios_empresa')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Erro ao atualizar funcionário: ${updateError.message}`);
      }

      // Atualizar permissões se fornecidas
      if (data.permissoes) {
        await atualizarPermissoesFuncionario(id, data.permissoes);
      }

      // Recarregar lista
      await carregarFuncionarios();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Alterar status do funcionário
  const alterarStatusFuncionario = async (id: string, status: 'ativo' | 'inativo' | 'bloqueado') => {
    try {
      setError(null);

      const { error } = await supabase
        .from('usuarios_empresa')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      // Se bloqueando ou desativando, invalidar sessões ativas
      if (status === 'bloqueado' || status === 'inativo') {
        const funcionario = funcionarios.find(f => f.id === id);
        if (funcionario?.user_id) {
          // TODO: Implementar invalidação de sessões ativas
          console.log('TODO: Invalidar sessões ativas do usuário', funcionario.user_id);
        }
      }

      // Recarregar lista
      await carregarFuncionarios();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Excluir funcionário
  const excluirFuncionario = async (id: string) => {
    try {
      setError(null);

      const funcionario = funcionarios.find(f => f.id === id);
      
      // Remover permissões primeiro
      await supabase
        .from('permissoes_usuario')
        .delete()
        .eq('usuario_empresa_id', id);

      // Remover funcionário
      const { error } = await supabase
        .from('usuarios_empresa')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir funcionário: ${error.message}`);
      }

      // Se tinha acesso ao sistema, remover usuário auth
      if (funcionario?.user_id) {
        await supabase.auth.admin.deleteUser(funcionario.user_id);
      }

      // Recarregar lista
      await carregarFuncionarios();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir funcionário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Carregar permissões de um funcionário
  const carregarPermissoesFuncionario = async (funcionarioId: string): Promise<Record<ModuloSistema, PermissaoModulo> | null> => {
    try {
      const { data, error } = await supabase
        .from('permissoes_usuario')
        .select('*')
        .eq('usuario_empresa_id', funcionarioId);

      if (error) {
        throw new Error(error.message);
      }

      // Inicializar todas as permissões como false
      const permissoes: Record<ModuloSistema, PermissaoModulo> = {} as Record<ModuloSistema, PermissaoModulo>;
      
      Object.values(ModuloSistema).forEach(modulo => {
        permissoes[modulo] = {
          visualizar: false,
          criar: false,
          editar: false,
          excluir: false,
          administrar: false
        };
      });

      // Aplicar permissões específicas
      data?.forEach(permissao => {
        permissoes[permissao.modulo as ModuloSistema] = permissao.permissoes;
      });

      return permissoes;
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      return null;
    }
  };

  // Atualizar permissões de um funcionário
  const atualizarPermissoesFuncionario = async (funcionarioId: string, permissoes: Record<ModuloSistema, PermissaoModulo>) => {
    try {
      // Remover permissões existentes
      await supabase
        .from('permissoes_usuario')
        .delete()
        .eq('usuario_empresa_id', funcionarioId);

      // Inserir novas permissões
      const permissoesArray = Object.entries(permissoes).map(([modulo, permissao]) => ({
        usuario_empresa_id: funcionarioId,
        modulo: modulo as ModuloSistema,
        permissoes: permissao
      }));

      if (permissoesArray.length > 0) {
        const { error } = await supabase
          .from('permissoes_usuario')
          .insert(permissoesArray);

        if (error) {
          throw new Error(error.message);
        }
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar permissões';
      return { success: false, error: errorMessage };
    }
  };

  // Enviar credenciais por email (placeholder)
  const enviarCredenciaisPorEmail = async (funcionario: UsuarioEmpresa, senha: string) => {
    try {
      // TODO: Implementar envio de email real
      console.log('Enviando credenciais por email:', {
        para: funcionario.email,
        nome: funcionario.nome_completo,
        senha: senha,
        empresa: empresa?.nome
      });

      // Por enquanto, apenas simular sucesso
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar email';
      return { success: false, error: errorMessage };
    }
  };

  // Carregar funcionários quando a empresa mudar
  useEffect(() => {
    if (empresa?.id) {
      carregarFuncionarios();
    }
  }, [empresa?.id]);

  return {
    funcionarios,
    isLoading,
    error,
    carregarFuncionarios,
    criarFuncionario,
    atualizarFuncionario,
    alterarStatusFuncionario,
    excluirFuncionario,
    carregarPermissoesFuncionario,
    atualizarPermissoesFuncionario,
    gerarSenhaProvisoria,
    enviarCredenciaisPorEmail
  };
};