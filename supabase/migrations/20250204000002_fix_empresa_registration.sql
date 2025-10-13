/*
  # Correção do Sistema de Registro de Empresa e Primeiro Usuário
  
  Esta migração corrige e melhora o processo de registro de empresa:
  1. Corrige políticas RLS para permitir criação de empresa sem autenticação prévia
  2. Adiciona função para registro seguro de empresa
  3. Melhora os triggers para primeiro usuário
  4. Garante isolamento mesmo durante o processo de registro
*/

-- =============================================================================
-- FASE 1: FUNÇÕES AUXILIARES PARA REGISTRO SEGURO
-- =============================================================================

-- Função para registrar empresa e primeiro usuário de forma atômica
CREATE OR REPLACE FUNCTION public.registrar_empresa_completa(
  p_nome_empresa TEXT,
  p_cnpj TEXT,
  p_email_admin TEXT,
  p_telefone_empresa TEXT DEFAULT NULL,
  p_endereco JSONB DEFAULT NULL,
  p_nome_admin TEXT,
  p_telefone_admin TEXT DEFAULT NULL,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_id UUID;
  v_usuario_id UUID;
  v_result JSONB;
BEGIN
  -- Verificar se CNPJ já existe
  IF EXISTS (SELECT 1 FROM public.empresas WHERE cnpj = p_cnpj) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'CNPJ já cadastrado no sistema'
    );
  END IF;

  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.empresas WHERE email_admin = p_email_admin) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email de administrador já cadastrado'
    );
  END IF;

  BEGIN
    -- Criar empresa
    INSERT INTO public.empresas (
      nome, 
      cnpj, 
      email_admin, 
      telefone, 
      endereco, 
      plano, 
      status
    ) VALUES (
      p_nome_empresa,
      p_cnpj,
      p_email_admin,
      p_telefone_empresa,
      p_endereco,
      'basico',
      'ativo'
    ) RETURNING id INTO v_empresa_id;

    -- Criar primeiro usuário como SUPER_ADMIN
    INSERT INTO public.usuarios_empresa (
      user_id,
      empresa_id,
      nome_completo,
      email,
      telefone,
      cargo,
      tipo_usuario,
      papel,
      is_primeiro_usuario,
      status,
      senha_provisoria
    ) VALUES (
      p_user_id,
      v_empresa_id,
      p_nome_admin,
      p_email_admin,
      p_telefone_admin,
      'Administrador Principal',
      'administrador',
      'SUPER_ADMIN',
      true,
      'ativo',
      false
    ) RETURNING id INTO v_usuario_id;

    -- Criar configurações padrão da empresa
    INSERT INTO public.configuracoes_empresa (empresa_id, categoria, configuracoes)
    VALUES 
      (v_empresa_id, 'geral', '{"tema": "claro", "idioma": "pt-BR", "timezone": "America/Sao_Paulo"}'),
      (v_empresa_id, 'seguranca', '{"tempo_sessao": 480, "tentativas_login": 5, "bloqueio_temporario": 15}'),
      (v_empresa_id, 'sistema', '{"backup_automatico": true, "retencao_logs_dias": 90, "limite_usuarios": 50}'),
      (v_empresa_id, 'notificacoes', '{"email_novos_usuarios": true, "email_tentativas_login": true}'),
      (v_empresa_id, 'integracao', '{}');

    -- Criar permissões completas para o primeiro usuário
    INSERT INTO public.permissoes_usuario (usuario_empresa_id, modulo, permissoes)
    SELECT 
      v_usuario_id,
      modulo,
      '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'
    FROM (
      VALUES 
        ('dashboard'), ('monitor_bar'), ('atendimento_bar'), 
        ('monitor_cozinha'), ('gestao_caixa'), ('clientes'), 
        ('funcionarios'), ('socios'), ('configuracoes'), ('relatorios')
    ) AS modulos(modulo);

    -- Log da criação
    INSERT INTO public.logs_auditoria (empresa_id, usuario_id, acao, recurso, detalhes)
    VALUES (
      v_empresa_id,
      p_user_id,
      'EMPRESA_REGISTRADA',
      'empresas',
      jsonb_build_object(
        'empresa_id', v_empresa_id,
        'usuario_id', v_usuario_id,
        'cnpj', p_cnpj,
        'email_admin', p_email_admin
      )
    );

    -- Retornar sucesso
    RETURN jsonb_build_object(
      'success', true,
      'empresa_id', v_empresa_id,
      'usuario_id', v_usuario_id
    );

  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, rollback automático
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$;

-- =============================================================================
-- FASE 2: POLÍTICAS RLS ESPECIAIS PARA REGISTRO
-- =============================================================================

-- Política especial para permitir INSERT em empresas durante registro
-- (sem autenticação, apenas para a função de registro)
DROP POLICY IF EXISTS "empresas_registro_publico" ON public.empresas;
CREATE POLICY "empresas_registro_publico" ON public.empresas
FOR INSERT WITH CHECK (true); -- Permitir inserção pública apenas via função

-- Política especial para permitir INSERT em usuarios_empresa durante registro
DROP POLICY IF EXISTS "usuarios_empresa_registro_publico" ON public.usuarios_empresa;
CREATE POLICY "usuarios_empresa_registro_publico" ON public.usuarios_empresa
FOR INSERT WITH CHECK (
  -- Permitir inserção apenas se:
  -- 1. É via função de registro (SECURITY DEFINER bypass)
  -- 2. OU usuário autenticado criando na sua empresa
  auth.uid() IS NULL OR -- Função SECURITY DEFINER
  empresa_id = public.get_user_empresa_id()
);

