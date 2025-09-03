# Configuração do Banco de Dados

## ⚠️ IMPORTANTE: Configuração Necessária

Para que os produtos apareçam no Atendimento no Balcão, você precisa configurar o Supabase:

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Como obter as credenciais:

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login e selecione seu projeto (ou crie um novo)
3. Vá em **Settings** → **API**
4. Copie:
   - **Project URL** para `VITE_SUPABASE_URL`
   - **anon public** key para `VITE_SUPABASE_ANON_KEY`

### 3. Aplicar Migrações

Execute as migrações SQL que estão na pasta `supabase/migrations/`:

1. No painel do Supabase, vá em **SQL Editor**
2. Execute os arquivos na ordem:
   - `20250729000000_initial_schema.sql`
   - `20250831000001_menu_management_module.sql`
   - `20250901000001_direct_inventory_items_support.sql`
   - `20250901000002_bar_attendance_system.sql`
   - `20250902000001_inventory_available_for_sale.sql`

### 4. Adicionar Dados de Teste

Após configurar, você pode:

1. **Ir para Cozinha → Cardápio** e adicionar pratos
2. **Ir para Estoque** e adicionar produtos com "Disponível para venda" marcado
3. Os produtos aparecerão automaticamente no Balcão

### 5. Estado Atual

Sem configuração do Supabase, o sistema está mostrando dados de exemplo (mock).
Com Supabase configurado, os dados serão salvos e sincronizados em tempo real.

## Solucionando Problemas

### Produtos não aparecem no Balcão?

1. ✅ Verifique se o Supabase está configurado
2. ✅ Verifique se há itens cadastrados no menu (`is_available = true`)
3. ✅ Verifique o console do navegador para erros
4. ✅ Teste adicionar um item na Cozinha → Cardápio

### Dados de exemplo sendo mostrados?

- O sistema está funcionando em modo offline/demo
- Configure o Supabase para usar dados reais