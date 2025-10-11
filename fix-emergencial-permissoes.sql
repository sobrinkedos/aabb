-- ========================================
-- SOLUÇÃO EMERGENCIAL - BYPASS RLS TOTAL
-- ========================================
-- Esta é uma correção de emergência para resolver o problema imediatamente

-- ETAPA 1: DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE usuarios_empresa DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;

-- ETAPA 2: CORRIGIR FUNÇÃO get_user_empresa_id SEM DEPENDÊNCIA DE RLS
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  empresa_uuid UUID;
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Buscar empresa_id sem RLS (SECURITY DEFINER)
  SELECT empresa_id INTO empresa_uuid
  FROM usuarios_empresa 
  WHERE user_id = auth.uid()
    AND status = 'ativo'
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN empresa_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- ETAPA 3: CRIAR PERMISSÕES PARA TODOS OS USUÁRIOS SEM PERMISSÕES
-- Baseado na memória: "É obrigatório garantir que sejam inseridos registros válidos na tabela permissoes_usuario"

DO $$
DECLARE
    usuario_record RECORD;
    total_usuarios INTEGER := 0;
    total_permissoes_criadas INTEGER := 0;
BEGIN
    -- Buscar todos os usuários ativos sem permissões
    FOR usuario_record IN 
        SELECT ue.id as usuario_empresa_id, ue.nome_completo, ue.papel, ue.cargo
        FROM usuarios_empresa ue
        LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
        WHERE ue.status = 'ativo' 
          AND ue.tem_acesso_sistema = true
          AND pu.id IS NULL
    LOOP
        total_usuarios := total_usuarios + 1;
        
        -- ADMIN/SUPER_ADMIN: Permissões completas
        IF usuario_record.papel IN ('SUPER_ADMIN', 'ADMIN') THEN
            INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
            (usuario_record.usuario_empresa_id, 'dashboard', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'monitor_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'atendimento_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'monitor_cozinha', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'gestao_caixa', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'clientes', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'funcionarios', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'relatorios', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (usuario_record.usuario_empresa_id, 'configuracoes', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}');
            
            total_permissoes_criadas := total_permissoes_criadas + 9;
            
        -- MANAGER: Permissões de gestão
        ELSIF usuario_record.papel = 'MANAGER' THEN
            INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
            (usuario_record.usuario_empresa_id, 'dashboard', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'monitor_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'atendimento_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'monitor_cozinha', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'gestao_caixa', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'clientes', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'funcionarios', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
            (usuario_record.usuario_empresa_id, 'relatorios', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}');
            
            total_permissoes_criadas := total_permissoes_criadas + 8;
            
        -- USUÁRIOS COMUNS: Permissões baseadas no cargo
        ELSE
            -- Verificar cargo para permissões específicas
            IF usuario_record.cargo ILIKE '%caixa%' OR usuario_record.cargo ILIKE '%cashier%' THEN
                -- Operador de Caixa
                INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
                (usuario_record.usuario_empresa_id, 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'gestao_caixa', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'atendimento_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'clientes', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}');
                
                total_permissoes_criadas := total_permissoes_criadas + 4;
                
            ELSIF usuario_record.cargo ILIKE '%atendente%' OR usuario_record.cargo ILIKE '%garcom%' THEN
                -- Atendente/Garçom
                INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
                (usuario_record.usuario_empresa_id, 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'monitor_bar', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'atendimento_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'clientes', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}');
                
                total_permissoes_criadas := total_permissoes_criadas + 4;
                
            ELSIF usuario_record.cargo ILIKE '%cozinha%' OR usuario_record.cargo ILIKE '%chef%' THEN
                -- Cozinheiro
                INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
                (usuario_record.usuario_empresa_id, 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'monitor_cozinha', '{"visualizar": true, "criar": true, "editar": true, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'atendimento_bar', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}');
                
                total_permissoes_criadas := total_permissoes_criadas + 3;
                
            ELSE
                -- Funcionário padrão: permissões básicas
                INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
                (usuario_record.usuario_empresa_id, 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
                (usuario_record.usuario_empresa_id, 'atendimento_bar', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}');
                
                total_permissoes_criadas := total_permissoes_criadas + 2;
            END IF;
        END IF;
        
        RAISE NOTICE 'Permissões criadas para: % (%, %)', usuario_record.nome_completo, usuario_record.papel, usuario_record.cargo;
    END LOOP;
    
    RAISE NOTICE 'CORREÇÃO CONCLUÍDA: % usuários processados, % permissões criadas', total_usuarios, total_permissoes_criadas;
END;
$$;

-- ETAPA 4: TRIGGER AUTOMÁTICO PARA NOVOS USUÁRIOS
-- Baseado na memória: "Ao criar um novo usuário, é obrigatório garantir a inserção de registros na tabela permissoes_usuario"

CREATE OR REPLACE FUNCTION public.criar_permissoes_usuario_automatico()
RETURNS TRIGGER AS $$
BEGIN
    -- Só criar permissões se o usuário tem acesso ao sistema
    IF NEW.tem_acesso_sistema = true AND NEW.status = 'ativo' THEN
        
        -- ADMIN/SUPER_ADMIN: Permissões completas
        IF NEW.papel IN ('SUPER_ADMIN', 'ADMIN') THEN
            INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
            (NEW.id, 'dashboard', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'monitor_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'atendimento_bar', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'monitor_cozinha', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'gestao_caixa', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'clientes', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'funcionarios', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'relatorios', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'),
            (NEW.id, 'configuracoes', '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}');
            
        ELSE
            -- Usuários comuns: permissões básicas obrigatórias
            INSERT INTO permissoes_usuario (usuario_empresa_id, modulo, permissoes) VALUES
            (NEW.id, 'dashboard', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}'),
            (NEW.id, 'atendimento_bar', '{"visualizar": true, "criar": false, "editar": false, "excluir": false, "administrar": false}');
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_criar_permissoes_automatico ON usuarios_empresa;
CREATE TRIGGER trigger_criar_permissoes_automatico
    AFTER INSERT ON usuarios_empresa
    FOR EACH ROW EXECUTE FUNCTION criar_permissoes_usuario_automatico();

-- ETAPA 5: REABILITAR RLS COM POLÍTICAS SIMPLES E FUNCIONAIS
ALTER TABLE usuarios_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS extremamente simples para evitar deadlock
CREATE POLICY "usuarios_empresa_emergency_access" ON usuarios_empresa
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            user_id = auth.uid() OR
            empresa_id = get_user_empresa_id() OR
            current_setting('role') = 'service_role'
        )
    );

CREATE POLICY "permissoes_usuario_emergency_access" ON permissoes_usuario
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (SELECT 1 FROM usuarios_empresa WHERE id = permissoes_usuario.usuario_empresa_id AND user_id = auth.uid()) OR
            current_setting('role') = 'service_role'
        )
    );

CREATE POLICY "empresas_emergency_access" ON empresas
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            id = get_user_empresa_id() OR
            current_setting('role') = 'service_role'
        )
    );

-- ETAPA 6: FUNÇÃO DE VALIDAÇÃO
CREATE OR REPLACE FUNCTION validar_correcao_permissoes()
RETURNS TABLE(
    usuario_nome TEXT,
    tem_permissoes BOOLEAN,
    total_permissoes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.nome_completo as usuario_nome,
        COUNT(pu.id) > 0 as tem_permissoes,
        COUNT(pu.id)::INTEGER as total_permissoes
    FROM usuarios_empresa ue
    LEFT JOIN permissoes_usuario pu ON ue.id = pu.usuario_empresa_id
    WHERE ue.status = 'ativo' AND ue.tem_acesso_sistema = true
    GROUP BY ue.id, ue.nome_completo
    ORDER BY ue.nome_completo;
END;
$$ LANGUAGE plpgsql;

-- Para testar: SELECT * FROM validar_correcao_permissoes();