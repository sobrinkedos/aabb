import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, AlertTriangle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import ModalWhatsApp from '../../components/WhatsApp/ModalWhatsApp';

const ListaEstoqueBaixo: React.FC = () => {
  const navigate = useNavigate();
  const { inventory, inventoryCategories } = useApp();
  const [mostrarModalWhatsApp, setMostrarModalWhatsApp] = useState(false);

  const itensEstoqueBaixo = useMemo(() => {
    return inventory.filter(item => item.currentStock <= item.minStock);
  }, [inventory]);

  const itensPorCategoria = useMemo(() => {
    const grupos = itensEstoqueBaixo.reduce((acc, item) => {
      const categoria = inventoryCategories.find(cat => cat.id === item.categoryId)?.name || 'Sem Categoria';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, typeof itensEstoqueBaixo>);

    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [itensEstoqueBaixo, inventoryCategories]);

  const calcularQuantidadeSugerida = (estoqueAtual: number, estoqueMinimo: number) => {
    return Math.max(estoqueMinimo * 2 - estoqueAtual, estoqueMinimo);
  };

  const handleCompartilharWhatsApp = () => {
    setMostrarModalWhatsApp(true);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Itens com Estoque Baixo</h1>
            <p className="text-gray-600">
              {itensEstoqueBaixo.length} {itensEstoqueBaixo.length === 1 ? 'item precisa' : 'itens precisam'} de reposição
            </p>
          </div>
        </div>
        
        {itensEstoqueBaixo.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompartilharWhatsApp}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Share2 size={20} />
            <span>Compartilhar no WhatsApp</span>
          </motion.button>
        )}
      </motion.div>

      {itensEstoqueBaixo.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            Parabéns! Todos os itens estão com estoque adequado
          </h3>
          <p className="text-green-600">
            Não há itens que precisam de reposição no momento.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {itensPorCategoria.map(([categoria, itens], index) => (
            <motion.div
              key={categoria}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>{categoria}</span>
                <span className="text-sm text-gray-500 font-normal">({itens.length} itens)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itens.map((item) => {
                  const quantidadeSugerida = calcularQuantidadeSugerida(item.currentStock, item.minStock);
                  const isEstoqueZero = item.currentStock === 0;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 ${
                        isEstoqueZero 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-orange-300 bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                        {isEstoqueZero && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            ESGOTADO
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estoque Atual:</span>
                          <span className={`font-medium ${isEstoqueZero ? 'text-red-600' : 'text-orange-600'}`}>
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estoque Mínimo:</span>
                          <span className="font-medium text-gray-800">
                            {item.minStock} {item.unit}
                          </span>
                        </div>
                        
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600">Sugestão de Compra:</span>
                          <span className="font-bold text-blue-600">
                            {quantidadeSugerida} {item.unit}
                          </span>
                        </div>
                        
                        {item.supplier && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fornecedor:</span>
                            <span className="font-medium text-gray-800 text-xs">
                              {item.supplier}
                            </span>
                          </div>
                        )}
                        
                        {item.cost && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Custo Unit.:</span>
                            <span className="font-medium text-gray-800">
                              R$ {item.cost.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ModalWhatsApp
        isOpen={mostrarModalWhatsApp}
        onClose={() => setMostrarModalWhatsApp(false)}
        itens={itensEstoqueBaixo}
        categorias={inventoryCategories}
      />
    </div>
  );
};

export default ListaEstoqueBaixo;