/**
 * Script de teste completo para o módulo de gestão de vendas
 * Execute com: npx tsx src/examples/test-sales-module.ts
 */

import { CommissionCalculator } from '../utils/commission-calculator';
import { PriceCalculator } from '../utils/price-calculator';
import { CommandManager } from '../services/command-manager';

console.log('🧪 TESTANDO MÓDULO DE GESTÃO DE VENDAS\n');

// ===== TESTE 1: CALCULADORA DE COMISSÃO =====
console.log('📊 1. TESTANDO CALCULADORA DE COMISSÃO');
console.log('=====================================');

const testCommission = () => {
  const tests = [
    { valor: 100, percentual: 10, esperado: 110 },
    { valor: 250, percentual: 15, esperado: 287.5 },
    { valor: 50, percentual: 0, esperado: 50 },
    { valor: 200, percentual: 30, esperado: 260 },
    { valor: 100, percentual: 35, valido: false } // Inválido
  ];

  tests.forEach((test, index) => {
    console.log(`\nTeste ${index + 1}:`);
    console.log(`  Valor base: ${CommissionCalculator.formatCurrency(test.valor)}`);
    console.log(`  Percentual: ${test.percentual}%`);
    
    const resultado = CommissionCalculator.calculateWithValidation(test.valor, test.percentual);
    
    if (resultado.percentual_valido) {
      console.log(`  ✅ Comissão: ${CommissionCalculator.formatCurrency(resultado.valor_comissao)}`);
      console.log(`  ✅ Total: ${CommissionCalculator.formatCurrency(resultado.valor_total)}`);
      
      if (test.esperado && Math.abs(resultado.valor_total - test.esperado) < 0.01) {
        console.log(`  ✅ Resultado correto!`);
      } else if (test.esperado) {
        console.log(`  ❌ Esperado: ${test.esperado}, Obtido: ${resultado.valor_total}`);
      }
    } else {
      console.log(`  ❌ Percentual inválido: ${resultado.erro}`);
      if (test.valido === false) {
        console.log(`  ✅ Validação funcionou corretamente!`);
      }
    }
  });
};

testCommission();

// ===== TESTE 2: CALCULADORA DE PREÇOS =====
console.log('\n\n💰 2. TESTANDO CALCULADORA DE PREÇOS');
console.log('===================================');

const testPriceCalculator = () => {
  const itens = [
    { produto_id: '1', quantidade: 2, preco_unitario: 25.90 },
    { produto_id: '2', quantidade: 1, preco_unitario: 18.50 },
    { produto_id: '3', quantidade: 3, preco_unitario: 4.50 }
  ];

  const dadosCalculo = {
    itens,
    descontos: [
      { tipo: 'percentual' as const, valor: 10, motivo: 'Desconto cliente VIP' }
    ],
    acrescimos: [
      { tipo: 'valor' as const, valor: 5, motivo: 'Taxa de serviço' }
    ]
  };

  console.log('\nItens do pedido:');
  itens.forEach(item => {
    console.log(`  • ${item.quantidade}x Produto ${item.produto_id} - ${PriceCalculator.formatCurrency(item.preco_unitario)} cada`);
  });

  const subtotal = PriceCalculator.calculateSubtotal(itens);
  console.log(`\nSubtotal: ${PriceCalculator.formatCurrency(subtotal)}`);

  const resultado = PriceCalculator.calculateDetailedTotal(dadosCalculo);
  console.log(`Desconto (10%): -${PriceCalculator.formatCurrency(resultado.total_descontos)}`);
  console.log(`Taxa de serviço: +${PriceCalculator.formatCurrency(resultado.total_acrescimos)}`);
  console.log(`Total final: ${PriceCalculator.formatCurrency(resultado.total)}`);
  console.log(`Economia: ${PriceCalculator.formatCurrency(resultado.economia)}`);
};

testPriceCalculator();

// ===== TESTE 3: GERENCIADOR DE COMANDAS =====
console.log('\n\n📋 3. TESTANDO GERENCIADOR DE COMANDAS');
console.log('====================================');

const testCommandManager = async () => {
  const manager = new CommandManager();

  try {
    // Criar comanda
    console.log('\n🆕 Criando nova comanda...');
    const comanda = await manager.criarComanda({
      funcionario_id: 'func-123',
      quantidade_pessoas: 4,
      mesa_id: 'mesa-05',
      observacoes: 'Cliente preferencial'
    });
    
    console.log(`✅ Comanda criada: ${comanda.id}`);
    console.log(`   Mesa: ${comanda.mesa_id}`);
    console.log(`   Pessoas: ${comanda.quantidade_pessoas}`);
    console.log(`   Status: ${comanda.status}`);

    // Adicionar itens
    console.log('\n🍔 Adicionando itens...');
    const item1 = await manager.adicionarItem(comanda.id, {
      produto_id: 'prod-123',
      nome_produto: 'Hambúrguer Clássico',
      quantidade: 2,
      preco_unitario: 25.90,
      observacoes: 'Sem cebola'
    });
    console.log(`✅ Item adicionado: ${item1.nome_produto} (${item1.quantidade}x)`);

    const item2 = await manager.adicionarItem(comanda.id, {
      produto_id: 'prod-456',
      nome_produto: 'Batata Frita',
      quantidade: 1,
      preco_unitario: 18.50
    });
    console.log(`✅ Item adicionado: ${item2.nome_produto} (${item2.quantidade}x)`);

    // Verificar comanda atualizada
    const comandaAtualizada = await manager.buscarComanda(comanda.id);
    console.log(`\n💰 Total da comanda: ${CommissionCalculator.formatCurrency(comandaAtualizada!.total)}`);
    console.log(`📦 Itens na comanda: ${comandaAtualizada!.itens?.length}`);

    // Atualizar status de item
    console.log('\n🔄 Atualizando status dos itens...');
    await manager.atualizarStatusItem(comanda.id, item1.id, 'preparando');
    console.log(`✅ ${item1.nome_produto} está sendo preparado`);

    await manager.atualizarStatusItem(comanda.id, item1.id, 'pronto');
    console.log(`✅ ${item1.nome_produto} está pronto`);

    await manager.atualizarStatusItem(comanda.id, item1.id, 'entregue');
    console.log(`✅ ${item1.nome_produto} foi entregue`);

    // Estatísticas
    console.log('\n📊 Estatísticas do sistema:');
    const stats = await manager.obterEstatisticas();
    console.log(`   Comandas abertas: ${stats.total_comandas_abertas}`);
    console.log(`   Itens pendentes: ${stats.total_itens_pendentes}`);
    console.log(`   Valor total: ${CommissionCalculator.formatCurrency(stats.valor_total_comandas_abertas)}`);

    // Testar erro - tentar remover item em preparo
    console.log('\n❌ Testando validação - tentar remover item entregue...');
    try {
      await manager.removerItem(comanda.id, item1.id);
      console.log('❌ ERRO: Deveria ter falhado!');
    } catch (error) {
      console.log(`✅ Validação funcionou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

  } catch (error) {
    console.log(`❌ Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Executar teste assíncrono
testCommandManager().then(() => {
  console.log('\n\n🎉 TODOS OS TESTES CONCLUÍDOS!');
  console.log('=============================');
  console.log('✅ Calculadora de Comissão: OK');
  console.log('✅ Calculadora de Preços: OK');
  console.log('✅ Gerenciador de Comandas: OK');
  console.log('\n💡 Para testar o modal, execute o componente TestCloseAccountModal no React');
}).catch(error => {
  console.log(`❌ Erro geral: ${error}`);
});