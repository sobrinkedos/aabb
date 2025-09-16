import { supabase } from '../lib/supabase';
import { ModuloSistema } from '../types/multitenant';

/**
 * Script de Validação de Segurança
 * 
 * Este script executa uma série de verificações para garantir
 * que o sistema está configurado corretamente em termos de segurança.
 */

interface ResultadoValidacao {
  categoria: string;
  teste: string;
  status: 'PASSOU' | 'FALHOU' | 'AVISO';
  detalhes: string;
  recomendacao?: string;
}

class ValidadorSeguranca {
  private resultados: ResultadoValidacao[] = [];

  private adicionarResultado(
    categoria: string,
    teste: string,
    status: 'PASSOU' | 'FALHOU' | 'AVISO',
    detalhes: string,
    recomendacao?: string
  ) {
    this.resultados.push({
      categoria,
      teste,
      status,
      detalhes,
      recomendacao
    });
  }

  /**
   * Verificar se RLS está habilitado em todas as tabelas críticas
   */
  async verificarRLS(): Promise<void> {
    console.log('🔒 Verificando Row Level Security (RLS)...');
    
    const tabelasCriticas = [
      'empresas',
      'usuarios_empresa',
      'employees',
      'customers',
      'comandas',
      'balcao_orders',
      'cash_sessions',
      'cash_transactions',
      'logs_auditoria',
      'configuracoes_empresa',
      'permissoes_usuario'
    ];

    for (const tabela of tabelasCriticas) {
      try {
        const { data, error } = await supabase
          .rpc('check_rls_enabled', { table_name: tabela });

        if (error) {
          this.adicionarResultado(
            'RLS',
            `Verificar RLS em ${tabela}`,
            'FALHOU',
            `Erro ao verificar RLS: ${error.message}`,
            'Verificar se a função check_rls_enabled existe no banco'
          );
          continue;
        }

        if (data === true) {
          this.adicionarResultado(
            'RLS',
            `RLS habilitado em ${tabela}`,
            'PASSOU',
            'RLS está corretamente habilitado'
          );
        } else {
          this.adicionarResultado(
            'RLS',
            `RLS em ${tabela}`,
            'FALHOU',
            'RLS não está habilitado nesta tabela crítica',
            `Executar: ALTER TABLE ${tabela} ENABLE ROW LEVEL SECURITY;`
          );
        }
      } catch (error) {
        this.adicionarResultado(
          'RLS',
          `Verificar ${tabela}`,
          'FALHOU',
          `Erro inesperado: ${error}`,
          'Verificar conectividade com o banco de dados'
        );
      }
    }
  }

  /**
   * Verificar se existem políticas RLS adequadas
   */
  async verificarPoliticasRLS(): Promise<void> {
    console.log('📋 Verificando políticas RLS...');
    
    try {
      const { data: policies, error } = await supabase
        .rpc('get_table_policies', { schema_name: 'public' });

      if (error) {
        this.adicionarResultado(
          'Políticas RLS',
          'Listar políticas',
          'FALHOU',
          `Erro ao listar políticas: ${error.message}`,
          'Verificar se a função get_table_policies existe'
        );
        return;
      }

      const tabelasComIsolamento = [
        'employees',
        'customers',
        'comandas',
        'balcao_orders',
        'cash_sessions',
        'cash_transactions',
        'logs_auditoria'
      ];

      for (const tabela of tabelasComIsolamento) {
        const policiesForTable = policies?.filter((p: any) => p.tablename === tabela) || [];
        
        if (policiesForTable.length > 0) {
          this.adicionarResultado(
            'Políticas RLS',
            `Políticas para ${tabela}`,
            'PASSOU',
            `${policiesForTable.length} política(s) encontrada(s)`
          );
        } else {
          this.adicionarResultado(
            'Políticas RLS',
            `Políticas para ${tabela}`,
            'FALHOU',
            'Nenhuma política RLS encontrada',
            'Criar políticas de isolamento por empresa_id'
          );
        }
      }
    } catch (error) {
      this.adicionarResultado(
        'Políticas RLS',
        'Verificação geral',
        'FALHOU',
        `Erro inesperado: ${error}`,
        'Verificar conectividade e permissões do banco'
      );
    }
  }

