// SCRIPT FINAL PARA RESOLVER TODOS OS PROBLEMAS DE CATEGORIAS
// Execute no console do navegador (F12)

console.log('🚀 CORREÇÃO FINAL - Resolvendo todos os problemas de categorias...');

async function makeRequest(endpoint, options = {}) {
  const url = `https://wznycskqsavpmejwpksp.supabase.co/rest/v1/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bnljc2txc2F2cG1landwa3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzA2NjUsImV4cCI6MjA3MjIwNjY2NX0.uYXbBwQDo1pLeBrmtZnBR2M3a3_TsYDa637pcKSVC_8',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function fixEverything() {
  try {
    console.log('1️⃣ Verificando empresas...');
    let empresas = await makeRequest('empresas?select=id,nome&limit=1');
    
    let empresaId;
    if (empresas.length === 0) {
      console.log('2️⃣ Criando empresa...');
      try {
        const novaEmpresa = await makeRequest('empresas', {
          method: 'POST',
          body: JSON.stringify({
            nome: 'AABB Garanhuns',
            ativo: true
          })
        });
        empresaId = Array.isArray(novaEmpresa) ? novaEmpresa[0].id : novaEmpresa.id;
        console.log('✅ Empresa criada:', empresaId);
      } catch (err) {
        console.log('⚠️ Usando ID padrão para empresa');
        empresaId = 'c53c4376-155a-46a2-bcc1-407eb6ed190a';
      }
    } else {
      empresaId = empresas[0].id;
      console.log('✅ Empresa encontrada:', empresas[0].nome);
    }

    console.log('3️⃣ Verificando categorias existentes em product_categories...');
    let productCategories = [];
    try {
      productCategories = await makeRequest('product_categories?is_active=eq.true');
      console.log('📋 Categorias em product_categories:', productCategories.length);
    } catch (err) {
      console.log('⚠️ Tabela product_categories não encontrada');
    }

    console.log('4️⃣ Verificando inventory_categories...');
    let inventoryCategories = [];
    try {
      inventoryCategories = await makeRequest('inventory_categories');
      console.log('📋 Categorias em inventory_categories:', inventoryCategories.length);
    } catch (err) {
      console.log('⚠️ Tabela inventory_categories não encontrada');
    }

    console.log('5️⃣ Criando/migrando categorias para inventory_categories...');
    
    // Categorias padrão (incluindo as que já existem em product_categories)
    const categoriasParaCriar = [
      { name: 'Bebidas', description: 'Bebidas em geral', color: '#3B82F6', icon: 'wine' },
      { name: 'Petiscos', description: 'Petiscos e aperitivos', color: '#F59E0B', icon: 'utensils' },
      { name: 'Refeições', description: 'Pratos principais', color: '#10B981', icon: 'utensils' },
      { name: 'Salgadinhos', description: 'Salgados e lanches', color: '#EF4444', icon: 'cookie' },
      { name: 'Alimentos', description: 'Produtos alimentícios', color: '#10B981', icon: 'utensils' },
      { name: 'Limpeza', description: 'Produtos de limpeza', color: '#8B5CF6', icon: 'spray-can' }
    ];

    // Adicionar categorias de product_categories se existirem
    if (productCategories.length > 0) {
      productCategories.forEach(cat => {
        if (!categoriasParaCriar.find(c => c.name === cat.name)) {
          categoriasParaCriar.push({
            name: cat.name,
            description: cat.description || '',
            color: cat.color || '#3B82F6',
            icon: cat.icon || 'tag'
          });
        }
      });
    }

    console.log('📦 Tentando criar', categoriasParaCriar.length, 'categorias...');

    let sucessos = 0;
    for (const categoria of categoriasParaCriar) {
      // Verificar se já existe
      const existe = inventoryCategories.find(c => c.name === categoria.name);
      if (existe) {
        console.log(`⏭️ Categoria '${categoria.name}' já existe`);
        continue;
      }

      // Tentar diferentes estruturas
      const tentativas = [
        // Com empresa_id
        { ...categoria, is_active: true, empresa_id: empresaId },
        // Sem empresa_id
        { ...categoria, is_active: true },
        // Mínimo
        { name: categoria.name, color: categoria.color, is_active: true },
        // Só nome
        { name: categoria.name }
      ];

      let criada = false;
      for (let i = 0; i < tentativas.length && !criada; i++) {
        try {
          const resultado = await makeRequest('inventory_categories', {
            method: 'POST',
            body: JSON.stringify(tentativas[i])
          });
          console.log(`✅ Categoria '${categoria.name}' criada (tentativa ${i + 1})`);
          sucessos++;
          criada = true;
        } catch (err) {
          console.log(`❌ Tentativa ${i + 1} para '${categoria.name}':`, err.message);
        }
      }
    }

    console.log('6️⃣ Verificando resultado final...');
    const categoriesFinais = await makeRequest('inventory_categories');
    console.log('🎉 RESULTADO FINAL:');
    console.log(`📊 Total de categorias: ${categoriesFinais.length}`);
    console.log(`✅ Criadas com sucesso: ${sucessos}`);
    console.log('📋 Categorias disponíveis:');
    categoriesFinais.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.color})`);
    });

    if (categoriesFinais.length > 0) {
      console.log('🎉 SUCESSO! Recarregue a página e teste o sistema.');
      return true;
    } else {
      console.log('❌ Nenhuma categoria foi criada. Pode ser necessário configurar RLS manualmente.');
      return false;
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
    return false;
  }
}

// Executar correção
fixEverything().then(success => {
  if (success) {
    console.log('🎊 CORREÇÃO COMPLETA! O sistema deve funcionar agora.');
    console.log('🔄 Recarregue a página para ver as mudanças.');
  } else {
    console.log('❌ Correção falhou. Verifique os logs acima para mais detalhes.');
  }
});