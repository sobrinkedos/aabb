/*
  # Atualizar Políticas RLS para Hierarquia Administrativa
  
  Esta migração atualiza e adiciona políticas RLS específicas para
  o sistema de hierarquia administrativa, garantindo controle de
  acesso baseado em papéis e privilégios.
*/

-- Função auxiliar para verificar se usuário pode ver outro usuário baseado na hierarquia
CREATE OR REPLACE FUNCTION public.pode_ver_usuario(target_papel TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuarios_empresa ue
    WHERE ue.user_id = auth.uid()
    AND (
      -- SUPER_ADMIN pode ver todos
      (ue.papel = 'SUPER_ADMIN') OR
      -- ADMIN pode ver MANAGER e USER
      (ue.papel = 'ADMIN' AND target_papel IN ('MANAGER', 'USER')) OR
      -- MANAGER pode ver USER
      (ue.papel = 'MANAGER' AND target_papel = 'USER') OR
      -- Todos podem ver usuários do mesmo nível ou inferior
      (ue.papel = target_papel)
    )
  );
END;
$;

-- Função auxiliar para verificar se usuário pode editar outro usuário
CREATE OR REPLACE FUNCTION public.pode_editar_usuario(target_papel TEXT, target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.usuarios_empresa ue
    WHERE ue.user_id = auth.uid()
    AND (
      -- SUPER_ADMIN pode editar todos (exceto não pode se auto-rebaixar se for o último)
      (ue.papel = 'SUPER_ADMIN' AND (
        target_papel != 'SUPER_ADMIN' OR 
        target_user_id != ue.id OR
        (SELECT COUNT(*) FROM public.usuarios_empresa WHERE papel = 'SUPER_ADMIN' AND empresa_id = ue.empresa_id) > 1
      )) OR
      -- ADMIN pode editar MANAGER e USER
      (ue.papel = 'ADMIN' AND target_papel IN ('MANAGER', 'USER')) OR
      -- MANAGER pode editar USER
      (ue.papel = 'MANAGER' AND target_papel = 'USER')
    )
  );
END;
$;

-- Atualizar política de visualização de usuários com hierarquia
DROP POLICY IF EXISTS "Usuários podem ver colegas da mesma empresa" ON public.usuarios_empresa;
CREATE POLICY "Usuários podem ver baseado na hierarquia" ON public.usuarios_empresa
  FOR SELECT USING (
    empresa_id = public.get_user_empresa_id() AND
    public.pode_ver_usuario(papel)
  );

-- Política para inserção de usuários (apenas quem pode gerenciar)
DROP POLICY IF EXISTS "Administradores podem gerenciar usuários da empresa" ON public.usuarios_empresa;
CREATE POLICY "Inserção baseada em hierarquia" ON public.usuarios_empresa
  FOR INSERT WITH CHECK (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = public.usuarios_empresa.empresa_id 
      AND (
        (ue.papel = 'SUPER_ADMIN') OR
        (ue.papel = 'ADMIN' AND papel IN ('MANAGER', 'USER')) OR
        (ue.papel = 'MANAGER' AND papel = 'USER')
      )
    )
  );

-- Política para atualização de usuários
CREATE POLICY "Atualização baseada em hierarquia" ON public.usuarios_empresa
  FOR UPDATE USING (
    empresa_id = public.get_user_empresa_id() AND
    public.pode_editar_usuario(papel, id)
  );

-- Política para exclusão de usuários (mais restritiva)
CREATE POLICY "Exclusão baseada em hierarquia" ON public.usuarios_empresa
  FOR DELETE USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = public.usuarios_empresa.empresa_id 
      AND (
        -- SUPER_ADMIN pode excluir não-SUPER_ADMINs
        (ue.papel = 'SUPER_ADMIN' AND papel != 'SUPER_ADMIN') OR
        -- ADMIN pode excluir MANAGER e USER
        (ue.papel = 'ADMIN' AND papel IN ('MANAGER', 'USER')) OR
        -- MANAGER pode excluir USER
        (ue.papel = 'MANAGER' AND papel = 'USER')
      )
    )
  );

-- Política específica para permissões de usuário baseada em hierarquia
DROP POLICY IF EXISTS "Administradores podem gerenciar permissões da empresa" ON public.permissoes_usuario;
CREATE POLICY "Permissões baseadas em hierarquia" ON public.permissoes_usuario
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue1
      JOIN public.usuarios_empresa ue2 ON ue1.empresa_id = ue2.empresa_id
      WHERE ue1.user_id = auth.uid() 
      AND ue2.id = public.permissoes_usuario.usuario_empresa_id
      AND (
        -- SUPER_ADMIN pode gerenciar todas as permissões
        (ue1.papel = 'SUPER_ADMIN') OR
        -- ADMIN pode gerenciar permissões de MANAGER e USER
        (ue1.papel = 'ADMIN' AND ue2.papel IN ('MANAGER', 'USER')) OR
        -- MANAGER pode gerenciar permissões de USER
        (ue1.papel = 'MANAGER' AND ue2.papel = 'USER') OR
        -- Usuários podem ver suas próprias permissões
        (ue1.id = ue2.id)
      )
    )
  );

