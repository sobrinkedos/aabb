/*
  # Sistema de Autenticação Multitenant
  
  Esta migração cria todas as tabelas e políticas RLS necessárias
  para o sistema de autenticação multitenant.
*/

-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email_admin VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco JSONB,
  plano VARCHAR(50) DEFAULT 'basico' CHECK (plano IN ('basico', 'premium', 'enterprise')),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de usuários da empresa
CREATE TABLE IF NOT EXISTS public.usuarios_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cargo VARCHAR(100),
  tipo_usuario VARCHAR(20) DEFAULT 'funcionario' CHECK (tipo_usuario IN ('administrador', 'funcionario')),
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  senha_provisoria BOOLEAN DEFAULT FALSE,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, empresa_id)
);

-- Criar tabela de permissões de usuário
CREATE TABLE IF NOT EXISTS public.permissoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_empresa_id UUID REFERENCES public.usuarios_empresa(id) ON DELETE CASCADE,
  modulo VARCHAR(50) NOT NULL,
  permissoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_empresa_id, modulo)
);

-- Criar tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS public.configuracoes_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL,
  configuracoes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, categoria)
);

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  acao VARCHAR(100) NOT NULL,
  recurso VARCHAR(100),
  detalhes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_user_id ON public.usuarios_empresa(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_empresa_id ON public.usuarios_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_empresa_id ON public.permissoes_usuario(usuario_empresa_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_id ON public.configuracoes_empresa(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_empresa_id ON public.logs_auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_usuario_id ON public.logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_created_at ON public.logs_auditoria(created_at);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter a empresa do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT empresa_id 
  FROM public.usuarios_empresa 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Políticas RLS para empresas
CREATE POLICY "Usuários podem ver apenas sua empresa" ON public.empresas
  FOR SELECT USING (
    id = public.get_user_empresa_id()
  );

CREATE POLICY "Administradores podem atualizar sua empresa" ON public.empresas
  FOR UPDATE USING (
    id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() 
      AND empresa_id = public.empresas.id 
      AND tipo_usuario = 'administrador'
    )
  );

-- Políticas RLS para usuarios_empresa
CREATE POLICY "Usuários podem ver colegas da mesma empresa" ON public.usuarios_empresa
  FOR SELECT USING (
    empresa_id = public.get_user_empresa_id()
  );

CREATE POLICY "Administradores podem gerenciar usuários da empresa" ON public.usuarios_empresa
  FOR ALL USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.user_id = auth.uid() 
      AND ue.empresa_id = public.usuarios_empresa.empresa_id 
      AND ue.tipo_usuario = 'administrador'
    )
  );

-- Políticas RLS para permissoes_usuario
CREATE POLICY "Usuários podem ver permissões da mesma empresa" ON public.permissoes_usuario
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue
      WHERE ue.id = public.permissoes_usuario.usuario_empresa_id
      AND ue.empresa_id = public.get_user_empresa_id()
    )
  );

CREATE POLICY "Administradores podem gerenciar permissões da empresa" ON public.permissoes_usuario
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa ue1
      JOIN public.usuarios_empresa ue2 ON ue1.empresa_id = ue2.empresa_id
      WHERE ue1.user_id = auth.uid() 
      AND ue1.tipo_usuario = 'administrador'
      AND ue2.id = public.permissoes_usuario.usuario_empresa_id
    )
  );

-- Políticas RLS para configuracoes_empresa
CREATE POLICY "Usuários podem ver configurações da empresa" ON public.configuracoes_empresa
  FOR SELECT USING (
    empresa_id = public.get_user_empresa_id()
  );

CREATE POLICY "Administradores podem gerenciar configurações da empresa" ON public.configuracoes_empresa
  FOR ALL USING (
    empresa_id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() 
      AND empresa_id = public.configuracoes_empresa.empresa_id 
      AND tipo_usuario = 'administrador'
    )
  );

-- Políticas RLS para logs_auditoria
CREATE POLICY "Usuários podem ver logs da empresa" ON public.logs_auditoria
  FOR SELECT USING (
    empresa_id = public.get_user_empresa_id()
  );

CREATE POLICY "Sistema pode inserir logs" ON public.logs_auditoria
  FOR INSERT WITH CHECK (
    empresa_id = public.get_user_empresa_id()
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_empresa_updated_at
  BEFORE UPDATE ON public.usuarios_empresa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissoes_usuario_updated_at
  BEFORE UPDATE ON public.permissoes_usuario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_empresa_updated_at
  BEFORE UPDATE ON public.configuracoes_empresa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE public.empresas IS 'Tabela de empresas do sistema multitenant';
COMMENT ON TABLE public.usuarios_empresa IS 'Usuários vinculados a empresas';
COMMENT ON TABLE public.permissoes_usuario IS 'Permissões de usuários por módulo';
COMMENT ON TABLE public.configuracoes_empresa IS 'Configurações específicas de cada empresa';
COMMENT ON TABLE public.logs_auditoria IS 'Logs de auditoria por empresa';