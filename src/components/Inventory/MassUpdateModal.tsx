import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Save, Search, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { InventoryItem } from '../../types';

interface MassUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedItems?: string[];
}

interface ItemCompra {
  id: string;
  selecionado: boolean;
  quantidadeComprada: number;
  valorUnitario: number;
  valorTotal: number;
}

const MassUpdateModal: React.FC<MassUpdateModalProps> = ({ 
  isOpen, 
  onClose, 
  preSelectedItems = [] 
}) => {
  const { inventory, inventoryCategories, updateInventoryItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [itensCompra, setItensCompra] = useState<Record<string, ItemCompra>>({});
  const [salvando, setSalvando] = useState(false);

  // Inicializar itens pré-selecionados
  React.useEffect(() => {
    if (preSelectedItems.length > 0) {
      const novosItens: Record<string, ItemCompra> = {};
      preSelectedItems.forEach(itemId => {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
          const quantidadeSugerida = Math.max(item.minStock * 2 - item.currentStock, item.minStock);
          novosItens[itemId] = {
            id: itemId,
            selecionado: true,
            quantidadeComprada: quantidadeSugerida,
            valorUnitario: item.cost || 0,
            valorTotal: quantidadeSugerida * (item.cost || 0),
          };
        }
      });
      setItensCompra(novosItens);
    }
  }, [preSelectedItems, inventory]);

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
      const promises = itensSelecionados.map(async (itemCompra) => {
        const item = inventory.find(i => i.id === itemCompra.id);
        if (!item) return;

        const novoEstoque = item.currentStock + itemCompra.quantidadeComprada;
        const novoCusto = itemCompra.valorUnitario > 0 ? itemCompra.valorUnitario : item.cost;

        const itemAtualizado: InventoryItem = {
          ...item,
          currentStock: novoEstoque,
          cost: novoCusto,
        };

        await updateInventoryItem(itemAtualizado);
      });

      await Promise.all(promises);
      
      // Limpar seleções após salvar
      setItensCompra({});
      
      alert(`${itensSelecionados.length} itens atualizados com sucesso!`);
      onClose();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Atualização Massiva de Estoque
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Selecione os itens comprados e atualize o estoque em lote
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* Resumo */}
          {itensSelecionados.length > 0 && (
            <div className="p-4 bg-blue-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{itensSelecionados.length}</p>
                  <p className="text-blue-800 text-sm">Itens Selecionados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {itensSelecionados.reduce((total, item) => total + item.quantidadeComprada, 0)}
                  </p>
                  <p className="text-blue-800 text-sm">Quantidade Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">R$ {valorTotalCompras.toFixed(2)}</p>
                  <p className="text-blue-800 text-sm">Valor Total</p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Produtos */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
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
                        <span className={`text-sm font-medium ${
                          item.currentStock <= item.minStock ? 'text-red-600' : 'text-gray-900'
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
                        <span className={`text-sm font-medium ${
                          itemCompra.selecionado ? 'text-green-600' : 'text-gray-500'
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
            
            {inventarioFiltrado.length === 0 && (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum produto encontrado</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertTriangle size={16} />
              <span>As alterações serão registradas no histórico de movimentações</span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarAtualizacoes}
                disabled={salvando || itensSelecionados.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{salvando ? 'Salvando...' : `Salvar ${itensSelecionados.length} Itens`}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MassUpdateModal;