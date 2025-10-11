/**
 * Hook otimizado para gerenciamento de carrinho
 * Reduz re-renders e melhora performance
 */

import { useState, useCallback, useMemo } from 'react';
import { MenuItem } from '../types';

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface StockInfo {
  available: boolean;
  currentStock?: number;
  warning?: string;
}

interface CartCalculations {
  cartTotal: number;
  discountAmount: number;
  finalTotal: number;
  itemCount: number;
}

interface UseOptimizedCartProps {
  inventory?: any[];
  selectedCustomer?: any;
  discountRate?: number;
}

export const useOptimizedCart = ({
  inventory = [],
  selectedCustomer,
  discountRate = 0.1
}: UseOptimizedCartProps = {}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockWarnings, setStockWarnings] = useState<{ [key: string]: string }>({});

  // ============================================================================
  // FUNÇÕES DE VERIFICAÇÃO DE ESTOQUE (MEMOIZADAS)
  // ============================================================================

  const checkStock = useCallback((menuItem: MenuItem, quantity: number): StockInfo => {
    // Se é item direto do estoque, verificar disponibilidade
    if (menuItem.item_type === 'direct' && menuItem.direct_inventory_item_id) {
      const inventoryItem = inventory.find(item => item.id === menuItem.direct_inventory_item_id);

      if (!inventoryItem) {
        return {
          available: false,
          warning: 'Item não encontrado no estoque'
        };
      }

      if (inventoryItem.currentStock < quantity) {
        return {
          available: false,
          currentStock: inventoryItem.currentStock,
          warning: `Estoque insuficiente. Disponível: ${inventoryItem.currentStock} ${inventoryItem.unit}`
        };
      }

      if (inventoryItem.currentStock <= inventoryItem.minStock) {
        return {
          available: true,
          currentStock: inventoryItem.currentStock,
          warning: `Estoque baixo! Disponível: ${inventoryItem.currentStock} ${inventoryItem.unit}`
        };
      }

      return {
        available: true,
        currentStock: inventoryItem.currentStock
      };
    }

    // Se é item preparado, sempre disponível
    return { available: true };
  }, [inventory]);

  // ============================================================================
  // CÁLCULOS DO CARRINHO (MEMOIZADOS)
  // ============================================================================

  const cartCalculations = useMemo((): CartCalculations => {
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const discountAmount = selectedCustomer ? cartTotal * discountRate : 0;
    const finalTotal = cartTotal - discountAmount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cartTotal,
      discountAmount,
      finalTotal,
      itemCount
    };
  }, [cart, selectedCustomer, discountRate]);

  // ============================================================================
  // FUNÇÕES DE MANIPULAÇÃO DO CARRINHO (OTIMIZADAS)
  // ============================================================================

  const addToCart = useCallback((menuItem: MenuItem) => {
    // Verificar estoque antes de adicionar
    const stockCheck = checkStock(menuItem, 1);

    if (!stockCheck.available) {
      throw new Error(stockCheck.warning || 'Item indisponível');
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menu_item_id === menuItem.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const newStockCheck = checkStock(menuItem, newQuantity);

        if (!newStockCheck.available) {
          throw new Error(newStockCheck.warning || 'Estoque insuficiente');
        }

        // Atualizar warnings se necessário
        setStockWarnings(prev => {
          const newWarnings = { ...prev };
          if (newStockCheck.warning) {
            newWarnings[menuItem.id] = newStockCheck.warning;
          } else {
            delete newWarnings[menuItem.id];
          }
          return newWarnings;
        });

        return prevCart.map(item =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Adicionar warning se necessário
        if (stockCheck.warning) {
          setStockWarnings(prev => ({ ...prev, [menuItem.id]: stockCheck.warning! }));
        }

        return [...prevCart, {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        }];
      }
    });
  }, [checkStock]);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.menu_item_id !== menuItemId));
    
    // Remover warning se existir
    setStockWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[menuItemId];
      return newWarnings;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, newQuantity: number, menuItems: MenuItem[]) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    // Encontrar o menu item para verificar estoque
    const menuItem = menuItems.find(item => item.id === menuItemId);
    if (menuItem) {
      const stockCheck = checkStock(menuItem, newQuantity);

      if (!stockCheck.available) {
        throw new Error(stockCheck.warning || 'Estoque insuficiente');
      }

      // Atualizar warnings
      setStockWarnings(prev => {
        const newWarnings = { ...prev };
        if (stockCheck.warning) {
          newWarnings[menuItemId] = stockCheck.warning;
        } else {
          delete newWarnings[menuItemId];
        }
        return newWarnings;
      });
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [checkStock, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    setStockWarnings({});
  }, []);

  // ============================================================================
  // VALIDAÇÕES (MEMOIZADAS)
  // ============================================================================

  const validateCartStock = useCallback((menuItems: MenuItem[]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    for (const cartItem of cart) {
      const menuItem = menuItems.find(item => item.id === cartItem.menu_item_id);
      if (menuItem) {
        const stockCheck = checkStock(menuItem, cartItem.quantity);
        if (!stockCheck.available) {
          errors.push(`${menuItem.name}: ${stockCheck.warning}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }, [cart, checkStock]);

  // ============================================================================
  // ESTATÍSTICAS E INFORMAÇÕES (MEMOIZADAS)
  // ============================================================================

  const cartStats = useMemo(() => {
    return {
      isEmpty: cart.length === 0,
      itemCount: cartCalculations.itemCount,
      uniqueItems: cart.length,
      hasWarnings: Object.keys(stockWarnings).length > 0,
      warningCount: Object.keys(stockWarnings).length
    };
  }, [cart.length, cartCalculations.itemCount, stockWarnings]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Estado
    cart,
    stockWarnings,
    
    // Cálculos
    cartCalculations,
    cartStats,
    
    // Funções
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkStock,
    validateCartStock
  };
};

export default useOptimizedCart;