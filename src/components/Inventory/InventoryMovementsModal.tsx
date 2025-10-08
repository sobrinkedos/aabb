import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';

interface InventoryMovement {
  id: string;
  movement_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  notes: string | null;
  reference_document: string | null;
  created_at: string;
  item_name: string;
  item_unit: string;
  created_by_name: string | null;
  menu_item_name: string | null;
  balcao_order_number: number | null;
  movement_direction: string;
  movement_type_label: string;
}

interface InventoryMovementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItemId: string;
  inventoryItemName: string;
}

export function InventoryMovementsModal({
  open,
  onOpenChange,
  inventoryItemId,
  inventoryItemName,
}: InventoryMovementsModalProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && inventoryItemId) {
      loadMovements();
    }
  }, [open, inventoryItemId]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_movements_detailed')
        .select('*')
        .eq('inventory_item_id', inventoryItemId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (direction: string) => {
    return direction === 'Entrada' ? (
      <ArrowUpCircle className="h-5 w-5 text-green-600" />
    ) : (
      <ArrowDownCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getMovementBadge = (direction: string) => {
    return direction === 'Entrada' ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Entrada
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Saída
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Movimentações de Estoque - {inventoryItemName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma movimentação encontrada
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getMovementIcon(movement.movement_direction)}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getMovementBadge(movement.movement_direction)}
                          <span className="font-medium text-gray-900">
                            {movement.movement_type_label}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Quantidade:</span>{' '}
                            {movement.quantity} {movement.item_unit}
                          </div>
                          
                          <div>
                            <span className="font-medium">Estoque:</span>{' '}
                            {movement.stock_before} → {movement.stock_after} {movement.item_unit}
                          </div>

                          {movement.menu_item_name && (
                            <div>
                              <span className="font-medium">Item do menu:</span>{' '}
                              {movement.menu_item_name}
                            </div>
                          )}

                          {movement.balcao_order_number && (
                            <div>
                              <span className="font-medium">Pedido:</span>{' '}
                              #{movement.balcao_order_number}
                            </div>
                          )}

                          {movement.reference_document && (
                            <div>
                              <span className="font-medium">Referência:</span>{' '}
                              {movement.reference_document}
                            </div>
                          )}

                          {movement.notes && (
                            <div>
                              <span className="font-medium">Observações:</span>{' '}
                              {movement.notes}
                            </div>
                          )}

                          {movement.created_by_name && (
                            <div>
                              <span className="font-medium">Por:</span>{' '}
                              {movement.created_by_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      {format(new Date(movement.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