  /**
   * Verificar integridade das tabelas de segurança
   */
  async verificarTabelasSeguranca(): Promise<void> {
    console.log('🗃️ Verificando tabelas de segurança...');
    
    const verificacoes = [
      {
        tabela: 'empresas',
        campos: ['id', 'nome', 'email', 'status', 'created_at'],
        descricao: 'Tabela principal de empresas'
      },
      {
        tabela: 'usuarios_empresa',
        campos: ['id', 'user_id', 'empresa_id', 'tipo_usuario', 'status', 'senha_provisoria'],
        descricao: 'Tabela de usuários por empresa'
      },
      {
        tabela: 'permissoes_usuario',
        campos: ['id', 'usuario_empresa_id', 'modulo', 'permissoes'],
        descricao: 'Tabela de permissões de usuários'
      },
      {
        tabela: 'configuracoes_empresa',
        campos: ['id', 'empresa_id', 'categoria', 'configuracoes'],
        descricao: 'Tabela de configurações por empresa'
      },
      {
        tabela: 'logs_auditoria',
        campos: ['id', 'empresa_id', 'usuario_id', 'acao', 'recurso', 'created_at'],
        descricao: 'Tabela de logs de auditoria'
      }
    ];

    for (const { tabela, campos, descricao } of verificacoes) {
      try {
        // Verificar se a tabela existe e tem os campos necessários
        const { data, error } = await supabase
          .from(tabela)
          .select(campos.join(','))
          .limit(1);

        if (error) {
          this.adicionarResultado(
            'Estrutura de Tabelas',
            `Verificar ${tabela}`,
            'FALHOU',
            `Erro ao acessar tabela: ${error.message}`,
            'Verificar se a tabela existe e tem os campos necessários'
          );
        } else {
          this.adicionarResultado(
            'Estrutura de Tabelas',
            `Estrutura de ${tabela}`,
            'PASSOU',
            `${descricao} - Estrutura OK`
          );
        }
      } catch (error) {
        this.adicionarResultado(
          'Estrutura de Tabelas',
          `Verificar ${tabela}`,
          'FALHOU',
          `Erro inesperado: ${error}`,
          'Verificar se as migrações foram aplicadas corretamente'
        );
      }
    }
  }

  /**
   * Verificar configurações de segurança padrão
   */
  async verificarConfiguracoesPadrao(): Promise<void> {
    console.log('⚙️ Verificando configurações de segurança...');
    
    try {
      // Verificar se existem empresas no sistema
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome')
        .limit(5);

      if (empresasError) {
        this.adicionarResultado(
          'Configurações',
          'Verificar empresas',
          'FALHOU',
          `Erro ao acessar empresas: ${empresasError.message}`,
          'Verificar se a tabela empresas existe e está acessível'
        );
        return;
      }

      if (!empresas || empresas.length === 0) {
        this.adicionarResultado(
          'Configurações',
          'Empresas cadastradas',
          'AVISO',
          'Nenhuma empresa encontrada no sistema',
          'Cadastrar pelo menos uma empresa para testar o sistema'
        );
      } else {
        this.adicionarResultado(
          'Configurações',
          'Empresas cadastradas',
          'PASSOU',
          `${empresas.length} empresa(s) encontrada(s)`
        );

        // Verificar configurações de segurança para cada empresa
        for (const empresa of empresas) {
          const { data: configs } = await supabase
            .from('configuracoes_empresa')
            .select('categoria, configuracoes')
            .eq('empresa_id', empresa.id)
            .eq('categoria', 'seguranca');

          if (!configs || configs.length === 0) {
            this.adicionarResultado(
              'Configurações',
              `Configurações de segurança - ${empresa.nome}`,
              'AVISO',
              'Nenhuma configuração de segurança encontrada',
              'Configurar políticas de senha e segurança para a empresa'
            );
          } else {
            const config = configs[0].configuracoes;
            
            // Verificar configurações críticas
            if (config.senha_minima_caracteres < 8) {
              this.adicionarResultado(
                'Configurações',
                `Política de senha - ${empresa.nome}`,
                'AVISO',
                `Senha mínima muito baixa: ${config.senha_minima_caracteres}`,
                'Configurar senha mínima de pelo menos 8 caracteres'
              );
            } else {
              this.adicionarResultado(
                'Configurações',
                `Política de senha - ${empresa.nome}`,
                'PASSOU',
                'Política de senha adequada'
              );
            }
          }
        }
      }
    } catch (error) {
      this.adicionarResultado(
        'Configurações',
        'Verificação geral',
        'FALHOU',
        `Erro inesperado: ${error}`,
        'Verificar conectividade e estrutura do banco'
      );
    }
  }

