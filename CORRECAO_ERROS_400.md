# 🚨 Correção dos Erros 400 (Bad Request) - Supabase

## ❌ **Erros Identificados**

```
POST https://wznycskqsavpmejwpksp.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
GET https://wznycskqsavpmejwpksp.supabase.co/rest/v1/bar_employees 400 (Bad Request)
```

## 🔍 **Possíveis Causas dos Erros 400**

### **1. Chave API Inválida/Expirada**
- A anon key pode estar expirada
- Chave copiada incorretamente
- Projeto regenerou as chaves

### **2. Projeto Supabase com Problemas**
- Projeto pausado por inatividade
- Projeto suspenso por limite de uso
- Configuração de billing

### **3. Políticas RLS Muito Restritivas**
- Row Level Security bloqueando tudo
- Políticas mal configuradas
- Sem permissões para anon

### **4. Configuração de CORS**
- Domínio não autorizado
- Headers bloqueados
- Configuração de Auth

## 🧪 **Diagnóstico Imediato**

### **Execute o arquivo de debug:**
1. Abra `debug-supabase-400-errors.html` no navegador
2. Execute todos os testes em sequência
3. Identifique qual teste falha primeiro

## 🔧 **Soluções por Causa**

### **Se for Chave API Expirada:**

1. **Acesse o Supabase Dashboard:**
   - Vá para https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto `wznycskqsavpmejwpksp`

2. **Obtenha novas chaves:**
   - Vá para Settings → API
   - Copie a nova `anon public` key
   - Copie a nova `service_role` key (se necessário)

3. **Atualize no código:**
   ```typescript
   // src/config/supabase.ts ou onde estiver
   const supabaseAnonKey = 'SUA_NOVA_CHAVE_AQUI';
   ```

### **Se for Projeto Pausado:**

1. **Verifique o status:**
   - No dashboard, veja se há avisos de projeto pausado
   - Verifique a aba "Settings" → "General"

2. **Reative o projeto:**
   - Se pausado, clique em "Resume project"
   - Aguarde alguns minutos para ativação

3. **Verifique billing:**
   - Vá para "Settings" → "Billing"
   - Verifique se não há problemas de pagamento

### **Se for Políticas RLS:**

1. **Desabilite RLS temporariamente:**
   ```sql
   -- No SQL Editor do Supabase
   ALTER TABLE bar_employees DISABLE ROW LEVEL SECURITY;
   ALTER TABLE usuarios_empresa DISABLE ROW LEVEL SECURITY;
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE permissoes_usuario DISABLE ROW LEVEL SECURITY;
   ```

2. **Teste novamente**

3. **Reabilite com políticas corretas:**
   ```sql
   -- Reabilitar RLS
   ALTER TABLE bar_employees ENABLE ROW LEVEL SECURITY;
   
   -- Criar política permissiva para teste
   CREATE POLICY "Allow all for authenticated users" ON bar_employees
   FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
   ```

### **Se for Configuração de Auth:**

1. **Verifique configurações de Auth:**
   - Dashboard → Authentication → Settings
   - Verifique se "Enable email confirmations" está adequado
   - Verifique "Site URL" e "Redirect URLs"

2. **Configurações recomendadas para desenvolvimento:**
   ```
   Site URL: http://localhost:3000
   Redirect URLs: http://localhost:3000/**
   Enable email confirmations: OFF (para desenvolvimento)
   ```

## 🚀 **Teste Rápido de Correção**

Após aplicar qualquer correção, teste com este código simples:

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
</head>
<body>
    <script>
        const supabase = window.supabase.createClient(
            'https://wznycskqsavpmejwpksp.supabase.co',
            'SUA_NOVA_CHAVE_AQUI'
        );

        // Teste básico
        supabase.from('bar_employees').select('count').limit(1)
            .then(result => {
                if (result.error) {
                    console.error('❌ Ainda com erro:', result.error);
                } else {
                    console.log('✅ Funcionando!', result);
                }
            });
    </script>
</body>
</html>
```

## 📋 **Checklist de Verificação**

- [ ] **Chaves API atualizadas** do dashboard
- [ ] **Projeto ativo** (não pausado)
- [ ] **Billing OK** (sem problemas de pagamento)
- [ ] **RLS configurado** corretamente ou desabilitado para teste
- [ ] **Auth configurado** para desenvolvimento
- [ ] **CORS configurado** para localhost

## 🎯 **Ação Imediata**

1. **Execute:** `debug-supabase-400-errors.html`
2. **Identifique:** Qual teste falha
3. **Acesse:** Dashboard do Supabase
4. **Verifique:** Status do projeto e chaves
5. **Atualize:** Configurações conforme necessário
6. **Teste:** Novamente

## 🔗 **Links Úteis**

- **Dashboard:** https://supabase.com/dashboard
- **Projeto:** https://supabase.com/dashboard/project/wznycskqsavpmejwpksp
- **Documentação:** https://supabase.com/docs/guides/auth
- **Status:** https://status.supabase.com/

---

**🚨 Execute o arquivo de debug primeiro para identificar a causa exata dos erros 400!**

**📞 Se os erros persistirem após todas as verificações, pode ser necessário contatar o suporte do Supabase.**