/**
 * 🎯 TESTE RÁPIDO: Criar funcionário Joao Grilo
 * Este script testa a criação de funcionário após as correções RLS
 */

import { supabase } from './src/lib/supabase.ts';

async function criarJoaoGriloTeste() {
    console.log('🧪 Iniciando teste de criação do funcionário Joao Grilo...');
    
    try {
        // 1. Verificar se usuário está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            console.error('❌ Usuário não está autenticado');
            return;
        }
        
        console.log('✅ Usuário autenticado:', session.user.email);
        
        // 2. Buscar empresa_id (usar primeira empresa disponível)
        const { data: empresas, error: empresaError } = await supabase
            .from('empresas')
            .select('id, nome')
            .eq('status', 'ativo')
            .limit(1);
            
        if (empresaError || !empresas || empresas.length === 0) {
            console.error('❌ Erro ao buscar empresa:', empresaError);
            return;
        }
        
        const empresaId = empresas[0].id;
        console.log('✅ Empresa encontrada:', empresas[0].nome, empresaId);
        
        // 3. Gerar dados do funcionário
        const funcionarioData = {
            email: 'joao.grilo@teste.com',
            senha: '123456',
            nome_completo: 'Joao Grilo',
            cargo: 'Garçom',
            telefone: '(81) 99999-9999'
        };
        
        console.log('📧 Dados do funcionário:', funcionarioData);
        
        // 4. Criar usuário no Auth
        console.log('🔐 Criando usuário no Supabase Auth...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: funcionarioData.email,
            password: funcionarioData.senha,
            options: {
                data: {
                    nome_completo: funcionarioData.nome_completo,
                    role: 'employee'
                }
            }
        });
        
        if (authError) {
            console.error('❌ Erro ao criar usuário no Auth:', authError.message);
            return;
        }
        
        if (!authData.user) {
            console.error('❌ Usuário não foi criado no Auth');
            return;
        }
        
        console.log('✅ Usuário criado no Auth:', authData.user.id);
        
        // 5. Buscar department e position padrão
        const { data: departments } = await supabase
            .from('departments')
            .select('id')
            .eq('is_active', true)
            .limit(1);
            
        const { data: positions } = await supabase
            .from('positions')
            .select('id')
            .eq('is_active', true)
            .limit(1);
            
        const departmentId = departments?.[0]?.id;
        const positionId = positions?.[0]?.id;
        
        console.log('🏢 Department ID:', departmentId);
        console.log('📋 Position ID:', positionId);
        
        // 6. Criar employee (TESTE PRINCIPAL)
        console.log('👥 Criando registro na tabela employees...');
        const employeeRecord = {
            employee_code: `EMP-${Date.now()}`,
            name: funcionarioData.nome_completo,
            email: funcionarioData.email,
            hire_date: new Date().toISOString().split('T')[0],
            status: 'active',
            empresa_id: empresaId,
            profile_id: authData.user.id
        };
        
        // Adicionar department e position se existirem
        if (departmentId) employeeRecord.department_id = departmentId;
        if (positionId) employeeRecord.position_id = positionId;
        
        const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .insert(employeeRecord)
            .select('id')
            .single();
            
        if (employeeError) {
            console.error('❌ ERRO ao criar employee:', employeeError.message);
            console.error('Dados enviados:', employeeRecord);
            
            // Limpar usuário Auth criado
            await supabase.auth.signOut();
            return;
        }
        
        const employeeId = employeeData.id;
        console.log('✅ Employee criado com sucesso:', employeeId);
        
        // 7. Criar bar_employee
        console.log('🍺 Criando registro na tabela bar_employees...');
        const { data: barEmployeeData, error: barEmployeeError } = await supabase
            .from('bar_employees')
            .insert({
                employee_id: employeeId,
                bar_role: 'garcom',
                shift_preference: 'qualquer',
                specialties: ['atendimento'],
                commission_rate: 0,
                is_active: true,
                start_date: new Date().toISOString().split('T')[0],
                notes: `Nome: ${funcionarioData.nome_completo}, Email: ${funcionarioData.email}, Telefone: ${funcionarioData.telefone}`,
                empresa_id: empresaId
            })
            .select('id')
            .single();
            
        if (barEmployeeError) {
            console.error('❌ Erro ao criar bar_employee:', barEmployeeError.message);
        } else {
            console.log('✅ Bar employee criado:', barEmployeeData.id);
        }
        
        // 8. Criar usuarios_empresa
        console.log('🏢 Criando registro na tabela usuarios_empresa...');
        const { data: usuarioEmpresaData, error: usuarioEmpresaError } = await supabase
            .from('usuarios_empresa')
            .insert({
                user_id: authData.user.id,
                empresa_id: empresaId,
                nome_completo: funcionarioData.nome_completo,
                email: funcionarioData.email,
                telefone: funcionarioData.telefone,
                cargo: funcionarioData.cargo,
                tipo_usuario: 'funcionario',
                status: 'ativo',
                senha_provisoria: true,
                ativo: true,
                tem_acesso_sistema: true,
                papel: 'USER',
                is_primeiro_usuario: false,
                tentativas_login_falhadas: 0,
                total_logins: 0
            })
            .select('id')
            .single();
            
        if (usuarioEmpresaError) {
            console.error('❌ Erro ao criar usuarios_empresa:', usuarioEmpresaError.message);
        } else {
            console.log('✅ Usuario empresa criado:', usuarioEmpresaData.id);
            
            // 9. Criar permissões
            console.log('🔐 Criando permissões...');
            const permissoes = [
                {
                    usuario_empresa_id: usuarioEmpresaData.id,
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
                    usuario_empresa_id: usuarioEmpresaData.id,
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
                    usuario_empresa_id: usuarioEmpresaData.id,
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
            
            const { error: permissaoError } = await supabase
                .from('permissoes_usuario')
                .insert(permissoes);
                
            if (permissaoError) {
                console.error('❌ Erro ao criar permissões:', permissaoError.message);
            } else {
                console.log('✅ Permissões criadas com sucesso');
            }
        }
        
        console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('📋 Resumo:');
        console.log(`• Email: ${funcionarioData.email}`);
        console.log(`• Senha: ${funcionarioData.senha}`);
        console.log(`• Employee ID: ${employeeId}`);
        console.log(`• Bar Employee ID: ${barEmployeeData?.id || 'N/A'}`);
        console.log(`• Usuario Empresa ID: ${usuarioEmpresaData?.id || 'N/A'}`);
        console.log('\n🧪 Teste fazer login com essas credenciais!');
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error);
    }
}

// Executar teste
criarJoaoGriloTeste();