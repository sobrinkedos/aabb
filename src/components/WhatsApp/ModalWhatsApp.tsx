import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Send, Copy } from 'lucide-react';
import { InventoryItem, InventoryCategory } from '../../types';

interface ModalWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  itens: InventoryItem[];
  categorias: InventoryCategory[];
}

const ModalWhatsApp: React.FC<ModalWhatsAppProps> = ({ isOpen, onClose, itens, categorias }) => {
  const [telefone, setTelefone] = useState('');
  const [erroTelefone, setErroTelefone] = useState('');
  const [mensagemGerada, setMensagemGerada] = useState('');
  const [etapa, setEtapa] = useState<'telefone' | 'mensagem'>('telefone');

  const formatarTelefone = (valor: string) => {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
  };

  const validarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length === 11 && numeros.startsWith('11', 0) || numeros.length === 11;
  };

  const calcularQuantidadeSugerida = (estoqueAtual: number, estoqueMinimo: number) => {
    return Math.max(estoqueMinimo * 2 - estoqueAtual, estoqueMinimo);
  };

  const gerarMensagem = () => {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Agrupar itens por categoria
    const itensPorCategoria = itens.reduce((acc, item) => {
      const categoria = categorias.find(cat => cat.id === item.categoryId)?.name || 'Sem Categoria';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    let mensagem = `🏪 *AABB - Lista de Compras*\n`;
    mensagem += `📅 ${data} às ${hora}\n\n`;
    mensagem += `📋 *ITENS PARA REPOSIÇÃO:*\n\n`;

    // Adicionar itens por categoria
    Object.entries(itensPorCategoria).forEach(([categoria, itensCategoria]) => {
      mensagem += `🔸 *${categoria.toUpperCase()}*\n`;
      itensCategoria.forEach(item => {
        const quantidadeSugerida = calcularQuantidadeSugerida(item.currentStock, item.minStock);
        const status = item.currentStock === 0 ? '🔴 ESGOTADO' : '🟡 BAIXO';
        
        mensagem += `• ${item.name}\n`;
        mensagem += `  ${status} - Atual: ${item.currentStock} ${item.unit}\n`;
        mensagem += `  Mínimo: ${item.minStock} ${item.unit}\n`;
        mensagem += `  *Sugestão: ${quantidadeSugerida} ${item.unit}*\n`;
        
        if (item.supplier) {
          mensagem += `  Fornecedor: ${item.supplier}\n`;
        }
        
        if (item.cost) {
          mensagem += `  Custo: R$ ${item.cost.toFixed(2)}\n`;
        }
        
        mensagem += `\n`;
      });
      mensagem += `\n`;
    });

    mensagem += `💡 *Observações:*\n`;
    mensagem += `- Quantidades baseadas no estoque mínimo\n`;
    mensagem += `- Verificar disponibilidade com fornecedores\n`;
    mensagem += `- Priorizar itens esgotados\n\n`;

    mensagem += `👤 Solicitado pelo Sistema AABB\n`;
    mensagem += `📞 Contato: (11) 99999-9999\n\n`;
    mensagem += `---\n`;
    mensagem += `Sistema AABB - Gestão de Estoque`;

    return mensagem;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setTelefone(valorFormatado);
    
    if (erroTelefone) {
      setErroTelefone('');
    }
  };

  const handleProximaEtapa = () => {
    if (!validarTelefone(telefone)) {
      setErroTelefone('Número de telefone inválido. Use o formato (XX) XXXXX-XXXX');
      return;
    }

    const mensagem = gerarMensagem();
    setMensagemGerada(mensagem);
    setEtapa('mensagem');
  };

  const handleEnviarWhatsApp = () => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const numeroFormatado = `55${numeroLimpo}`;
    const mensagemCodificada = encodeURIComponent(mensagemGerada);
    
    // Tentar abrir WhatsApp Web primeiro
    const urlWeb = `https://web.whatsapp.com/send?phone=${numeroFormatado}&text=${mensagemCodificada}`;
    
    // Abrir em nova aba
    const novaAba = window.open(urlWeb, '_blank');
    
    // Se não conseguir abrir (bloqueador de popup), tentar WhatsApp mobile
    if (!novaAba) {
      const urlMobile = `whatsapp://send?phone=${numeroFormatado}&text=${mensagemCodificada}`;
      window.location.href = urlMobile;
    }
    
    onClose();
  };

  const handleCopiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(mensagemGerada);
      alert('Mensagem copiada para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar mensagem:', err);
      alert('Erro ao copiar mensagem. Tente selecionar e copiar manualmente.');
    }
  };

  const handleVoltar = () => {
    setEtapa('telefone');
    setMensagemGerada('');
  };

  const handleFechar = () => {
    setTelefone('');
    setErroTelefone('');
    setMensagemGerada('');
    setEtapa('telefone');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {etapa === 'telefone' ? 'Compartilhar no WhatsApp' : 'Confirmar Envio'}
              </h2>
              <button
                onClick={handleFechar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {etapa === 'telefone' ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-600 mb-4">
                      Insira o número de telefone para enviar a lista de compras via WhatsApp.
                    </p>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Número de Telefone
                      </label>
                      <div className="relative">
                        <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={telefone}
                          onChange={handleTelefoneChange}
                          placeholder="(11) 99999-9999"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            erroTelefone ? 'border-red-300' : 'border-gray-300'
                          }`}
                          maxLength={15}
                        />
                      </div>
                      {erroTelefone && (
                        <p className="text-red-600 text-sm">{erroTelefone}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Resumo da Lista</h4>
                    <p className="text-blue-700 text-sm">
                      {itens.length} {itens.length === 1 ? 'item' : 'itens'} com estoque baixo serão incluídos na mensagem.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-600 mb-4">
                      Mensagem que será enviada para <strong>{telefone}</strong>:
                    </p>
                    
                    <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {mensagemGerada}
                      </pre>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCopiarMensagem}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Copy size={16} />
                      <span>Copiar Mensagem</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between p-6 border-t bg-gray-50">
              {etapa === 'telefone' ? (
                <>
                  <button
                    onClick={handleFechar}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProximaEtapa}
                    disabled={!telefone}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span>Gerar Mensagem</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleVoltar}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleEnviarWhatsApp}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Send size={16} />
                    <span>Enviar WhatsApp</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalWhatsApp;