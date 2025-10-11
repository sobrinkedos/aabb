/**
 * Exemplos de Uso do Sistema de Presets de Permissões
 * 
 * Demonstra como usar o sistema de permissões baseado em funções,
 * incluindo validação, customização e verificação de acesso.
 */

import {
  BarRole,
  SystemModule,
  ModulePermissions,
  PermissionPreset,
} from '../types/permissions';

import { permissionPresetManager } from './permission-presets';
import {
  hasPermission,
  hasMultiplePermissions,
  canAccessModule,
  canManageUser,
  validatePermissionConfiguration,
  sanitizePermissions,
  generatePermissionSummary,
  getDefaultPermissionsForRole,
  isDefaultPermissionSet,
  createPermissionsFromTemplate,
} from '../utils/permission-utils';

// ============================================================================
// EXEMPLOS DE USO BÁSICO
// ============================================================================

/**
 * Exemplo 1: Obter permissões padrão para uma função
 */
export function exemploPermissoesPadrao() {
  console.log('=== Exemplo 1: Permissões Padrão ===');
  
  // Obter permissões para um garçom
  const permissoesGarcom = permissionPresetManager.getDefaultPermissions('garcom');
  console.log('Permissões do Garçom:', permissoesGarcom);
  
  // Obter configuração completa do gerente
  const configGerente = permissionPresetManager.getRoleConfig('gerente');
  console.log('Configuração do Gerente:', {
    nome: configGerente.displayName,
    descricao: configGerente.description,
    hierarquia: configGerente.hierarchy,
    podeGerenciar: configGerente.canManageRoles
  });
  
  // Listar todas as funções disponíveis
  const todasConfigs = permissionPresetManager.getAllRoleConfigs();
  console.log('Funções disponíveis:', Object.keys(todasConfigs));
}

/**
 * Exemplo 2: Verificar permissões específicas
 */
export function exemploVerificacaoPermissoes() {
  console.log('=== Exemplo 2: Verificação de Permissões ===');
  
  // Verificar se um garçom pode editar o atendimento do bar
  const garcomPodeEditar = hasPermission('garcom', 'atendimento_bar', 'editar');
  console.log('Garçom pode editar atendimento do bar:', garcomPodeEditar);
  
  // Verificar se um atendente pode acessar o módulo de funcionários
  const atendentePodeAcessar = canAccessModule('atendente', 'funcionarios');
  console.log('Atendente pode acessar módulo de funcionários:', atendentePodeAcessar);
  
  // Verificar múltiplas permissões de uma vez
  const verificacaoMultipla = hasMultiplePermissions('barman', [
    { module: 'monitor_bar', action: 'administrar', required: true },
    { module: 'estoque', action: 'editar', required: true },
    { module: 'cardapio', action: 'criar', required: false }
  ]);
  
  console.log('Verificação múltipla para barman:', verificacaoMultipla);
}

/**
 * Exemplo 3: Gerenciamento de hierarquia
 */
export function exemploHierarquia() {
  console.log('=== Exemplo 3: Hierarquia de Funções ===');
  
  // Verificar se um gerente pode gerenciar um garçom
  const gerentePodeGerenciarGarcom = canManageUser('gerente', 'garcom');
  console.log('Gerente pode gerenciar garçom:', gerentePodeGerenciarGarcom);
  
  // Verificar se um barman pode gerenciar um atendente
  const barmanPodeGerenciarAtendente = canManageUser('barman', 'atendente');
  console.log('Barman pode gerenciar atendente:', barmanPodeGerenciarAtendente);
  
  // Obter hierarquia de uma função
  const hierarquiaGerente = permissionPresetManager.getRoleHierarchy('gerente');
  const hierarquiaGarcom = permissionPresetManager.getRoleHierarchy('garcom');
  console.log('Hierarquia - Gerente:', hierarquiaGerente, 'Garçom:', hierarquiaGarcom);
  
  // Listar funções que um gerente pode gerenciar
  const funcoesGerenciaveis = permissionPresetManager.getManageableRoles('gerente');
  console.log('Funções que o gerente pode gerenciar:', funcoesGerenciaveis);
}

/**
 * Exemplo 4: Validação de permissões
 */
export function exemploValidacao() {
  console.log('=== Exemplo 4: Validação de Permissões ===');
  
  // Validar configuração de permissões para um cozinheiro
  const permissoesCozinheiro = getDefaultPermissionsForRole('cozinheiro');
  const validacao = validatePermissionConfiguration(permissoesCozinheiro, 'cozinheiro');
  
  console.log('Validação do cozinheiro:', {
    valida: validacao.isValid,
    erros: validacao.errors,
    avisos: validacao.warnings,
    permissoesFaltando: validacao.missingPermissions.length
  });
  
  // Exemplo de permissões inconsistentes
  const permissoesInconsistentes: ModulePermissions = {
    dashboard: {
      visualizar: false, // Inconsistente: pode criar mas não visualizar
      criar: true,
      editar: false,
      excluir: false,
      administrar: false
    }
  };
  
  const validacaoInconsistente = validatePermissionConfiguration(permissoesInconsistentes, 'garcom');
  console.log('Validação inconsistente:', validacaoInconsistente.errors);
  
  // Sanitizar permissões inconsistentes
  const permissoesSanitizadas = sanitizePermissions(permissoesInconsistentes);
  console.log('Permissões sanitizadas:', permissoesSanitizadas.dashboard);
}

/**
 * Exemplo 5: Criação de presets customizados
 */
export function exemploPresetsCustomizados() {
  console.log('=== Exemplo 5: Presets Customizados ===');
  
  // Criar um preset customizado baseado em garçom com permissões extras
  const presetCustomizado = permissionPresetManager.createCustomPreset(
    'Garçom Senior',
    'Garçom com permissões extras para treinamento de novos funcionários',
    'garcom',
    {
      funcionarios: {
        visualizar: true,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      },
      relatorios: {
        visualizar: true,
        criar: false,
        editar: false,
        excluir: false,
        administrar: false
      }
    }
  );
  
  console.log('Preset customizado criado:', {
    id: presetCustomizado.id,
    nome: presetCustomizado.name,
    descricao: presetCustomizado.description
  });
  
  // Listar todos os presets disponíveis
  const todosPresets = permissionPresetManager.getAllPresets();
  console.log('Total de presets disponíveis:', todosPresets.length);
  console.log('Presets:', todosPresets.map(p => ({ id: p.id, nome: p.name, padrao: p.isDefault })));
  
  // Atualizar o preset customizado
  const presetAtualizado = permissionPresetManager.updateCustomPreset(
    presetCustomizado.id,
    {
      description: 'Garçom experiente com acesso a relatórios básicos'
    }
  );
  
  console.log('Preset atualizado:', presetAtualizado?.description);
}

/**
 * Exemplo 6: Análise e resumo de permissões
 */
export function exemploAnalisePermissoes() {
  console.log('=== Exemplo 6: Análise de Permissões ===');
  
  // Gerar resumo de permissões para diferentes funções
  const funcoes: BarRole[] = ['atendente', 'garcom', 'cozinheiro', 'barman', 'gerente'];
  
  for (const funcao of funcoes) {
    const permissoes = getDefaultPermissionsForRole(funcao);
    const resumo = generatePermissionSummary(permissoes);
    
    console.log(`Resumo - ${funcao}:`, {
      totalModulos: resumo.totalModules,
      modulosAcessiveis: resumo.accessibleModules,
      modulosEditaveis: resumo.editableModules,
      modulosAdmin: resumo.adminModules,
      nivelPermissao: resumo.permissionLevel
    });
  }
  
  // Verificar se permissões são padrão
  const permissoesGarcom = getDefaultPermissionsForRole('garcom');
  const ehPadrao = isDefaultPermissionSet(permissoesGarcom, 'garcom');
  console.log('Permissões do garçom são padrão:', ehPadrao);
}

/**
 * Exemplo 7: Criação de permissões por template
 */
export function exemploTemplatesPermissoes() {
  console.log('=== Exemplo 7: Templates de Permissões ===');
  
  // Criar permissões somente leitura para módulos específicos
  const permissoesLeitura = createPermissionsFromTemplate(
    'read_only',
    ['dashboard', 'relatorios', 'clientes']
  );
  console.log('Permissões somente leitura:', permissoesLeitura);
  
  // Criar permissões operacionais
  const permissoesOperacionais = createPermissionsFromTemplate(
    'operational',
    ['atendimento_bar', 'gestao_caixa']
  );
  console.log('Permissões operacionais:', permissoesOperacionais);
  
  // Criar permissões completas
  const permissoesCompletas = createPermissionsFromTemplate(
    'full',
    ['funcionarios', 'configuracoes']
  );
  console.log('Permissões completas:', permissoesCompletas);
}

/**
 * Exemplo 8: Contexto de usuário com permissões
 */
export function exemploContextoUsuario() {
  console.log('=== Exemplo 8: Contexto de Usuário ===');
  
  // Criar contexto para um usuário específico
  const contextoGarcom = permissionPresetManager.createUserPermissionContext(
    'user-123',
    'garcom'
  );
  
  console.log('Contexto do garçom:', {
    userId: contextoGarcom.userId,
    funcao: contextoGarcom.role,
    podeAcessarBar: contextoGarcom.canAccess('atendimento_bar', 'visualizar'),
    podeEditarBar: contextoGarcom.canAccess('atendimento_bar', 'editar'),
    podeGerenciarAtendente: contextoGarcom.canManage('atendente')
  });
  
  // Criar contexto com permissões customizadas
  const permissoesCustomizadas: ModulePermissions = {
    ...getDefaultPermissionsForRole('garcom'),
    relatorios: {
      visualizar: true,
      criar: false,
      editar: false,
      excluir: false,
      administrar: false
    }
  };
  
  const contextoCustomizado = permissionPresetManager.createUserPermissionContext(
    'user-456',
    'garcom',
    permissoesCustomizadas
  );
  
  console.log('Contexto customizado:', {
    podeVerRelatorios: contextoCustomizado.canAccess('relatorios', 'visualizar'),
    permissoesEfetivas: Object.keys(contextoCustomizado.effectivePermissions).length
  });
}

/**
 * Função principal para executar todos os exemplos
 */
export function executarTodosExemplos() {
  console.log('🚀 Executando exemplos do sistema de permissões...\n');
  
  try {
    exemploPermissoesPadrao();
    console.log('\n');
    
    exemploVerificacaoPermissoes();
    console.log('\n');
    
    exemploHierarquia();
    console.log('\n');
    
    exemploValidacao();
    console.log('\n');
    
    exemploPresetsCustomizados();
    console.log('\n');
    
    exemploAnalisePermissoes();
    console.log('\n');
    
    exemploTemplatesPermissoes();
    console.log('\n');
    
    exemploContextoUsuario();
    console.log('\n');
    
    console.log('✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Executar exemplos se este arquivo for executado diretamente
if (require.main === module) {
  executarTodosExemplos();
}