  /**
   * Verificar isolamento de dados
   */
  async verificarIsolamentoDados(): Promise<void> {
    console.log('🔐 Verificando isolamento de dados...');
    
    try {
      // Verificar se existem dados de teste que possam comprometer o isolamento
      const tabelas = ['employees', 'customers', 'comandas'];
      
      for (const tabela of tabelas) {
        const { data, error } = await supabase
          .from(tabela)
          .select('empresa_id')
          .limit(100);

        if (error) {
          this.adicionarResultado(
            'Isolamento',
            `Verificar ${tabela}`,
            'FALHOU',
            `Erro ao verificar isolamento: ${error.message}`,
            'Verificar se a tabela tem o campo empresa_id'
          );
          continue;
        }

        if (!data || data.length === 0) {
          this.adicionarResultado(
            'Isolamento',
            `Dados em ${tabela}`,
            'PASSOU',
            'Tabela vazia - isolamento não aplicável'
          );
          continue;
        }

        // Verificar se todos os registros têm empresa_id
        const registrosSemEmpresa = data.filter(item => !item.empresa_id);
        
        if (registrosSemEmpresa.length > 0) {
          this.adicionarResultado(
            'Isolamento',
            `Integridade de ${tabela}`,
            'FALHOU',
            `${registrosSemEmpresa.length} registro(s) sem empresa_id`,
            'Corrigir registros órfãos ou aplicar migração de dados'
          );
        } else {
          this.adicionarResultado(
            'Isolamento',
            `Integridade de ${tabela}`,
            'PASSOU',
            'Todos os registros têm empresa_id válido'
          );
        }

        // Verificar diversidade de empresas
        const empresasUnicas = new Set(data.map(item => item.empresa_id)).size;
        
        if (empresasUnicas === 1) {
          this.adicionarResultado(
            'Isolamento',
            `Diversidade em ${tabela}`,
            'AVISO',
            'Todos os registros pertencem à mesma empresa',
            'Adicionar dados de teste para múltiplas empresas para validar isolamento'
          );
        } else {
          this.adicionarResultado(
            'Isolamento',
            `Diversidade em ${tabela}`,
            'PASSOU',
            `Dados de ${empresasUnicas} empresa(s) diferentes`
          );
        }
      }
    } catch (error) {
      this.adicionarResultado(
        'Isolamento',
        'Verificação geral',
        'FALHOU',
        `Erro inesperado: ${error}`,
        'Verificar estrutura das tabelas e conectividade'
      );
    }
  }

  /**
   * Verificar logs de auditoria
   */
  async verificarLogsAuditoria(): Promise<void> {
    console.log('📊 Verificando sistema de logs...');
    
    try {
      // Verificar se a função de log existe
      const { error: funcError } = await supabase
        .rpc('registrar_log_auditoria', {
          p_empresa_id: '00000000-0000-0000-0000-000000000000',
          p_usuario_id: '00000000-0000-0000-0000-000000000000',
          p_acao: 'SECURITY_TEST',
          p_recurso: 'validacao_seguranca',
          p_detalhes: { teste: true }
        });

      if (funcError) {
        this.adicionarResultado(
          'Auditoria',
          'Função de log',
          'FALHOU',
          `Erro ao testar função de log: ${funcError.message}`,
          'Verificar se a função registrar_log_auditoria existe no banco'
        );
      } else {
        this.adicionarResultado(
          'Auditoria',
          'Função de log',
          'PASSOU',
          'Função de auditoria funcionando corretamente'
        );
      }

      // Verificar logs existentes
      const { data: logs, error: logsError } = await supabase
        .from('logs_auditoria')
        .select('id, acao, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) {
        this.adicionarResultado(
          'Auditoria',
          'Acessar logs',
          'FALHOU',
          `Erro ao acessar logs: ${logsError.message}`,
          'Verificar se a tabela logs_auditoria existe e está acessível'
        );
      } else if (!logs || logs.length === 0) {
        this.adicionarResultado(
          'Auditoria',
          'Logs existentes',
          'AVISO',
          'Nenhum log de auditoria encontrado',
          'Logs serão criados conforme o uso do sistema'
        );
      } else {
        this.adicionarResultado(
          'Auditoria',
          'Logs existentes',
          'PASSOU',
          `${logs.length} log(s) recente(s) encontrado(s)`
        );
      }
    } catch (error) {
      this.adicionarResultado(
        'Auditoria',
        'Verificação geral',
        'FALHOU',
        `Erro inesperado: ${error}`,
        'Verificar configuração do sistema de auditoria'
      );
    }
  }

