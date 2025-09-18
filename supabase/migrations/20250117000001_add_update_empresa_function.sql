-- Função para atualizar dados da empresa com verificação de permissões
CREATE OR REPLACE FUNCTION public.update_empresa_data(
  p_empresa_id UUID,
  p_nome VARCHAR(255),
  p_cnpj VARCHAR(18),
  p_email_admin VARCHAR(255),
  p_telefone VARCHAR(20),
  p_endereco JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tipo VARCHAR(50);
  v_result JSON;
BEGIN
  -- Verificar se o usuário atual tem permissão de administrador na empresa
  SELECT tipo_usuario INTO v_user_tipo
  FROM public.usuarios_empresa
  WHERE user_id = auth.uid()
    AND empresa_id = p_empresa_id;

  -- Se não encontrou o usuário ou não é administrador
  IF v_user_tipo IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado na empresa';
  END IF;

  IF v_user_tipo != 'administrador' THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar dados da empresa';
  END IF;

  -- Realizar o update
  UPDATE public.empresas
  SET 
    nome = p_nome,
    cnpj = p_cnpj,
    email_admin = p_email_admin,
    telefone = p_telefone,
    endereco = p_endereco,
    updated_at = NOW()
  WHERE id = p_empresa_id;

  -- Verificar se o update foi realizado
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa não encontrada ou não foi possível atualizar';
  END IF;

  -- Retornar sucesso
  SELECT json_build_object(
    'success', true,
    'message', 'Dados da empresa atualizados com sucesso',
    'empresa_id', p_empresa_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.update_empresa_data TO authenticated;