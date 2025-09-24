# Scripts de Reset do Sistema de Funcionários

Este diretório contém scripts para zerar completamente o sistema de funcionários, removendo todos os dados relacionados.

## ⚠️ ATENÇÃO - OPERAÇÃO IRREVERSÍVEL

**ESTES SCRIPTS REMOVEM PERMANENTEMENTE:**
- Todos os funcionários cadastrados
- Todas as permissões de usuários
- Credenciais de acesso dos funcionários
- Histórico de atividades
- Sessões ativas

## 📁 Arquivos Disponíveis

### 1. `reset-employee-system.sql`
**Script SQL completo** - Remove TUDO, incluindo administradores
```sql
-- Execute no Supabase SQL Editor ou psql
\i scripts/reset-employee-system.sql
```

### 2. `reset-employee-system-safe.sql`
**Script SQL seguro** - Preserva o usuário administrador principal
```sql
-- Execute no Supabase SQL Editor ou psql
\i scripts/reset-employee-system-safe.sql
```

### 3. `reset-employee-system.ts`
**Script TypeScript** - Para execução via código
```bash
# Simulação (não remove dados)
npm run reset-employees -- --dry-run

# Execução real preservando admin
npm run reset-employees

# Execução completa (remove tudo)
npm run reset-employees --no-preserve-admin
```

### 4. `reset-daily-cash-summary.sql`
**Script específico** - Remove apenas daily_cash_summary
```sql
\i scripts/reset-daily-cash-summary.sql
```

### 5. `reset-menu-empresas.sql`
**Script específico** - Remove menu_itens e empresas
```sql
\i scripts/reset-menu-empresas.sql
```

### 6. `ResetEmployeeSystem.tsx`
**Componente React** - Interface visual para administradores

## 🚀 Como Usar

### Opção 1: Via SQL (Recomendado)

1. **Backup primeiro:**
   ```bash
   pg_dump -h seu-host -U postgres -d seu-banco > backup-antes-reset.sql
   ```

2. **Execute o script seguro:**
   - Acesse o Supabase Dashboard
   - Vá em SQL Editor
   - Cole o conteúdo de `reset-employee-system-safe.sql`
   - Execute

### Opção 2: Via TypeScript

1. **Configure as variáveis de ambiente:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua-url
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico
   ```

2. **Execute o script:**
   ```bash
   # Primeiro simule
   npx tsx scripts/reset-employee-system.ts --dry-run
   
   # Depois execute
   npx tsx scripts/reset-employee-system.ts
   ```

### Opção 3: Via Interface React

1. **Importe o componente:**
   ```tsx
   import { ResetEmployeeSystem } from '@/components/Admin/ResetEmployeeSystem';
   
   // Em uma página de admin
   <ResetEmployeeSystem />
   ```

2. **Use a interface:**
   - Clique em "Simular Reset" primeiro
   - Configure se quer preservar admin
   - Execute o reset

## 🛡️ Medidas de Segurança

### Antes de Executar:
- [ ] Fazer backup completo do banco
- [ ] Confirmar que está em ambiente de desenvolvimento
- [ ] Verificar se não há dados importantes
- [ ] Executar simulação primeiro

### Durante a Execução:
- [ ] Verificar logs de erro
- [ ] Confirmar preservação do admin (se aplicável)
- [ ] Monitorar contadores de registros

### Após a Execução:
- [ ] Verificar se admin ainda consegue fazer login
- [ ] Confirmar que tabelas estão vazias
- [ ] Testar criação de novo funcionário

## 📊 Tabelas Afetadas

| Tabela | Descrição | Ação |
|--------|-----------|------|
| `permissoes_usuario` | Permissões por usuário | TRUNCATE |
| `bar_employees` | Funcionários do bar | TRUNCATE |
| `usuarios_empresa` | Usuários da empresa | DELETE seletivo |
| `daily_cash_summary` | Resumos diários de caixa | TRUNCATE |
| `menu_itens` | Itens do menu | TRUNCATE |
| `empresas` | Dados das empresas | TRUNCATE (⚠️ CUIDADO!) |
| `auth.users` | Usuários Supabase | DELETE seletivo |
| `auth.sessions` | Sessões ativas | DELETE seletivo |
| `auth.refresh_tokens` | Tokens de refresh | DELETE seletivo |

## 🔄 Recuperação

Se algo der errado:

1. **Restaurar backup:**
   ```bash
   psql -h seu-host -U postgres -d seu-banco < backup-antes-reset.sql
   ```

2. **Recriar admin se necessário:**
   ```sql
   -- Via Supabase Dashboard > Authentication > Users
   -- Ou via SQL se tiver acesso direto
   ```

## 📝 Logs e Debugging

### Verificar o que foi removido:
```sql
-- Contar registros restantes
SELECT 
    'permissoes_usuario' as tabela, COUNT(*) as registros
FROM permissoes_usuario
UNION ALL
SELECT 'bar_employees', COUNT(*) FROM bar_employees
UNION ALL
SELECT 'usuarios_empresa', COUNT(*) FROM usuarios_empresa
UNION ALL
SELECT 'daily_cash_summary', COUNT(*) FROM daily_cash_summary
UNION ALL
SELECT 'menu_itens', COUNT(*) FROM menu_itens
UNION ALL
SELECT 'empresas', COUNT(*) FROM empresas;
```

### Verificar usuários restantes:
```sql
SELECT 
    nome_completo, 
    email, 
    tipo_usuario, 
    is_primeiro_usuario
FROM usuarios_empresa;
```

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de erro
2. Confirme as permissões do banco
3. Verifique se as chaves do Supabase estão corretas
4. Entre em contato com o time de desenvolvimento

---

**⚠️ LEMBRE-SE: Esta operação é IRREVERSÍVEL. Use com extrema cautela!**