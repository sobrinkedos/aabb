// SCRIPT COMPLETO PARA RESOLVER TODOS OS PROBLEMAS
// Execute no console do navegador (F12)

console.log('🚀 Iniciando configuração completa do sistema...');

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

async function setupComplete() {
  try {
    console.log('1️⃣ Verificando empresas existentes...');
    let empresas = await makeRequest('empresas?select=id,nome&limit=1');
    console.log('📊 Empresas encontradas:', empresas.length);

    let empresaId;
    
    if (empresas.length === 0) {
      console.log('2️⃣ Criando empresa padrão...');
      
      const novaEmpresa = {
        nome: 'AABB Garanhuns',
        cnpj: '12345678000199',
        endereco: 'Rua Principal, 123',
        telefone: '(87) 99999-9999',
        email: 'contato@aabbgaranhuns.com.br',
        ativo: true
      };

      try {
        const empresaCriada = await makeRequest('empresas', {
          method: 'POST',
          body: JSON.stringify(novaEmpresa)
        });
        
        empresaId = Array.isArray(empresaCriada) ? empresaCriada[0].id : empresaCriada.id;
        console.log('✅ Empresa criada:', empresaId);
        
      } catch (err) {
        console.log('⚠️ Erro ao criar empresa, tentando sem alguns campos:', err.message);
        
        // Tentar com estrutura mínima
        try {
          const empresaMinima = await makeRequest('empresas', {
            method: 'POST',
            body: JSON.stringify({
              nome: 'AABB Garanhuns',
              ativo: true
            })
          });
          
          empresaId = Array.isArray(empresaMinima) ? empresaMinima[0].id : empresaMinima.id;
          console.log('✅ Empresa criada (mínima):', empresaId);
          
        } catch (err2) {
          console.log('❌ Falha ao criar empresa:', err2.message);
          // Usar ID padrão
          empresaId = 'c53c4376-155a-46a2-bcc1-407eb6ed190a';
          console.log('⚠️ Usando ID padrão:', empresaId);
        }
      }
    } else {
      empresaId = empresas[0].id;
      console.log('✅ Empresa existente encontrada:', empresas[0].nome, 'ID:', empresaId);
    }

    console.log('3️⃣ Testando criação de categoria...');
    
    const categoriasTeste = [
      // Tentativa com empresa_id
      {
        name: 'Bebidas',
        description: 'Bebidas em geral',
        color: '#3B82F6',
        icon: 'wine',
        is_active: true,
        empresa_id: empresaId
      },
      // Tentativa sem empresa_id
      {
        name: 'Bebidas',
        description: 'Bebidas em geral', 
        color: '#3B82F6',
        icon: 'wine',
        is_active: true
      },
      // Tentativa mínima
      {
        name: 'Bebidas',
        is_active: true
      },
      // Só nome
      {
        name: 'Bebidas'
      }
    ];

    for (let i = 0; i < categoriasTeste.length; i++) {
      try {
        console.log(`📤 Tentativa ${i + 1}:`, categoriasTeste[i]);
        
        const resultado = await makeRequest('inventory_categories', {
          method: 'POST',
          body: JSON.stringify(categoriasTeste[i])
        });
        
        console.log('🎉 SUCESSO! Categoria criada:', resultado);
        
        // Se funcionou, criar mais categorias
        const outrasCategories = [
          { name: 'Alimentos', color: '#10B981', icon: 'utensils' },
          { name: 'Limpeza', color: '#F59E0B', icon: 'spray-can' }
        ];
        
        for (const cat of outrasCategories) {
          try {
            const estruturaFuncional = { ...categoriasTeste[i], ...cat };
            delete estruturaFuncional.name; // Remove nome antigo
            estruturaFuncional.name = cat.name; // Adiciona novo nome
            
            const outraCategoria = await makeRequest('inventory_categories', {
              method: 'POST',
              body: JSON.stringify(estruturaFuncional)
            });
            
            console.log('✅ Categoria adicional criada:', cat.name);
          } catch (err) {
            console.log('⚠️ Erro ao criar categoria adicional:', cat.name, err.message);
          }
        }
        
        return true; // Sucesso!
        
      } catch (err) {
        console.log(`❌ Tentativa ${i + 1} falhou:`, err.message);
        
        if (i === categoriasTeste.length - 1) {
          console.log('💥 Todas as tentativas falharam');
          return false;
        }
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
    return false;
  }
}

// Executar
setupComplete().then(success => {
  if (success) {
    console.log('🎉 CONFIGURAÇÃO COMPLETA! Agora tente criar uma categoria no sistema.');
    console.log('🔄 Recarregue a página se necessário.');
  } else {
    console.log('❌ Configuração falhou. Pode ser necessário configurar manualmente no Supabase Dashboard.');
  }
});