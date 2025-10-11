import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { 
  Package,
  Plus,
  Minus,
  AlertTriangle,
  FileText,
  Save,
  X
} from 'lucide-react';

interface RegistrarMovimentacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItem?: {
    id: string;
    name: string;
    current_stock: number;
    unit: string;
  } | null;
  onSuccess?: () => void;
}

export function RegistrarMovimentacao({
  open,
  onOpenChange,
  inventoryItem,
  onSuccess
}: RegistrarMovimentacaoProps) {
  const { inventory } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    inventory_item_id: inventoryItem?.id || '',
    movement_type: 'entrada_compra',
    quantity: '',
    unit_cost: '',
    notes: '',
    reference_document: ''
  });

  const movementTypes = [
    { value: 'entrada_compra', label: 'Entrada - Compra', icon: Plus, color: 'green' },
    { value: 'entrada_ajuste', label: 'Entrada - Ajuste de Inventário', icon: FileText, color: 'green' },
    { value: 'entrada_devolucao', label: 'Entrada - Devolução', icon: Plus, color: 'green' },
    { value: 'saida_perda', label: 'Saída - Perda/Quebra', icon: Minus, color: 'red' },
    { value: 'saida_ajuste', label: 'Saída - Ajuste de Inventário', icon: FileText, color: 'red' },
    { value: 'saida_transferencia', label: 'Saída - Transferência', icon: Minus, color: 'red' }
  ];

  const selectedItem = inventory.find(item => item.id === formData.inventory_item_id);
  const selectedMovementType = movementTypes.find(type => type.value === formData.movement_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inventory_item_id || !formData.quantity) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('register_inventory_movement', {
        p_inventory_item_id: formData.inventory_item_id,
        p_movement_type: formData.movement_type,
        p_quantity: parseFloat(formData.quantity),
        p_unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : null,
        p_notes: formData.notes || null,
        p_reference_document: formData.reference_document || null
      });

      if (error) throw error;

      // Reset form
      setFormData({
        inventory_item_id: '',
        movement_type: 'entrada_compra',
        quantity: '',
        unit_cost: '',
        notes: '',
        reference_document: ''
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      alert(error.message || 'Erro ao registrar movimentação');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewStock = () => {
    if (!selectedItem || !formData.quantity) return null;
    
    const quantity = parseFloat(formData.quantity);
    const currentStock = selectedItem.current_stock;
    
    if (formData.movement_type.startsWith('entrada_')) {
      return currentStock + quantity;
    } else {
      return currentStock - quantity;
    }
  };

  const newStock = calculateNewStock();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Registrar Movimentação
                </h2>
                <p className="text-sm text-gray-600">
                  Registre entradas, saídas e ajustes de estoque
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item do Estoque *
              </label>
              <select
                value={formData.inventory_item_id}
                onChange={(e) => setFormData({ ...formData, inventory_item_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={!!inventoryItem}
              >
                <option value="">Selecione um item...</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Estoque: {item.current_stock} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimentação *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {movementTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.movement_type === type.value
                          ? type.color === 'green'
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="movement_type"
                        value={type.value}
                        checked={formData.movement_type === type.value}
                        onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 mr-3 ${
                        type.color === 'green' ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">
                        {type.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Quantity and Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.000"
                    required
                  />
                  {selectedItem && (
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {selectedItem.unit}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custo Unitário (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Stock Preview */}
            {selectedItem && formData.quantity && (
              <div className={`p-4 rounded-lg border ${
                newStock !== null && newStock < 0
                  ? 'border-red-300 bg-red-50'
                  : selectedMovementType?.color === 'green'
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {newStock !== null && newStock < 0 ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Package className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="font-medium text-gray-900">Previsão de Estoque</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Estoque atual:</span>
                  <span className="ml-2 font-medium">
                    {selectedItem.current_stock} {selectedItem.unit}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Após movimentação:</span>
                  <span className={`ml-2 font-medium ${
                    newStock !== null && newStock < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {newStock?.toFixed(3)} {selectedItem.unit}
                  </span>
                </div>
                {newStock !== null && newStock < 0 && (
                  <div className="text-sm text-red-600 mt-1">
                    ⚠️ Atenção: Esta movimentação resultará em estoque negativo!
                  </div>
                )}
              </div>
            )}

            {/* Reference Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documento de Referência
              </label>
              <input
                type="text"
                value={formData.reference_document}
                onChange={(e) => setFormData({ ...formData, reference_document: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: NF-12345, Pedido-67890..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Informações adicionais sobre a movimentação..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.inventory_item_id || !formData.quantity}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
