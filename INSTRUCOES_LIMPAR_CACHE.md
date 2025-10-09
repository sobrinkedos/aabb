# 🔄 Instruções para Limpar Cache e Aplicar Correções

## ⚠️ Problema Identificado

O código foi corrigido no arquivo `src/hooks/useBarEmployees.ts`, mas o navegador está usando a versão antiga (minificada) que ainda tem a simulação.

## ✅ Solução: Forçar Recompilação

### Opção 1: Parar e Reiniciar o Servidor (RECOMENDADO)

```bash
# 1. Parar o servidor de desenvolvimento (Ctrl+C)

# 2. Limpar cache do build
npm run clean
# ou
rm -rf .next
rm -rf dist
rm -rf build

# 3. Reinstalar dependências (opcional, mas recomendado)
npm install

# 4. Iniciar novamente
npm run dev
```

### Opção 2: Hard Refresh no Navegador

Após reiniciar o servidor:

**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` ou `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R` ou `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### Opção 3: Limpar Cache do Navegador Manualmente

1. Abra DevTools (F12)
2. Clique com botão direito no ícone de reload
3. Selecione "Empty Cache and Hard Reload"

---

## 🔍 Como Verificar se Funcionou

Após limpar o cache e recarregar, os logs devem mostrar:

```
✅ CORRETO (novo código):
📝 Criando registro na tabela employees...
✅ Employee criado: [uuid]
📝 Criando registro na tabela bar_employees...
✅ Bar employee criado: [uuid]
✅ Funcionário completo criado com sucesso!
```

```
❌ ERRADO (código antigo ainda em cache):
⚠️ Simulação de criação de employee devido a limitações de tipo
✅ Employee simulado criado
```

---

## 📊 Verificar no Banco de Dados

Após criar um funcionário, verifique no Supabase:

### Tabela `employees`:
```sql
SELECT * FROM employees 
WHERE empresa_id = 'seu-empresa-id'
ORDER BY created_at DESC 
LIMIT 5;
```

Deve mostrar o funcionário recém-criado com:
- `employee_code`: EMP-[timestamp]
- `name`: Nome do funcionário
- `email`: Email informado
- `empresa_id`: ID da sua empresa
- `status`: 'active'

### Tabela `bar_employees`:
```sql
SELECT * FROM bar_employees 
WHERE empresa_id = 'seu-empresa-id'
ORDER BY created_at DESC 
LIMIT 5;
```

Deve mostrar o registro com:
- `employee_id`: UUID do employee criado (não null!)
- `bar_role`: Função escolhida
- `is_active`: true

---

## 🐛 Se Ainda Não Funcionar

### 1. Verificar Permissões no Supabase

Verifique se o usuário tem permissão para inserir em `employees`:

```sql
-- No Supabase SQL Editor
SELECT * FROM employees LIMIT 1;
```

Se der erro de permissão, adicione política RLS:

```sql
-- Permitir inserção em employees
CREATE POLICY "Usuários podem criar employees"
ON employees FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir leitura em employees
CREATE POLICY "Usuários podem ler employees"
ON employees FOR SELECT
TO authenticated
USING (true);
```

### 2. Verificar Estrutura da Tabela

```sql
-- Verificar colunas da tabela employees
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees'
ORDER BY ordinal_position;
```

Colunas necessárias:
- `id` (uuid, PK)
- `employee_code` (text)
- `name` (text)
- `email` (text, nullable)
- `phone` (text, nullable)
- `cpf` (text, nullable)
- `empresa_id` (uuid)
- `status` (text)
- `tem_acesso_sistema` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. Verificar Logs Completos

Abra o console do navegador (F12) e procure por:
- Erros em vermelho
- Mensagens de "❌ Erro ao criar employee"
- Detalhes do erro do Supabase

---

## 📝 Checklist de Verificação

- [ ] Parei o servidor de desenvolvimento
- [ ] Limpei o cache do build (rm -rf .next/dist/build)
- [ ] Reiniciei o servidor (npm run dev)
- [ ] Fiz hard refresh no navegador (Ctrl+Shift+R)
- [ ] Verifiquei os logs no console
- [ ] Logs mostram "Criando registro na tabela employees"
- [ ] Funcionário aparece na tabela employees do Supabase
- [ ] Funcionário aparece na tabela bar_employees do Supabase
- [ ] Funcionário aparece na lista da interface

---

## 🆘 Suporte

Se após seguir todos os passos o problema persistir:

1. Copie os logs completos do console
2. Copie o erro do Supabase (se houver)
3. Verifique se as tabelas existem no banco
4. Verifique as políticas RLS

---

**Última atualização:** 08/01/2025  
**Versão do código:** 1.0 (corrigido)