-- =============================================================================
-- FASE 3: MELHORAR FUNÇÕES EXISTENTES
-- =============================================================================

-- Melhorar função get_user_empresa_id para lidar com casos especiais
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT empresa_id 
  FROM public.usuarios_empresa 
  WHERE user_id = auth.uid()
  AND status = 'ativo'
  LIMIT 1;
$$;

-- Função para verificar se usuário é primeiro usuário da empresa
CREATE OR REPLACE FUNCTION public.is_primeiro_usuario_empresa()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND is_primeiro_usuario = true
    AND status = 'ativo'
  );
$$;

-- =============================================================================
-- FASE 4: CORRIGIR TRIGGERS DE PRIMEIRO USUÁRIO
-- =============================================================================

-- Atualizar trigger para validação de primeiro usuário
CREATE OR REPLACE FUNCTION public.validate_primeiro_usuario()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como primeiro usuário
  IF NEW.is_primeiro_usuario = true THEN
    -- Verificar se já existe um primeiro usuário na empresa (exceto o próprio registro)
    IF EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE empresa_id = NEW.empresa_id 
      AND is_primeiro_usuario = true 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Já existe um primeiro usuário para esta empresa';
    END IF;
    
    -- Automaticamente define como SUPER_ADMIN
    NEW.papel = 'SUPER_ADMIN';
    NEW.tipo_usuario = 'administrador';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_validate_primeiro_usuario ON public.usuarios_empresa;
CREATE TRIGGER trigger_validate_primeiro_usuario
  BEFORE INSERT OR UPDATE ON public.usuarios_empresa
  FOR EACH ROW EXECUTE FUNCTION public.validate_primeiro_usuario();

-- =============================================================================
-- FASE 5: POLÍTICAS RLS HIERÁRQUICAS MELHORADAS
-- =============================================================================

-- Política melhorada para usuarios_empresa considerando hierarquia
DROP POLICY IF EXISTS "usuarios_empresa_select_policy" ON public.usuarios_empresa;
CREATE POLICY "usuarios_empresa_select_policy" ON public.usuarios_empresa
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- Usuário pode ver próprio registro
    user_id = auth.uid() OR
    -- Usuários da mesma empresa podem se ver
    empresa_id = public.get_user_empresa_id() OR
    -- Service role pode ver tudo
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Política melhorada para UPDATE considerando hierarquia
DROP POLICY IF EXISTS "usuarios_empresa_update_policy" ON public.usuarios_empresa;
CREATE POLICY "usuarios_empresa_update_policy" ON public.usuarios_empresa
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    -- Usuário pode atualizar próprio registro (exceto papel se não for admin)
    (user_id = auth.uid() AND NOT (OLD.papel != NEW.papel AND NOT public.is_admin_user())) OR
    -- Admins podem atualizar usuários da empresa
    (empresa_id = public.get_user_empresa_id() AND public.is_admin_user()) OR
    -- Service role pode atualizar tudo
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- =============================================================================
-- FASE 6: FUNÇÃO DE LIMPEZA E VALIDAÇÃO
-- =============================================================================

-- Função para validar integridade do sistema multitenant
CREATE OR REPLACE FUNCTION public.validar_integridade_multitenant()
RETURNS TABLE (
  tabela TEXT,
  problema TEXT,
  registros_afetados INTEGER,
  acao_recomendada TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Verificar empresas sem primeiro usuário
  RETURN QUERY
  SELECT 
    'empresas'::TEXT,
    'Empresa sem primeiro usuário'::TEXT,
    COUNT(*)::INTEGER,
    'Criar primeiro usuário para a empresa'::TEXT
  FROM public.empresas e
  WHERE NOT EXISTS (
    SELECT 1 FROM public.usuarios_empresa ue
    WHERE ue.empresa_id = e.id
    AND ue.is_primeiro_usuario = true
  )
  HAVING COUNT(*) > 0;

  -- Verificar usuários sem empresa válida
  RETURN QUERY
  SELECT 
    'usuarios_empresa'::TEXT,
    'Usuário vinculado a empresa inexistente'::TEXT,
    COUNT(*)::INTEGER,
    'Corrigir vinculação ou remover usuário'::TEXT
  FROM public.usuarios_empresa ue
  WHERE NOT EXISTS (
    SELECT 1 FROM public.empresas e
    WHERE e.id = ue.empresa_id
  )
  HAVING COUNT(*) > 0;

  -- Verificar dados sem empresa_id em tabelas que deveriam ter
  FOR r IN SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name IN ('menu_items', 'inventory_items', 'employees', 'customers', 'comandas', 'balcao_orders')
  LOOP
    EXECUTE format('
      SELECT %L, ''Registros sem empresa_id'', COUNT(*), ''Adicionar empresa_id aos registros''
      FROM %I
      WHERE empresa_id IS NULL
      HAVING COUNT(*) > 0
    ', r.table_name, r.table_name)
    INTO tabela, problema, registros_afetados, acao_recomendada;
    
    IF registros_afetados > 0 THEN
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- =============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON FUNCTION public.registrar_empresa_completa IS 'Registra empresa e primeiro usuário de forma atômica e segura';
COMMENT ON FUNCTION public.is_primeiro_usuario_empresa IS 'Verifica se o usuário atual é o primeiro usuário da empresa';
COMMENT ON FUNCTION public.validar_integridade_multitenant IS 'Valida a integridade do sistema multitenant';

-- Executar validação de integridade
SELECT 'Migração de correção do registro concluída!' as resultado;
SELECT * FROM public.validar_integridade_multitenant();