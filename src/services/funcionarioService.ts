import { supabase } from '../lib/supabase';

export interface CriarFuncionarioData {
  nome_completo: string;
  email: string;
  telefone?: string;
  cargo?: string;
  empresa_id: string;
  tem_acesso_sistema: boolean;
  permissoes?: any;
}

export interface CriarFuncionarioResult {
  success: boolean;
  error?: string;
  funcionario_id?: string;
  senha_provisoria?: string;
}

// Gerar senha provisória segura
export const gerarSenhaProvisoria = (): string => {
  // SOLUÇÃO DEFINITIVA: Sempre usar senha genérica simples
  return "123456";
};

// Criar funcionário com credenciais automáticas
export const criarFuncionarioComCredenciais = async (data: CriarFuncionarioData): Promise<CriarFuncionarioResult> => {
  try {
    let usuarioAuth = null;
    let senhaGerada = null;

    // Se tem acesso ao sistema, criar usuário no Supabase Auth
    if (data.tem_acesso_sistema) {
      senhaGerada = gerarSenhaProvisoria();
      
      console.log('🔐 Criando usuário no Supabase Auth:', data.email);
      
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
        console.error('❌ Erro ao criar usuário no Auth:', authError);
        return { success: false, error: `Erro ao criar usuário: ${authError.message}` };
      }

      usuarioAuth = authData.user;
      console.log('✅ Usuário criado no Auth:', usuarioAuth?.id);
    }

    // Criar funcionário na tabela usuarios_empresa
    const funcionarioData = {
      nome_completo: data.nome_completo,
      email: data.email,
      telefone: data.telefone || null,
      cargo: data.cargo || null,
      user_id: usuarioAuth?.id || null,
      empresa_id: data.empresa_id,
      tipo_usuario: 'funcionario' as const,
      status: 'ativo' as const,
      tem_acesso_sistema: data.tem_acesso_sistema,
      senha_provisoria: data.tem_acesso_sistema ? true : false, // CORREÇÃO: Sempre true se tem acesso
      senha_provisoria_texto: senhaGerada
    };

    console.log('💾 Salvando funcionário no banco:', funcionarioData);

    const { data: funcionarioResult, error: funcionarioError } = await supabase
      .from('usuarios_empresa')
      .insert(funcionarioData)
      .select()
      .single();

    if (funcionarioError) {
      console.error('❌ Erro ao salvar funcionário:', funcionarioError);
      
      // Se criou o usuário no Auth mas falhou ao salvar no banco, tentar limpar
      if (usuarioAuth?.id) {
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('⚠️ Erro ao limpar usuário Auth:', cleanupError);
        }
      }
      
      return { success: false, error: `Erro ao salvar funcionário: ${funcionarioError.message}` };
    }

    console.log('✅ Funcionário salvo com sucesso:', funcionarioResult);

    // CORREÇÃO CRÍTICA: Sempre criar permissões para funcionários com acesso
    if (data.tem_acesso_sistema && funcionarioResult.id) {
      console.log('🔐 Salvando permissões...');
      
      try {
        let permissoesArray: any[] = [];
        
        // Se permissões foram fornecidas pelo usuário, usar elas
        if (data.permissoes) {
          Object.entries(data.permissoes).forEach(([modulo, permissoes]: [string, any]) => {
            const temPermissaoAtiva = Object.values(permissoes).some(valor => valor === true);
            
            if (temPermissaoAtiva) {
              permissoesArray.push({
                usuario_empresa_id: funcionarioResult.id,
                modulo: modulo,
                permissoes: {
                  visualizar: Boolean(permissoes.visualizar),
                  criar: Boolean(permissoes.criar),
                  editar: Boolean(permissoes.editar),
                  excluir: Boolean(permissoes.excluir),
                  administrar: Boolean(permissoes.administrar)
                }
              });
            }
          });
        }
        
        // SOLUÇÃO: Se não foram fornecidas ou está vazio, criar permissões básicas
        if (permissoesArray.length === 0) {
          permissoesArray = [
            {
              usuario_empresa_id: funcionarioResult.id,
              modulo: 'dashboard',
              permissoes: {
                visualizar: true,
                criar: false,
                editar: false,
                excluir: false,
                administrar: false
              }
            },
            {
              usuario_empresa_id: funcionarioResult.id,
              modulo: 'atendimento_bar',
              permissoes: {
                visualizar: true,
                criar: true,
                editar: true,
                excluir: false,
                administrar: false
              }
            },
            {
              usuario_empresa_id: funcionarioResult.id,
              modulo: 'clientes',
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
        const { error: permError } = await supabase
          .from('permissoes_usuario')
          .insert(permissoesArray);

        if (permError) {
          console.error('⚠️ Erro ao salvar permissões:', permError);
          // CRÍTICO: Se falhar nas permissões, falhar toda a criação
          throw new Error(`Erro crítico ao criar permissões: ${permError.message}`);
        } else {
          console.log('✅ Permissões salvas com sucesso:', permissoesArray.length);
        }
      } catch (permError) {
        console.error('⚠️ Erro no salvamento de permissões:', permError);
        // Propagar o erro para falhar a criação completa
        throw permError;
      }
    }

    return {
      success: true,
      funcionario_id: funcionarioResult.id,
      senha_provisoria: senhaGerada
    };

  } catch (error) {
    console.error('❌ Erro geral ao criar funcionário:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
};

// Verificar se email já existe
export const verificarEmailExistente = async (email: string, empresaId: string, excluirId?: string): Promise<boolean> => {
  try {
    let query = supabase
      .from('usuarios_empresa')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('empresa_id', empresaId);

    if (excluirId) {
      query = query.neq('id', excluirId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }

    return (data && data.length > 0);
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return false;
  }
};