// SCRIPT PARA EXECUTAR NO CONSOLE DO NAVEGADOR
// Copie e cole este código no console (F12) e pressione Enter

console.log('🔧 Iniciando correção manual da tabela inventory_categories...');

// Função para fazer requisições diretas
async function makeDirectRequest(endpoint, options = {}) {
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

// Função principal de correção
async function fixCategoriesManual() {
  try {
    console.log('1️⃣ Verificando empresas...');
    const empresas = await makeDirectRequest('empresas?select=id,nome&limit=1');
    
    if (!empresas || empresas.length === 0) {
      console.error('❌ Nenhuma empresa encontrada');
      return false;
    }
    
    const empresaId = empresas[0].id;
    console.log('✅ Empresa encontrada:', empresas[0].nome, 'ID:', empresaId);

    console.log('2️⃣ Testando acesso à tabela inventory_categories...');
    
    try {
      const existing = await makeDirectRequest('inventory_categories?limit=1');
      console.log('✅ Tabela existe, categorias encontradas:', existing.length);
    } catch (err) {
      console.log('⚠️ Erro ao acessar tabela:', err.message);
    }

    console.log('3️⃣ Tentando criar categoria de teste...');
    
    const testCategory = {
      name: 'Teste_' + Date.now(),
      description: 'Categoria de teste',
      color: '#3B82F6',
      is_active: true
    };

    // Tentar com empresa_id
    try {
      const result1 = await makeDirectRequest('inventory_categories', {
        method: 'POST',
        body: JSON.stringify({...testCategory, empresa_id: empresaId})
      });
      console.log('✅ Sucesso com empresa_id:', result1);
      return true;
    } catch (err1) {
      console.log('❌ Falha com empresa_id:', err1.message);
      
      // Tentar sem empresa_id
      try {
        const result2 = await makeDirectRequest('inventory_categories', {
          method: 'POST',
          body: JSON.stringify(testCategory)
        });
        console.log('✅ Sucesso sem empresa_id:', result2);
        return true;
      } catch (err2) {
        console.log('❌ Falha sem empresa_id:', err2.message);
        
        // Tentar apenas com nome
        try {
          const result3 = await makeDirectRequest('inventory_categories', {
            method: 'POST',
            body: JSON.stringify({name: testCategory.name})
          });
          console.log('✅ Sucesso apenas com nome:', result3);
          return true;
        } catch (err3) {
          console.error('❌ Todas as tentativas falharam:', err3.message);
          return false;
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
    return false;
  }
}

// Executar correção
fixCategoriesManual().then(success => {
  if (success) {
    console.log('🎉 Correção concluída com sucesso!');
    console.log('💡 Agora tente criar uma categoria no sistema.');
  } else {
    console.log('❌ Correção falhou. Verifique os logs acima.');
  }
});