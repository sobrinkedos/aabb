-- ===============================================================================
-- CORREÇÃO: Problema de Credenciais Temporárias
-- Data: 2025-01-23
-- Objetivo: Corrigir problemas que impedem login com credenciais geradas
-- ===============================================================================

-- 1. VERIFICAR TABELA PROFILES
-- ===============================================================================
DO $$
BEGIN
    -- Verificar se a tabela profiles existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela profiles não existe. Criando...';
        
        -- Criar tabela profiles
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            name TEXT,
            role TEXT DEFAULT 'employee',
            avatar_url TEXT,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Comentário na tabela
        COMMENT ON TABLE public.profiles IS 'Perfis de usuários vinculados ao auth.users';
        
        RAISE NOTICE 'Tabela profiles criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe.';
    END IF;
END $$;

-- 2. CONFIGURAR RLS NA TABELA PROFILES
-- ===============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow all operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar políticas corretas
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Política para inserção (necessária para o trigger)
CREATE POLICY "System can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- 3. VERIFICAR E CORRIGIR TRIGGER HANDLE_NEW_USER
-- ===============================================================================
-- Recriar a função do trigger com tratamento de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tentar inserir o perfil, mas não falhar se houver erro
  BEGIN
    INSERT INTO public.profiles (id, name, avatar_url, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', new.email),
      new.raw_user_meta_data->>'avatar_url',
      COALESCE(new.raw_user_meta_data->>'role', 'employee')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log do erro mas não falhar a criação do usuário
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. CONFIRMAR EMAILS DE USUÁRIOS EXISTENTES
-- ===============================================================================
-- Confirmar emails de usuários que não têm email confirmado
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL 
  AND email IS NOT NULL;

-- Verificar quantos usuários foram atualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Emails confirmados para % usuários.', updated_count;
END $$;

-- 5. CRIAR PERFIS PARA USUÁRIOS EXISTENTES SEM PERFIL
-- ===============================================================================
INSERT INTO public.profiles (id, name, role, avatar_url, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', u.email, 'Usuário'),
    COALESCE(u.raw_user_meta_data->>'role', 'employee'),
    CASE 
        WHEN u.raw_user_meta_data->>'avatar_url' IS NOT NULL 
        THEN u.raw_user_meta_data->>'avatar_url'
        ELSE 'https://api.dicebear.com/8.x/initials/svg?seed=' || COALESCE(u.raw_user_meta_data->>'name', u.email)
    END,
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICAR DADOS DE USUÁRIOS EMPRESA
-- ===============================================================================
-- Verificar usuários na tabela usuarios_empresa sem user_id vinculado
DO $$
DECLARE
    unlinked_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unlinked_count
    FROM public.usuarios_empresa 
    WHERE user_id IS NULL AND tem_acesso_sistema = true;
    
    IF unlinked_count > 0 THEN
        RAISE NOTICE 'Encontrados % usuários em usuarios_empresa sem user_id vinculado.', unlinked_count;
        RAISE NOTICE 'Estes usuários precisam ter Auth criado manualmente.';
    ELSE
        RAISE NOTICE 'Todos os usuários com acesso ao sistema têm user_id vinculado.';
    END IF;
END $$;

-- 7. FUNÇÃO AUXILIAR PARA DEBUG DE AUTENTICAÇÃO
-- ===============================================================================
CREATE OR REPLACE FUNCTION public.debug_user_auth(user_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    email_confirmed BOOLEAN,
    has_profile BOOLEAN,
    has_usuarios_empresa BOOLEAN,
    can_login TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.email_confirmed_at IS NOT NULL,
        p.id IS NOT NULL,
        ue.id IS NOT NULL,
        CASE 
            WHEN u.email_confirmed_at IS NULL THEN 'NÃO - Email não confirmado'
            WHEN p.id IS NULL THEN 'TALVEZ - Sem perfil (não crítico)'
            WHEN ue.id IS NULL THEN 'NÃO - Sem registro em usuarios_empresa'
            ELSE 'SIM - Tudo configurado'
        END
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.usuarios_empresa ue ON ue.user_id = u.id
    WHERE u.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO PARA CONFIRMAR EMAIL DE USUÁRIO ESPECÍFICO
-- ===============================================================================
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Buscar usuário
    SELECT id, email, email_confirmed_at INTO user_record
    FROM auth.users 
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN 'ERRO: Usuário não encontrado com email ' || user_email;
    END IF;
    
    IF user_record.email_confirmed_at IS NOT NULL THEN
        RETURN 'OK: Email já estava confirmado para ' || user_email;
    END IF;
    
    -- Confirmar email
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = user_record.id;
    
    RETURN 'SUCESSO: Email confirmado para ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================================
-- INSTRUÇÕES DE USO
-- ===============================================================================

-- Para verificar um usuário específico:
-- SELECT * FROM public.debug_user_auth('funcionario@exemplo.com');

-- Para confirmar email de um usuário específico:
-- SELECT public.confirm_user_email('funcionario@exemplo.com');

-- Para listar usuários sem email confirmado:
-- SELECT email FROM auth.users WHERE email_confirmed_at IS NULL;

-- Para listar usuários sem perfil:
-- SELECT u.email FROM auth.users u 
-- LEFT JOIN public.profiles p ON p.id = u.id 
-- WHERE p.id IS NULL;

-- ===============================================================================
-- FINALIZAÇÃO
-- ===============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'CORREÇÃO DE CREDENCIAIS TEMPORÁRIAS - CONCLUÍDA';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tabela profiles verificada/criada';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Trigger handle_new_user corrigido';
    RAISE NOTICE '✅ Emails de usuários existentes confirmados';
    RAISE NOTICE '✅ Perfis criados para usuários existentes';
    RAISE NOTICE '✅ Funções de debug criadas';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Testar criação de novo funcionário';
    RAISE NOTICE '2. Verificar se login funciona imediatamente';
    RAISE NOTICE '3. Usar funções de debug se necessário';
    RAISE NOTICE '';
    RAISE NOTICE 'Para verificar usuário: SELECT * FROM debug_user_auth(''email@exemplo.com'');';
    RAISE NOTICE '';
END $$;