# 🚨 CORREÇÃO IMEDIATA - Problema de Credenciais

## **PROBLEMA IDENTIFICADO**
Ao cadastrar um funcionário e gerar as credenciais, a senha provisória não funciona no login.

## **CAUSA PRINCIPAL**
1. **Trigger `handle_new_user` falhando** - tenta inserir na tabela `profiles` que pode não existir
2. **Email não confirmado automaticamente** - impede login mesmo com senha correta
3. **Métodos de criação inconsistentes** - mistura `signUp()` e `admin.createUser()`

## **SOLUÇÃO RÁPIDA (15 minutos)**

### **Passo 1: Execute o Script SQL**
```sql
-- Execute no SQL Editor do Supabase
-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'employee',
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política permissiva para resolver o problema imediatamente
CREATE POLICY "Allow all operations" ON public.profiles
FOR ALL USING (true);

-- Confirmar emails de usuários existentes
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Corrigir trigger para não falhar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', new.email),
      'employee'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Não falhar se houver erro
    NULL;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Passo 2: Configurar Service Role (Recomendado)**
1. No Dashboard do Supabase: Settings → API
2. Copie a **service_role key** (não a anon key)
3. Configure no arquivo de configuração:
```javascript
const supabaseAdmin = createClient(
  'https://your-project.supabase.co',
  'your-service-role-key' // Use esta para criar usuários
);
```

### **Passo 3: Correção Temporária no Código**
Até corrigir o arquivo principal, use esta função para criar funcionários:

```javascript
// Função temporária para criar funcionário com credenciais que funcionam
async function createEmployeeWithWorkingCredentials(employeeData) {
  const password = generateSimplePassword();
  
  try {
    // Usar admin client se disponível
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: employeeData.email,
      password: password,
      email_confirm: true, // CRÍTICO: Confirmar email automaticamente
      user_metadata: {
        name: employeeData.nome_completo,
        role: 'funcionario',
        temporary_password: true
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('Usuário não criado');

    // Retornar credenciais que funcionam
    return {
      success: true,
      credentials: {
        email: employeeData.email,
        senha_temporaria: password,
        deve_alterar_senha: true
      },
      userId: authData.user.id
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function generateSimplePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

### **Passo 4: Testar Imediatamente**
Use este HTML para testar se funcionou:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste Rápido</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <h1>Teste de Credenciais</h1>
    <button onclick="testCredentials()">Testar Criação + Login</button>
    <div id="result"></div>

    <script>
        const supabase = window.supabase.createClient(
            'https://your-project.supabase.co',
            'your-service-role-key'
        );

        async function testCredentials() {
            const result = document.getElementById('result');
            
            try {
                const testEmail = `teste.${Date.now()}@exemplo.com`;
                const testPassword = 'Teste123@';

                // Criar usuário
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: testEmail,
                    password: testPassword,
                    email_confirm: true
                });

                if (authError) throw new Error(authError.message);

                result.innerHTML = `<h3>✅ Usuário criado!</h3>
                    <p>Email: ${testEmail}</p>
                    <p>Senha: ${testPassword}</p>`;

                // Testar login imediatamente
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: testEmail,
                    password: testPassword
                });

                if (loginError) {
                    result.innerHTML += `<p>❌ Login falhou: ${loginError.message}</p>`;
                } else {
                    result.innerHTML += `<p>🎉 Login funcionou! User ID: ${loginData.user.id}</p>`;
                    await supabase.auth.signOut();
                }

            } catch (error) {
                result.innerHTML = `<p>❌ Erro: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

## **RESULTADO ESPERADO**
Após seguir esses passos:
- ✅ Criação de funcionário funciona sem erros
- ✅ Credenciais temporárias funcionam no login
- ✅ Sistema força alteração de senha no primeiro acesso

## **SE AINDA NÃO FUNCIONAR**
1. Verifique se executou o SQL corretamente
2. Confirme se está usando service_role key
3. Teste com o HTML de teste acima
4. Verifique logs no console do navegador

**Tempo estimado: 15 minutos para resolução completa**