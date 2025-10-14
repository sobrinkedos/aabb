import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Save, Search, X, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

interface ItemCompra {
  id: string;
  selecionado: boolean;
  quantidadeComprada: number;
  valorUnitario: number;
  valorTotal: number;
}

const AtualizacaoMassiva: React.FC = () => {
  const navigate = useNavigate();
  const { inventory, inventoryCategories, loadFullInventory } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [itensCompra, setItensCompra] = useState<Record<string, ItemCompra>>({});
  const [salvando, setSalvando] = useState(false);

  const inventarioFiltrado = useMemo(() => {
    return inventory.filter(item => {
      const matchNome = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = !categoriaFiltro || item.categoryId === categoriaFiltro;
      return matchNome && matchCategoria;
    });
  }, [inventory, searchTerm, categoriaFiltro]);

  const itensSelecionados = useMemo(() => {
    return Object.values(itensCompra).filter(item => item.selecionado);
  }, [itensCompra]);

  const valorTotalCompras = useMemo(() => {
    return itensSelecionados.reduce((total, item) => total + item.valorTotal, 0);
  }, [itensSelecionados]);

  const handleSelecionarItem = (itemId: string, selecionado: boolean) => {
    setItensCompra(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        id: itemId,
        selecionado,
        quantidadeComprada: prev[itemId]?.quantidadeComprada || 1,
        valorUnitario: prev[itemId]?.valorUnitario || 0,
        valorTotal: prev[itemId]?.valorTotal || 0,
      }
    }));
  };

  const handleAtualizarQuantidade = (itemId: string, quantidade: number) => {
    if (quantidade < 0) return;

    setItensCompra(prev => {
      const item = prev[itemId] || { id: itemId, selecionado: false, quantidadeComprada: 0, valorUnitario: 0, valorTotal: 0 };
      const novoValorTotal = quantidade * item.valorUnitario;

      return {
        ...prev,
        [itemId]: {
          ...item,
          quantidadeComprada: quantidade,
          valorTotal: novoValorTotal,
        }
      };
    });
  };

  const handleAtualizarValorUnitario = (itemId: string, valor: number) => {
    if (valor < 0) return;

    setItensCompra(prev => {
      const item = prev[itemId] || { id: itemId, selecionado: false, quantidadeComprada: 0, valorUnitario: 0, valorTotal: 0 };
      const novoValorTotal = item.quantidadeComprada * valor;

      return {
        ...prev,
        [itemId]: {
          ...item,
          valorUnitario: valor,
          valorTotal: novoValorTotal,
        }
      };
    });
  };

  const handleSalvarAtualizacoes = async () => {
    setSalvando(true);

    try {
      console.log('🚀 Iniciando atualização massiva...');
      console.log('📋 Itens selecionados:', itensSelecionados);

      // Buscar usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Você precisa estar logado para atualizar o estoque.');
        setSalvando(false);
        return;
      }

      // Buscar dados atualizados do banco antes de salvar
      const { data: itensAtuais, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .in('id', itensSelecionados.map(i => i.id));

      if (fetchError) {
        console.error('❌ Erro ao buscar itens atuais:', fetchError);
        alert('Erro ao buscar dados atualizados. Tente novamente.');
        setSalvando(false);
        return;
      }

      console.log('✅ Itens do banco:', itensAtuais);

      // Pegar empresa_id do primeiro item
      const empresaId = itensAtuais?.[0]?.empresa_id;
      if (!empresaId) {
        alert('Erro ao identificar a empresa dos itens.');
        setSalvando(false);
        return;
      }

      const promises = itensSelecionados.map(async (itemCompra) => {
        // Usar dados do banco, não do estado local
        const itemAtual = itensAtuais?.find(i => i.id === itemCompra.id);
        if (!itemAtual) {
          console.error('❌ Item não encontrado no banco:', itemCompra.id);
          return;
        }

        const estoqueAtualDoBanco = itemAtual.current_stock;
        const novoEstoque = estoqueAtualDoBanco + itemCompra.quantidadeComprada;
        const novoCusto = itemCompra.valorUnitario > 0 ? itemCompra.valorUnitario : itemAtual.cost;

        console.log(`📦 Atualizando ${itemAtual.name}:`, {
          estoqueAtual: estoqueAtualDoBanco,
          quantidadeComprada: itemCompra.quantidadeComprada,
          novoEstoque: novoEstoque,
          formula: `${estoqueAtualDoBanco} + ${itemCompra.quantidadeComprada} = ${novoEstoque}`
        });

        // Atualizar diretamente no banco para evitar duplicação de cálculo
        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({
            current_stock: novoEstoque,
            cost: novoCusto,
            last_updated: new Date().toISOString()
          })
          .eq('id', itemAtual.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${itemAtual.name}:`, updateError);
          throw updateError;
        }

        console.log(`✅ ${itemAtual.name} atualizado com sucesso!`);
      });

      await Promise.all(promises);

      console.log('✅ Todos os itens foram atualizados com sucesso!');

      // Registrar movimentações de estoque (sem alterar o estoque, apenas para histórico)
      console.log('📝 Registrando movimentações no histórico...');
      const movimentacoesPromises = itensSelecionados.map(async (itemCompra) => {
        const itemAtual = itensAtuais?.find(i => i.id === itemCompra.id);
        if (!itemAtual) return;

        const estoqueAnterior = itemAtual.current_stock;
        const estoqueNovo = estoqueAnterior + itemCompra.quantidadeComprada;

        try {
          // Inserir diretamente na tabela de movimentações (sem trigger)
          const { error: movError } = await supabase
            .from('inventory_movements')
            .insert({
              inventory_item_id: itemCompra.id,
              movement_type: 'entrada_compra',
              quantity: itemCompra.quantidadeComprada,
              unit_cost: itemCompra.valorUnitario > 0 ? itemCompra.valorUnitario : (itemAtual.cost || 0),
              stock_before: estoqueAnterior,
              stock_after: estoqueNovo,
              notes: `Atualização massiva - Compra de ${itemCompra.quantidadeComprada} ${itemAtual.unit}`,
              created_by: user.id,
              empresa_id: empresaId,
              created_at: new Date().toISOString()
            });

          if (movError) {
            console.error('⚠️ Erro ao registrar movimentação:', movError);
          } else {
            console.log(`✅ Movimentação registrada para ${itemAtual.name}`);
          }
        } catch (error) {
          console.error('⚠️ Erro ao registrar movimentação:', error);
        }
      });

      await Promise.all(movimentacoesPromises);

      // Limpar seleções após salvar
      setItensCompra({});

      // Recarregar inventário do contexto para refletir as mudanças
      await loadFullInventory();

      alert(`${itensSelecionados.length} itens atualizados com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      alert('Erro ao atualizar estoque. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const getItemCompra = (itemId: string): ItemCompra => {
    return itensCompra[itemId] || {
      id: itemId,
      selecionado: false,
      quantidadeComprada: 1,
      valorUnitario: 0,
      valorTotal: 0,
    };
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Atualização Massiva de Estoque</h1>
            <p className="text-gray-600">
              Selecione os itens comprados e atualize o estoque em lote
            </p>
          </div>
        </div>

        {itensSelecionados.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSalvarAtualizacoes}
            disabled={salvando}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save size={20} />
            <span>{salvando ? 'Salvando...' : `Salvar ${itensSelecionados.length} Itens`}</span>
          </motion.button>
        )}
      </motion.div>

      {/* Filtros e Ações Rápidas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as categorias</option>
            {inventoryCategories.map(categoria => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const itensEstoqueBaixo = inventarioFiltrado.filter(item => item.currentStock <= item.minStock);
              const novosItens = { ...itensCompra };

              itensEstoqueBaixo.forEach(item => {
                const quantidadeSugerida = Math.max(item.minStock * 2 - item.currentStock, item.minStock);
                novosItens[item.id] = {
                  id: item.id,
                  selecionado: true,
                  quantidadeComprada: quantidadeSugerida,
                  valorUnitario: item.cost || 0,
                  valorTotal: quantidadeSugerida * (item.cost || 0),
                };
              });

              setItensCompra(novosItens);
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Package size={16} />
            <span>Selecionar Estoque Baixo</span>
          </button>

          <button
            onClick={() => setItensCompra({})}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <X size={16} />
            <span>Limpar Seleção</span>
          </button>
        </div>
      </div>

      {/* Resumo */}
      {itensSelecionados.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{itensSelecionados.length}</p>
              <p className="text-blue-800 text-sm">Itens Selecionados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {itensSelecionados.reduce((total, item) => total + item.quantidadeComprada, 0)}
              </p>
              <p className="text-blue-800 text-sm">Quantidade Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">R$ {valorTotalCompras.toFixed(2)}</p>
              <p className="text-blue-800 text-sm">Valor Total</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Produtos Disponíveis ({inventarioFiltrado.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selecionar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Atual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade Comprada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Unitário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Novo Estoque
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventarioFiltrado.map((item) => {
                const itemCompra = getItemCompra(item.id);
                const categoria = inventoryCategories.find(cat => cat.id === item.categoryId);
                const novoEstoque = item.currentStock + (itemCompra.selecionado ? itemCompra.quantidadeComprada : 0);

                return (
                  <tr key={item.id} className={itemCompra.selecionado ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={itemCompra.selecionado}
                        onChange={(e) => handleSelecionarItem(item.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{categoria?.name}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${item.currentStock <= item.minStock ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {item.currentStock} {item.unit}
                      </span>
                      {item.currentStock <= item.minStock && (
                        <div className="text-xs text-red-500">Estoque baixo</div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {itemCompra.selecionado ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAtualizarQuantidade(item.id, itemCompra.quantidadeComprada - 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={itemCompra.quantidadeComprada}
                            onChange={(e) => handleAtualizarQuantidade(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAtualizarQuantidade(item.id, itemCompra.quantidadeComprada + 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus size={16} />
                          </button>
                          <span className="text-sm text-gray-500">{item.unit}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {itemCompra.selecionado ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={itemCompra.valorUnitario}
                            onChange={(e) => handleAtualizarValorUnitario(item.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="0,00"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {itemCompra.selecionado ? (
                        <span className="text-sm font-medium text-gray-900">
                          R$ {itemCompra.valorTotal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${itemCompra.selecionado ? 'text-green-600' : 'text-gray-500'
                        }`}>
                        {novoEstoque} {item.unit}
                      </span>
                      {itemCompra.selecionado && itemCompra.quantidadeComprada > 0 && (
                        <div className="text-xs text-green-500">
                          +{itemCompra.quantidadeComprada} {item.unit}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {inventarioFiltrado.length === 0 && (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtualizacaoMassiva;