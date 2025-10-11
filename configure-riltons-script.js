// Script para configurar riltons@gmail.com como primeiro usuário
// Execute este script no console do Supabase ou via Node.js

import { createClient } from '@supabase/supabase-js';

// ========================================================================
// CONFIGURAÇÃO - SUBSTITUA COM SUAS CREDENCIAIS
// ========================================================================

const SUPABASE_URL = 'https://egfkflqhqfqagwzxppdo.supabase.co';
const SUPABASE_SERVICE_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI'; // ⚠️ SUBSTITUA PELA SUA CHAVE

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ========================================================================
// FUNÇÃO PRINCIPAL
// ========================================================================

async function configurarRiltonsComoPrimeiroUsuario() {
    console.log('🚀 === CONFIGURANDO RILTONS@GMAIL.COM COMO PRIMEIRO USUÁRIO ===');
    
    try {
        // Passo 1: Verificar se usuário existe no auth
        console.log('\n🔍 Verificando usuário no auth.users...');
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
            console.error('❌ Erro ao listar usuários:', authError);
            return;
        }
        
        const riltonUser = users.find(u => u.email === 'riltons@gmail.com');
        
        if (!riltonUser) {
            console.log('❌ Usuário riltons@gmail.com NÃO encontrado no auth.users');
            console.log('⚠️  Crie o usuário no Supabase Auth Dashboard primeiro!');
            return;
        }
        
        console.log(`✅ Usuário encontrado - ID: ${riltonUser.id}`);
        
        // Passo 2: Verificar/criar empresa
        console.log('\n🏢 Verificando empresa...');
        let { data: empresas, error: empresaError } = await supabase
            .from('empresas')
            .select('*')
            .limit(1);
        
        if (empresaError) {
            console.error('❌ Erro ao consultar empresas:', empresaError);
            return;
        }
        
        let empresaId;
        if (!empresas || empresas.length === 0) {
            console.log('🏗️  Criando empresa AABB Garanhuns...');
            const { data: novaEmpresa, error: criarEmpresaError } = await supabase
                .from('empresas')
                .insert({
                    nome: 'AABB Garanhuns',
                    cnpj: '12.345.678/0001-90',
                    email_admin: 'riltons@gmail.com',
                    telefone: '(87) 99999-9999',
                    plano: 'premium',
                    status: 'ativo',
                    configuracoes: { tema: 'claro', primeira_configuracao: true }
                })
                .select()
                .single();
            
            if (criarEmpresaError) {
                console.error('❌ Erro ao criar empresa:', criarEmpresaError);
                return;
            }
            
            empresaId = novaEmpresa.id;
            console.log(`✅ Empresa criada - ID: ${empresaId}`);
        } else {
            empresaId = empresas[0].id;
            console.log(`✅ Empresa existente - ID: ${empresaId}`);
        }
        
        // Passo 3: Limpar dados existentes para reconfiguração
        console.log('\n🧹 Limpando dados existentes...');
        
        // Buscar registro existente
        const { data: usuarioExistente } = await supabase
            .from('usuarios_empresa')
            .select('id')
            .eq('user_id', riltonUser.id)
            .eq('empresa_id', empresaId)
            .single();
        
        // Limpar permissões existentes
        if (usuarioExistente) {
            const { error: deletePermsError } = await supabase
                .from('permissoes_usuario')
                .delete()
                .eq('usuario_empresa_id', usuarioExistente.id);
            
            if (deletePermsError) {
                console.warn('⚠️  Aviso ao limpar permissões:', deletePermsError.message);
            }
        }
        
        // Limpar configurações da empresa
        const { error: deleteConfigsError } = await supabase
            .from('configuracoes_empresa')
            .delete()
            .eq('empresa_id', empresaId);
        
        if (deleteConfigsError) {
            console.warn('⚠️  Aviso ao limpar configurações:', deleteConfigsError.message);
        }
        
        // Limpar logs relacionados
        const { error: deleteLogsError } = await supabase
            .from('logs_auditoria')
            .delete()
            .eq('empresa_id', empresaId)
            .eq('usuario_id', riltonUser.id);
        
        if (deleteLogsError) {
            console.warn('⚠️  Aviso ao limpar logs:', deleteLogsError.message);
        }
        
        // Remover registro de usuarios_empresa para recriar
        if (usuarioExistente) {
            const { error: deleteUserError } = await supabase
                .from('usuarios_empresa')
                .delete()
                .eq('id', usuarioExistente.id);
            
            if (deleteUserError) {
                console.warn('⚠️  Aviso ao remover usuário existente:', deleteUserError.message);
            }
        }
        
        console.log('✅ Dados existentes limpos');
        
        // Passo 4: Criar como primeiro usuário (ATIVA TODOS OS TRIGGERS)
        console.log('\n🎯 Criando registro como PRIMEIRO USUÁRIO...');
        console.log('🔥 ISSO IRÁ ATIVAR TODOS OS TRIGGERS AUTOMÁTICOS!');
        
        const { data: novoUsuario, error: criarUsuarioError } = await supabase
            .from('usuarios_empresa')
            .insert({
                user_id: riltonUser.id,
                empresa_id: empresaId,
                nome_completo: 'Rilton Silva',
                email: 'riltons@gmail.com',
                telefone: '(87) 99999-9999',
                cargo: 'Diretor Geral',
                tipo_usuario: 'administrador',
                papel: 'SUPER_ADMIN',
                is_primeiro_usuario: true, // 🔥 ESTA LINHA ATIVA TODOS OS TRIGGERS
                status: 'ativo',
                senha_provisoria: false
            })
            .select()
            .single();
        
        if (criarUsuarioError) {
            console.error('❌ Erro ao criar primeiro usuário:', criarUsuarioError);
            return;
        }
        
        console.log(`🎉 PRIMEIRO USUÁRIO CRIADO - ID: ${novoUsuario.id}`);
        console.log('🚀 Triggers automáticos foram ativados!');
        
        // Passo 5: Aguardar um pouco para os triggers processarem
        console.log('\n⏳ Aguardando triggers processarem (2 segundos)...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Passo 6: Verificar resultados
        console.log('\n📊 === VERIFICANDO RESULTADOS DOS TRIGGERS ===');
        
        // Verificar configurações criadas
        const { data: configs, error: configsError } = await supabase
            .from('configuracoes_empresa')
            .select('*')
            .eq('empresa_id', empresaId);
        
        if (configsError) {
            console.error('❌ Erro ao verificar configurações:', configsError);
        } else {
            console.log(`⚙️  Configurações criadas: ${configs.length} registros`);
            configs.forEach(config => {
                console.log(`   - ${config.categoria}: ${JSON.stringify(config.configuracoes)}`);
            });
        }
        
        // Verificar permissões criadas
        const { data: perms, error: permsError } = await supabase
            .from('permissoes_usuario')
            .select('*')
            .eq('usuario_empresa_id', novoUsuario.id);
        
        if (permsError) {
            console.error('❌ Erro ao verificar permissões:', permsError);
        } else {
            console.log(`🔐 Permissões criadas: ${perms.length} registros`);
            perms.forEach(perm => {
                console.log(`   - ${perm.modulo}: ${JSON.stringify(perm.permissoes)}`);
            });
        }
        
        // Verificar logs criados
        const { data: logs, error: logsError } = await supabase
            .from('logs_auditoria')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('usuario_id', riltonUser.id)
            .eq('acao', 'PRIMEIRO_USUARIO_CRIADO');
        
        if (logsError) {
            console.error('❌ Erro ao verificar logs:', logsError);
        } else {
            console.log(`📝 Logs de auditoria criados: ${logs.length} registros`);
            logs.forEach(log => {
                console.log(`   - ${log.acao}: ${JSON.stringify(log.detalhes)}`);
            });
        }
        
        // Resumo final
        const configsOk = configs && configs.length >= 5;
        const permsOk = perms && perms.length >= 10;
        const logsOk = logs && logs.length > 0;
        
        console.log('\n' + '='.repeat(60));
        if (configsOk && permsOk && logsOk) {
            console.log('🎉 === CONFIGURAÇÃO CONCLUÍDA COM SUCESSO! ===');
            console.log('✅ riltons@gmail.com configurado como primeiro usuário');
            console.log(`✅ ${configs.length} configurações da empresa criadas automaticamente`);
            console.log(`✅ ${perms.length} permissões completas atribuídas automaticamente`);
            console.log(`✅ ${logs.length} log(s) de auditoria registrado(s) automaticamente`);
            console.log('🚀 Todos os triggers automáticos funcionaram corretamente!');
        } else {
            console.log('⚠️  CONFIGURAÇÃO PARCIALMENTE CONCLUÍDA');
            console.log(`- Configurações: ${configsOk ? '✅' : '❌'} (${configs?.length || 0}/5)`);
            console.log(`- Permissões: ${permsOk ? '✅' : '❌'} (${perms?.length || 0}/10+)`);
            console.log(`- Logs: ${logsOk ? '✅' : '❌'} (${logs?.length || 0}/1)`);
            console.log('Verifique se os triggers estão funcionando corretamente.');
        }
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Erro geral na configuração:', error);
    }
}

// ========================================================================
// EXECUTAR
// ========================================================================

// Verificar se a chave foi configurada
if (SUPABASE_SERVICE_KEY === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    console.log('❌ ERRO: Substitua SUA_SERVICE_ROLE_KEY_AQUI pela sua chave real!');
    console.log('⚠️  Encontre sua Service Role Key no painel do Supabase > Settings > API');
} else {
    // Executar a configuração
    configurarRiltonsComoPrimeiroUsuario()
        .then(() => {
            console.log('\n✅ Script concluído!');
        })
        .catch(error => {
            console.error('\n❌ Erro na execução do script:', error);
        });
}