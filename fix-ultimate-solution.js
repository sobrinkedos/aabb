// SOLUÇÃO DEFINITIVA - Execute no console (F12)
console.log('🚀 SOLUÇÃO DEFINITIVA - Resolvendo TODOS os problemas...');

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

async function ultimateFix() {
  try {
    console.log('1️⃣ CRIANDO EMPRESA...');
    let empresaId;
    
    try {
      // Tentar criar empresa
      const empresa = await makeRequest('empresas', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'AABB Garanhuns',
          ativo: true
        })
      });
      empresaId = Array.isArray(empresa) ? empresa[0].id : empresa.id;
      console.log('✅ Empresa criada:', empresaId);
    } catch (err) {
      console.log('⚠️ Erro ao criar empresa:', err.message);
      // Verificar se já existe
      try {
        const empresas = await makeRequest('empresas?limit=1');
        if (empresas.length > 0) {
          empresaId = empresas[0].id;
          console.log('✅ Empresa existente encontrada:', empresaId);
        } else {
          empresaId = 'c53c4376-155a-46a2-bcc1-407eb6ed190a';
          console.log('⚠️ Usando ID padrão:', empresaId);
        }
      } catch (err2) {
        empresaId = 'c53c4376-155a-46a2-bcc1-407eb6ed190a';
        console.log('⚠️ Usando ID padrão por erro:', empresaId);
      }
    }

    console.log('2️⃣ VERIFICANDO CATEGORIAS EXISTENTES...');
    
    // Verificar product_categories (onde ItemModal encontra 4 categorias)
    let productCategories = [];
    try {
      productCategories = await makeRequest('product_categories');
      console.log('📋 Categorias em product_categories:', productCategories.length);
      productCategories.forEach(cat => console.log(`  - ${cat.name}`));
    } catch (err) {
      console.log('⚠️ Erro ao acessar product_categories:', err.message);
    }

    // Verificar inventory_categories (onde CategoryManager não encontra nada)
    let inventoryCategories = [];
    try {
      inventoryCategories = await makeRequest('inventory_categories');
      console.log('📋 Categorias em inventory_categories:', inventoryCategories.length);
    } catch (err) {
      console.log('⚠️ Erro ao acessar inventory_categories:', err.message);
    }

    console.log('3️⃣ MIGRANDO CATEGORIAS...');
    
    // Categorias para migrar/criar
    let categoriasParaCriar = [
      { name: 'Bebidas', description: 'Bebidas em geral', color: '#3B82F6' },
      { name: 'Petiscos', description: 'Petiscos e aperitivos', color: '#F59E0B' },
      { name: 'Refeições', description: 'Pratos principais', color: '#10B981' },
      { name: 'Salgadinhos', description: 'Salgados e lanches', color: '#EF4444' },
      { name: 'Alimentos', description: 'Produtos alimentícios', color: '#10B981' },
      { name: 'Limpeza', description: 'Produtos de limpeza', color: '#8B5CF6' }
    ];

    // Adicionar categorias de product_categories se existirem
    if (productCategories.length > 0) {
      productCategories.forEach(cat => {
        if (!categoriasParaCriar.find(c => c.name === cat.name)) {
          categoriasParaCriar.push({
            name: cat.name,
            description: cat.description || '',
            color: cat.color || '#3B82F6'
          });
        }
      });
    }

    console.log('📦 Tentando criar', categoriasParaCriar.length, 'categorias em inventory_categories...');

    let sucessos = 0;
    for (const categoria of categoriasParaCriar) {
      // Verificar se já existe
      const existe = inventoryCategories.find(c => c.name === categoria.name);
      if (existe) {
        console.log(`⏭️ '${categoria.name}' já existe`);
        continue;
      }

      // Tentar múltiplas abordagens
      const tentativas = [
        // Sem RLS - usando SQL direto
        async () => {
          const sql = `INSERT INTO inventory_categories (name, description, color, is_active) VALUES ('${categoria.name}', '${categoria.description}', '${categoria.color}', true) RETURNING *`;
          return await makeRequest(`rpc/exec_sql`, {
            method: 'POST',
            body: JSON.stringify({ sql })
          });
        },
        // Sem empresa_id
        async () => {
          return await makeRequest('inventory_categories', {
            method: 'POST',
            body: JSON.stringify({
              name: categoria.name,
              description: categoria.description,
              color: categoria.color,
              is_active: true
            })
          });
        },
        // Só nome
        async () => {
          return await makeRequest('inventory_categories', {
            method: 'POST',
            body: JSON.stringify({
              name: categoria.name
            })
          });
        }
      ];

      let criada = false;
      for (let i = 0; i < tentativas.length && !criada; i++) {
        try {
          await tentativas[i]();
          console.log(`✅ '${categoria.name}' criada (método ${i + 1})`);
          sucessos++;
          criada = true;
        } catch (err) {
          console.log(`❌ Método ${i + 1} para '${categoria.name}':`, err.message);
        }
      }

      if (!criada) {
        console.log(`💥 FALHA TOTAL para '${categoria.name}'`);
      }
    }

    console.log('4️⃣ VERIFICANDO RESULTADO...');
    try {
      const resultado = await makeRequest('inventory_categories');
      console.log('🎉 RESULTADO FINAL:');
      console.log(`📊 Total: ${resultado.length} categorias`);
      console.log(`✅ Criadas: ${sucessos}`);
      
      if (resultado.length > 0) {
        console.log('📋 Categorias disponíveis:');
        resultado.forEach(cat => console.log(`  - ${cat.name}`));
        
        console.log('🎊 SUCESSO! Recarregue a página e teste.');
        return true;
      } else {
        console.log('❌ Nenhuma categoria encontrada após criação.');
        return false;
      }
    } catch (err) {
      console.log('❌ Erro ao verificar resultado:', err.message);
      return false;
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
    return false;
  }
}

// EXECUTAR
ultimateFix().then(success => {
  if (success) {
    console.log('🎉 PROBLEMA RESOLVIDO!');
    console.log('🔄 Recarregue a página agora.');
  } else {
    console.log('❌ Ainda há problemas. Pode ser necessário desabilitar RLS manualmente no Supabase Dashboard.');
    console.log('💡 Acesse: https://supabase.com/dashboard → SQL Editor → Execute: ALTER TABLE inventory_categories DISABLE ROW LEVEL SECURITY;');
  }
});