  /**
   * Executar todas as validações
   */
  async executarValidacoes(): Promise<ResultadoValidacao[]> {
    console.log('🚀 Iniciando validação de segurança do sistema...\n');
    
    await this.verificarRLS();
    await this.verificarPoliticasRLS();
    await this.verificarTabelasSeguranca();
    await this.verificarConfiguracoesPadrao();
    await this.verificarIsolamentoDados();
    await this.verificarLogsAuditoria();
    
    return this.resultados;
  }

  /**
   * Gerar relatório de validação
   */
  gerarRelatorio(): string {
    const passou = this.resultados.filter(r => r.status === 'PASSOU').length;
    const falhou = this.resultados.filter(r => r.status === 'FALHOU').length;
    const avisos = this.resultados.filter(r => r.status === 'AVISO').length;
    const total = this.resultados.length;

    let relatorio = '\n' + '='.repeat(80) + '\n';
    relatorio += '                    RELATÓRIO DE VALIDAÇÃO DE SEGURANÇA\n';
    relatorio += '='.repeat(80) + '\n\n';
    
    relatorio += `📊 RESUMO GERAL:\n`;
    relatorio += `   Total de testes: ${total}\n`;
    relatorio += `   ✅ Passou: ${passou}\n`;
    relatorio += `   ❌ Falhou: ${falhou}\n`;
    relatorio += `   ⚠️  Avisos: ${avisos}\n\n`;

    // Agrupar por categoria
    const categorias = [...new Set(this.resultados.map(r => r.categoria))];
    
    for (const categoria of categorias) {
      const resultadosCategoria = this.resultados.filter(r => r.categoria === categoria);
      
      relatorio += `📁 ${categoria.toUpperCase()}:\n`;
      relatorio += '-'.repeat(40) + '\n';
      
      for (const resultado of resultadosCategoria) {
        const emoji = resultado.status === 'PASSOU' ? '✅' : 
                     resultado.status === 'FALHOU' ? '❌' : '⚠️';
        
        relatorio += `${emoji} ${resultado.teste}\n`;
        relatorio += `   ${resultado.detalhes}\n`;
        
        if (resultado.recomendacao) {
          relatorio += `   💡 Recomendação: ${resultado.recomendacao}\n`;
        }
        
        relatorio += '\n';
      }
    }

    // Resumo de segurança
    relatorio += '🔒 AVALIAÇÃO DE SEGURANÇA:\n';
    relatorio += '-'.repeat(40) + '\n';
    
    if (falhou === 0) {
      relatorio += '✅ SISTEMA SEGURO - Todos os testes críticos passaram\n';
    } else if (falhou <= 2) {
      relatorio += '⚠️  ATENÇÃO NECESSÁRIA - Alguns problemas de segurança encontrados\n';
    } else {
      relatorio += '❌ AÇÃO URGENTE - Múltiplos problemas de segurança detectados\n';
    }
    
    relatorio += '\n' + '='.repeat(80) + '\n';
    
    return relatorio;
  }
}

/**
 * Função principal para executar a validação
 */
export async function executarValidacaoSeguranca(): Promise<void> {
  const validador = new ValidadorSeguranca();
  
  try {
    const resultados = await validador.executarValidacoes();
    const relatorio = validador.gerarRelatorio();
    
    console.log(relatorio);
    
    // Salvar relatório em arquivo se necessário
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nomeArquivo = `validacao-seguranca-${timestamp}.txt`;
    
    // Em ambiente Node.js, você pode salvar o arquivo:
    // import { writeFileSync } from 'fs';
    // writeFileSync(nomeArquivo, relatorio);
    
    console.log(`\n📄 Relatório gerado: ${nomeArquivo}`);
    
    // Retornar código de saída baseado nos resultados
    const falhas = resultados.filter(r => r.status === 'FALHOU').length;
    
    if (falhas > 0) {
      console.log(`\n❌ Validação concluída com ${falhas} falha(s)`);
      process.exit(1);
    } else {
      console.log('\n✅ Validação concluída com sucesso!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a validação:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarValidacaoSeguranca();
}