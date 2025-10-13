-- 🎯 SCRIPT PARA CORRIGIR FUNCIONÁRIOS EXISTENTES
-- Execute este script no Supabase para corrigir funcionários sem permissões

-- 1. Verificar funcionários problemáticos
SELECT 
    ue.id,
    ue.email,
    ue.tipo_usuario,
    ue.senha_provisoria,
    ue.tem_acesso_sistema,
    COUNT(pu.id) as total_permissoes
FROM usuarios_empresa ue
LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
WHERE ue.tipo_usuario = 'funcionario' 
  AND ue.tem_acesso_sistema = true
  AND ue.user_id IS NOT NULL
GROUP BY ue.id, ue.email, ue.tipo_usuario, ue.senha_provisoria, ue.tem_acesso_sistema
ORDER BY total_permissoes ASC, ue.created_at DESC;

-- 2. Corrigir senha_provisoria para TRUE (para ativar SenhaProvisionariaGuard)
UPDATE usuarios_empresa 
SET senha_provisoria = true 
WHERE tipo_usuario = 'funcionario' 
  AND tem_acesso_sistema = true 
  AND user_id IS NOT NULL 
  AND senha_provisoria = false;

-- 3. Criar permissões básicas para funcionários SEM permissões
-- Primeiro, identificar funcionários sem permissões
WITH funcionarios_sem_permissoes AS (
    SELECT ue.id as usuario_empresa_id
    FROM usuarios_empresa ue
    LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
    WHERE ue.tipo_usuario = 'funcionario' 
      AND ue.tem_acesso_sistema = true
      AND ue.user_id IS NOT NULL
      AND pu.id IS NULL
)
INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes)
SELECT 
    fsp.usuario_empresa_id,
    modulo_nome,
    CASE 
        WHEN modulo_nome = 'dashboard' THEN '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
        WHEN modulo_nome = 'atendimento_bar' THEN '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'::jsonb
        WHEN modulo_nome = 'clientes' THEN '{"visualizar": true, "criar": true, "editar": false, "excluir": false, "administrar": false}'::jsonb
        WHEN modulo_nome = 'monitor_cozinha' THEN '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
        ELSE '{"visualizar": false, "criar": false, "editar": false, "excluir": false, "administrar": false}'::jsonb
    END as permissoes
FROM funcionarios_sem_permissoes fsp
CROSS JOIN (
    VALUES 
        ('dashboard'),
        ('atendimento_bar'),
        ('clientes'),
        ('monitor_cozinha')
) AS modulos(modulo_nome);

-- 4. Verificar resultado final
SELECT 
    ue.email,
    ue.tipo_usuario,
    ue.senha_provisoria,
    COUNT(pu.id) as total_permissoes,
    STRING_AGG(pu.modulo, ', ') as modulos_com_acesso
FROM usuarios_empresa ue
LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
WHERE ue.tipo_usuario = 'funcionario' 
  AND ue.tem_acesso_sistema = true
  AND ue.user_id IS NOT NULL
GROUP BY ue.id, ue.email, ue.tipo_usuario, ue.senha_provisoria
ORDER BY ue.created_at DESC;

-- 5. Status final
SELECT 
    'RESUMO DA CORREÇÃO' as status,
    COUNT(CASE WHEN ue.senha_provisoria = true THEN 1 END) as funcionarios_com_senha_provisoria,
    COUNT(CASE WHEN pu.id IS NOT NULL THEN 1 END) as funcionarios_com_permissoes,
    COUNT(*) as total_funcionarios_sistema
FROM usuarios_empresa ue
LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
WHERE ue.tipo_usuario = 'funcionario' 
  AND ue.tem_acesso_sistema = true
  AND ue.user_id IS NOT NULL;