-- Política para logs de auditoria com controle por hierarquia
DROP POLICY IF EXISTS "Usuários podem ver logs da empresa" ON public.logs_auditoria;
CREATE POLICY "Logs baseados em hierarquia" ON public.logs_auditoria
  FOR SELECT USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid()
      AND (
        -- SUPER_ADMIN pode ver todos os logs
        (ue.papel = 'SUPER_ADMIN') OR
        -- ADMIN pode ver logs não-críticos
        (ue.papel = 'ADMIN' AND acao NOT IN ('MUDANCA_PAPEL_USUARIO', 'CONFIGURACAO_SEGURANCA_ALTERADA')) OR
        -- MANAGER pode ver logs básicos
        (ue.papel = 'MANAGER' AND acao IN ('LOGIN', 'LOGOUT', 'PERMISSAO_ALTERADA')) OR
        -- USER pode ver apenas seus próprios logs
        (ue.papel = 'USER' AND usuario_id = auth.uid())
      )
    )
  );

-- Política para inserção de logs (sistema pode inserir, usuários específicos também)
DROP POLICY IF EXISTS "Sistema pode inserir logs" ON public.logs_auditoria;
CREATE POLICY "Inserção de logs controlada" ON public.logs_auditoria
  FOR INSERT WITH CHECK (
    empresa_id = public.get_user_empresa_id() AND
    (
      -- Sistema sempre pode inserir
      usuario_id = auth.uid() OR
      -- Administradores podem inserir logs de auditoria
      EXISTS (
        SELECT 1 FROM public.usuarios_empresa ue
        WHERE ue.user_id = auth.uid()
        AND ue.papel IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

-- Função para verificar acesso a configurações críticas
CREATE OR REPLACE FUNCTION public.pode_acessar_configuracao_critica(categoria TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- Configurações críticas só para SUPER_ADMIN
  IF categoria IN ('seguranca', 'sistema', 'integracao') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() AND papel = 'SUPER_ADMIN'
    );
  END IF;
  
  -- Outras configurações para ADMIN+
  RETURN public.tem_privilegio_admin('configuracoes_empresa');
END;
$;

-- Atualizar política de configurações para ser mais específica
DROP POLICY IF EXISTS "Configurações por nível de acesso" ON public.configuracoes_empresa;
CREATE POLICY "Configurações com controle hierárquico" ON public.configuracoes_empresa
  FOR ALL USING (
    empresa_id = public.get_user_empresa_id() AND
    public.pode_acessar_configuracao_critica(categoria)
  );

-- Política especial para empresas (apenas visualização e atualização limitada)
DROP POLICY IF EXISTS "Usuários podem ver apenas sua empresa" ON public.empresas;
CREATE POLICY "Visualização da empresa" ON public.empresas
  FOR SELECT USING (
    id = public.get_user_empresa_id()
  );

DROP POLICY IF EXISTS "Administradores podem atualizar sua empresa" ON public.empresas;
CREATE POLICY "Atualização da empresa por hierarquia" ON public.empresas
  FOR UPDATE USING (
    id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() 
      AND empresa_id = public.empresas.id 
      AND papel IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Função para registrar tentativas de acesso negado
CREATE OR REPLACE FUNCTION public.log_acesso_negado()
RETURNS TRIGGER AS $
BEGIN
  -- Registrar tentativa de acesso negado
  INSERT INTO public.logs_auditoria (
    empresa_id,
    usuario_id,
    acao,
    recurso,
    detalhes,
    ip_address
  ) VALUES (
    COALESCE(NEW.empresa_id, OLD.empresa_id, (SELECT empresa_id FROM public.usuarios_empresa WHERE user_id = auth.uid() LIMIT 1)),
    auth.uid(),
    'ACESSO_NEGADO',
    TG_TABLE_NAME,
    jsonb_build_object(
      'operation', TG_OP,
      'attempted_record', COALESCE(NEW.id, OLD.id)
    ),
    inet_client_addr()
  );
  
  RETURN NULL; -- Bloquear a operação
END;
$ LANGUAGE plpgsql;

-- Comentários nas funções
COMMENT ON FUNCTION public.pode_ver_usuario(TEXT) IS 'Verifica se o usuário atual pode visualizar outro usuário baseado na hierarquia';
COMMENT ON FUNCTION public.pode_editar_usuario(TEXT, UUID) IS 'Verifica se o usuário atual pode editar outro usuário baseado na hierarquia';
COMMENT ON FUNCTION public.pode_acessar_configuracao_critica(TEXT) IS 'Verifica se o usuário atual pode acessar configurações críticas';
COMMENT ON FUNCTION public.log_acesso_negado() IS 'Registra tentativas de acesso negado para auditoria';