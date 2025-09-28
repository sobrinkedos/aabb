# 🧪 Guia de Teste - Sistema de Categorias

## ✅ Status da Implementação

**Branch:** `desenvolvimento`  
**Tabela:** `product_categories` ✅ Criada  
**Categorias padrão:** ✅ Inseridas (5 categorias)  
**Componentes:** ✅ Implementados  
**Rota:** ✅ `/products` configurada  

## 🎯 Como Testar

### 1. Acessar a Página de Produtos
```
URL: http://localhost:3000/products
```
- Deve aparecer no menu lateral como "Produtos" com ícone de tag
- Página mostra dashboard com estatísticas mockadas
- Botão "Categorias" no canto superior direito

### 2. Testar Gerenciador de Categorias

**Via Página de Produtos:**
1. Clique no botão "Categorias" 
2. Modal fullscreen deve abrir
3. Deve mostrar 5 categorias padrão:
   - Eletrônicos (Azul)
   - Roupas (Vermelho) 
   - Casa e Jardim (Verde)
   - Esportes (Amarelo)
   - Livros (Roxo)

**Via Modal de Estoque:**
1. Vá para "Estoque" no menu
2. Clique em "Novo Item"
3. Na seção "Categoria", clique no botão pequeno "Categorias"

### 3. Testar CRUD de Categorias

**Criar Nova Categoria:**
1. No gerenciador, clique "Nova Categoria"
2. Preencha:
   - Nome: "Bebidas"
   - Descrição: "Bebidas e líquidos"
   - Cor: Escolha uma cor (ex: #06B6D4)
3. Clique "Criar"
4. Categoria deve aparecer na lista

**Editar Categoria:**
1. Clique no ícone de lápis em qualquer categoria
2. Modifique o nome ou cor
3. Clique "Atualizar"
4. Mudanças devem ser salvas

**Excluir Categoria:**
1. Clique no ícone de lixeira
2. Confirme a exclusão
3. Categoria deve desaparecer da lista

### 4. Testar Integração com Estoque

**Seletor de Categorias:**
1. Vá para "Estoque" → "Novo Item"
2. No campo "Categoria", deve aparecer dropdown
3. Deve listar todas as categorias ativas
4. Botão "Atualizar categorias" deve recarregar a lista

## 🔍 Pontos de Verificação

### ✅ Interface
- [ ] Modal abre e fecha corretamente
- [ ] Cores das categorias aparecem nos cards
- [ ] Botões de ação (editar/excluir) funcionam
- [ ] Loading states aparecem durante operações
- [ ] Formulário valida campos obrigatórios

### ✅ Funcionalidade
- [ ] Criar categoria salva no banco
- [ ] Editar categoria atualiza dados
- [ ] Excluir categoria faz soft delete (is_active = false)
- [ ] Categorias aparecem no seletor do modal de estoque
- [ ] Atualizar categorias recarrega a lista

### ✅ Responsividade
- [ ] Modal funciona em mobile
- [ ] Grid de categorias se adapta ao tamanho da tela
- [ ] Botões ficam acessíveis em telas pequenas

## 🐛 Possíveis Problemas

### Erro de Permissão RLS
Se aparecer erro de permissão:
```sql
-- Execute no SQL Editor do Supabase:
SELECT * FROM product_categories WHERE is_active = true;
```

### Categorias não aparecem
1. Verifique se está no branch `desenvolvimento`
2. Confirme se a migração foi aplicada
3. Verifique se o usuário está autenticado

### Modal não abre
1. Verifique o console do navegador
2. Confirme se não há erros de importação
3. Teste em modo incógnito

## 📊 Dados de Teste

### Categorias Padrão Criadas:
```json
[
  {
    "name": "Eletrônicos",
    "description": "Produtos eletrônicos e tecnologia", 
    "color": "#3B82F6",
    "icon": "laptop"
  },
  {
    "name": "Roupas",
    "description": "Vestuário e acessórios",
    "color": "#EF4444", 
    "icon": "shirt"
  },
  {
    "name": "Casa e Jardim",
    "description": "Produtos para casa e jardim",
    "color": "#10B981",
    "icon": "home"
  },
  {
    "name": "Esportes", 
    "description": "Artigos esportivos e fitness",
    "color": "#F59E0B",
    "icon": "dumbbell"
  },
  {
    "name": "Livros",
    "description": "Livros e material educativo",
    "color": "#8B5CF6",
    "icon": "book"
  }
]
```

## 🚀 Próximos Passos

Após testar as categorias:

1. **Integrar com Produtos Reais:**
   - Criar tabela `products` 
   - Referenciar `product_categories`

2. **Melhorar UX:**
   - Adicionar busca nas categorias
   - Implementar drag & drop para reordenar
   - Adicionar bulk operations

3. **Relatórios:**
   - Produtos por categoria
   - Categorias mais utilizadas

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Confirme se está no branch correto: `git branch`
3. Verifique se as migrações foram aplicadas no Supabase

---

**Última atualização:** 28/09/2025  
**Status:** ✅ Pronto para teste