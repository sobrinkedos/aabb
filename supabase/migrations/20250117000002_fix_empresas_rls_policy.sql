-- Corrigir política RLS para empresas - adicionar WITH CHECK para UPDATE
DROP POLICY IF EXISTS "Administradores podem atualizar sua empresa" ON public.empresas;

-- Recriar política com USING e WITH CHECK
CREATE POLICY "Administradores podem atualizar sua empresa" ON public.empresas
  FOR UPDATE 
  USING (
    id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() 
      AND empresa_id = public.empresas.id 
      AND tipo_usuario = 'administrador'
    )
  )
  WITH CHECK (
    id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() 
      AND empresa_id = public.empresas.id 
      AND tipo_usuario = 'administrador'
    )
  );

-- Adicionar política específica para SELECT após UPDATE (para o .select() funcionar)
CREATE POLICY "Administradores podem ver dados atualizados da empresa" ON public.empresas
  FOR SELECT USING (
    id = public.get_user_empresa_id() AND
    EXISTS (
      SELECT 1 FROM public.usuarios_empresa 
      WHERE user_id = auth.uid() 
      AND empresa_id = public.empresas.id 
      AND tipo_usuario = 'administrador'
    )
  );