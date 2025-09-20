/*
  # Adicionar Sistema de Hierarquia de Administradores
  
  Esta migração atualiza a tabela usuarios_empresa para suportar:
  - Papéis hierárquicos (SUPER_ADMIN, ADMIN, MANAGER, USER)
  - Campo is_primeiro_usuario para identificar o primeiro usuário
  - Índice único para garantir apenas um primeiro usuário por empresa
*/

-- Adicionar novos campos à tabela usuarios_empresa
ALTER TABLE public.usuarios_empresa 
ADD COLUMN IF NOT EXISTS papel VARCHAR(20) DEFAULT 'USER' 
CHECK (papel IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'));

ALTER TABLE public.usuarios_empresa 
ADD COLUMN IF NOT EXISTS is_primeiro_usuario BOOLEAN DEFAULT FALSE;

-- Migrar dados existentes: administradores viram ADMIN, funcionários viram USER
UPDATE public.usuarios_empresa 
SET papel = CASE 
  WHEN tipo_usuario = 'administrador' THEN 'ADMIN'
  WHEN tipo_usuario = 'funcionario' THEN 'USER'
  ELSE 'USER'
END
WHERE papel = 'USER'; -- Só atualiza se ainda não foi definido

-- Criar índice único para garantir apenas um primeiro usuário por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_primeiro_usuario_empresa 
ON public.usuarios_empresa (empresa_id) 
WHERE is_primeiro_usuario = true;

-- Função para verificar privilégios administrativos
CREATE OR REPLACE FUNCTION public.tem_privilegio_admin(privilegio TEXT)
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
      (ue.papel = 'SUPER_ADMIN') OR
      (ue.papel = 'ADMIN' AND privilegio NOT IN ('configuracoes_seguranca', 'integracao_externa', 'auditoria_completa', 'configuracoes_sistema')) OR
      (ue.papel = 'MANAGER' AND privilegio IN ('gerenciar_usuarios', 'relatorios_avancados'))
    )
  );
END;
$;

-- Função para verificar se é primeiro usuário
CREATE OR REPLACE FUNCTION public.is_primeiro_usuario()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_empresa 
    WHERE user_id = auth.uid() 
    AND is_primeiro_usuario = true
  );
END;
$;

-- Trigger para validar primeiro usuário
CREATE OR REPLACE FUNCTION public.validate_primeiro_usuario()
RETURNS TRIGGER AS $
BEGIN
  -- Se está marcando como primeiro usuário
  IF NEW.is_primeiro_usuario = true THEN
    -- Verifica se já existe um primeiro usuário na empresa
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
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Criar trigger para validação do primeiro usuário
DROP TRIGGER IF EXISTS trigger_validate_primeiro_usuario ON public.usuarios_empresa;
CREATE TRIGGER trigger_validate_primeiro_usuario
  BEFORE INSERT OR UPDATE ON public.usuarios_empresa
  FOR EACH ROW EXECUTE FUNCTION public.validate_primeiro_usuario();

-- Trigger para configuração automática do primeiro usuário
CREATE OR REPLACE FUNCTION public.setup_primeiro_usuario()
RETURNS TRIGGER AS $
BEGIN
  -- Se é o primeiro usuário, configurar tudo automaticamente
  IF NEW.is_primeiro_usuario = true THEN
    
    -- Criar configurações padrão da empresa
    INSERT INTO public.configuracoes_empresa (empresa_id, categoria, configuracoes)
    VALUES 
      (NEW.empresa_id, 'geral', '{"tema": "claro", "idioma": "pt-BR", "timezone": "America/Sao_Paulo"}'),
      (NEW.empresa_id, 'seguranca', '{"tempo_sessao": 480, "tentativas_login": 5, "bloqueio_temporario": 15}'),
      (NEW.empresa_id, 'sistema', '{"backup_automatico": true, "retencao_logs_dias": 90, "limite_usuarios": 50}'),
      (NEW.empresa_id, 'notificacoes', '{"email_novos_usuarios": true, "email_tentativas_login": true}'),
      (NEW.empresa_id, 'integracao', '{}')
    ON CONFLICT (empresa_id, categoria) DO NOTHING;
    
    -- Criar permissões completas para todos os módulos
    INSERT INTO public.permissoes_usuario (usuario_empresa_id, modulo, permissoes)
    SELECT 
      NEW.id,
      modulo,
      '{"visualizar": true, "criar": true, "editar": true, "excluir": true, "administrar": true}'
    FROM (
      VALUES 
        ('dashboard'), ('monitor_bar'), ('atendimento_bar'), 
        ('monitor_cozinha'), ('gestao_caixa'), ('clientes'), 
        ('funcionarios'), ('socios'), ('configuracoes'), ('relatorios')
    ) AS modulos(modulo)
    ON CONFLICT (usuario_empresa_id, modulo) DO NOTHING;
    
    -- Log da criação do primeiro usuário
    INSERT INTO public.logs_auditoria (empresa_id, usuario_id, acao, recurso, detalhes)
    VALUES (
      NEW.empresa_id,
      NEW.user_id,
      'PRIMEIRO_USUARIO_CRIADO',
      'usuarios_empresa',
      jsonb_build_object('usuario_id', NEW.id, 'email', NEW.email)
    );
    
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Criar trigger para setup do primeiro usuário
DROP TRIGGER IF EXISTS trigger_setup_primeiro_usuario ON public.usuarios_empresa;
CREATE TRIGGER trigger_setup_primeiro_usuario
  AFTER INSERT ON public.usuarios_empresa
  FOR EACH ROW EXECUTE FUNCTION public.setup_primeiro_usuario();

-- Atualizar políticas RLS para considerar hierarquia
DROP POLICY IF EXISTS "Administradores podem gerenciar usuários da empresa" ON public.usuarios_empresa;
CREATE POLICY "Administradores podem gerenciar usuários da empresa" ON public.usuarios_empresa
  FOR ALL USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = public.usuarios_empresa.empresa_id 
      AND ue.papel IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
    )
  );

-- Atualizar política para configurações com controle de acesso por categoria
DROP POLICY IF EXISTS "Administradores podem gerenciar configurações da empresa" ON public.configuracoes_empresa;
CREATE POLICY "Configurações por nível de acesso" ON public.configuracoes_empresa
  FOR ALL USING (
    empresa_id = public.get_user_empresa_id() AND
    (
      categoria = 'geral' OR
      (categoria IN ('seguranca', 'sistema', 'integracao') AND public.tem_privilegio_admin(categoria)) OR
      (categoria = 'notificacoes' AND public.tem_privilegio_admin('notificacoes'))
    )
  );

-- Comentários
COMMENT ON COLUMN public.usuarios_empresa.papel IS 'Papel do usuário na hierarquia: SUPER_ADMIN, ADMIN, MANAGER, USER';
COMMENT ON COLUMN public.usuarios_empresa.is_primeiro_usuario IS 'Indica se é o primeiro usuário (SUPER_ADMIN) da empresa';
COMMENT ON FUNCTION public.tem_privilegio_admin(TEXT) IS 'Verifica se o usuário atual tem privilégios administrativos específicos';
COMMENT ON FUNCTION public.is_primeiro_usuario() IS 'Verifica se o usuário atual é o primeiro usuário da empresa';