/**
 * Painel de Descontos
 * 
 * Componente para aplicação de descontos manuais, cupons,
 * promoções automáticas e descontos de membership
 */

import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Tag, 
  Gift, 
  Shield, 
  AlertCircle, 
  Check, 
  X,
  Lock,
  Star
} from 'lucide-react';
import { 
  Discount, 
  DiscountType, 
  Promotion, 
  MembershipDiscount,
  UserProfile,
  CartItem,
  DiscountValidationResult
} from '../../types/sales-management';
import { DiscountManager } from '../../services/discount-manager';

interface DiscountPanelProps {
  cartItems: CartItem[];
  orderTotal: number;
  currentUser: UserProfile;
  appliedDiscounts: Discount[];
  onDiscountApplied: (discount: Discount) => void;
  onDiscountRemoved: (discountId: string) => void;
  onError: (error: string) => void;
  memberId?: string;
  membershipType?: string;
}

export const DiscountPanel: React.FC<DiscountPanelProps> = ({
  cartItems,
  orderTotal,
  currentUser,
  appliedDiscounts,
  onDiscountApplied,
  onDiscountRemoved,
  onError,
  memberId,
  membershipType
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'coupon' | 'promotion' | 'membership'>('manual');
  const [loading, setLoading] = useState(false);
  
  // Manual discount state
  const [manualDiscountType, setManualDiscountType] = useState<DiscountType>('percentage');
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualDiscountReason, setManualDiscountReason] = useState('');
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  
  // Available data
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [membershipDiscounts, setMembershipDiscounts] = useState<MembershipDiscount[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Array<{ code: string; description: string }>>([]);

  const discountManager = DiscountManager.getInstance();

  useEffect(() => {
    loadDiscountData();
    applyAutomaticPromotions();
  }, [cartItems]);

  const loadDiscountData = async () => {
    try {
      const promotions = discountManager.getActivePromotions();
      const memberships = discountManager.getMembershipDiscounts();
      const coupons = discountManager.getAvailableCoupons();
      
      setActivePromotions(promotions);
      setMembershipDiscounts(memberships);
      setAvailableCoupons(coupons);
    } catch (error) {
      console.error('Erro ao carregar dados de desconto:', error);
    }
  };

  const applyAutomaticPromotions = async () => {
    if (cartItems.length === 0) return;

    try {
      const automaticDiscounts = await discountManager.applyAutomaticPromotions(cartItems);
      
      automaticDiscounts.forEach(discount => {
        // Verificar se promoção já não foi aplicada
        const alreadyApplied = appliedDiscounts.some(d => 
          d.promotion_id === discount.promotion_id
        );
        
        if (!alreadyApplied) {
          onDiscountApplied(discount);
        }
      });
    } catch (error) {
      console.error('Erro ao aplicar promoções automáticas:', error);
    }
  };

  const handleManualDiscount = async () => {
    if (!manualDiscountValue.trim()) {
      onError('Informe o valor do desconto');
      return;
    }

    const value = parseFloat(manualDiscountValue);
    if (isNaN(value) || value <= 0) {
      onError('Valor do desconto inválido');
      return;
    }

    setLoading(true);
    try {
      const result = await discountManager.applyManualDiscount(
        value,
        manualDiscountType,
        currentUser,
        manualDiscountReason.trim() || undefined
      );

      if (result.valid && result.discount) {
        onDiscountApplied(result.discount);
        setManualDiscountValue('');
        setManualDiscountReason('');
      } else {
        onError(result.message || 'Erro ao aplicar desconto');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao aplicar desconto');
    } finally {
      setLoading(false);
    }
  };

  const handleCouponApplication = async () => {
    if (!couponCode.trim()) {
      onError('Informe o código do cupom');
      return;
    }

    setLoading(true);
    try {
      const result = await discountManager.applyCoupon(
        couponCode.trim(),
        cartItems,
        orderTotal
      );

      if (result.valid && result.discount) {
        onDiscountApplied(result.discount);
        setCouponCode('');
      } else {
        onError(result.message || 'Erro ao aplicar cupom');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao aplicar cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleMembershipDiscount = async () => {
    if (!memberId || !membershipType) {
      onError('Informações de membro não disponíveis');
      return;
    }

    // Verificar se já foi aplicado
    const alreadyApplied = appliedDiscounts.some(d => d.type === 'membership');
    if (alreadyApplied) {
      onError('Desconto de membro já aplicado');
      return;
    }

    setLoading(true);
    try {
      const result = await discountManager.applyMembershipDiscount(
        memberId,
        membershipType,
        orderTotal
      );

      if (result.valid && result.discount) {
        onDiscountApplied(result.discount);
      } else {
        onError(result.message || 'Erro ao aplicar desconto de membro');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao aplicar desconto de membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async (discountId: string) => {
    try {
      await discountManager.removeDiscount(discountId, currentUser);
      onDiscountRemoved(discountId);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Erro ao remover desconto');
    }
  };

  const totalDiscountAmount = discountManager.calculateTotalDiscount(appliedDiscounts);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Percent className="w-5 h-5 text-green-600" />
          Descontos e Promoções
        </h3>
        {totalDiscountAmount > 0 && (
          <p className="text-sm text-green-600 mt-1">
            Total de desconto: R$ {totalDiscountAmount.toFixed(2)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex">
          {[
            { id: 'manual', label: 'Manual', icon: Percent },
            { id: 'coupon', label: 'Cupom', icon: Tag },
            { id: 'promotion', label: 'Promoções', icon: Gift },
            { id: 'membership', label: 'Membro', icon: Star }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Manual Discount Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={manualDiscountType}
                  onChange={(e) => setManualDiscountType(e.target.value as DiscountType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualDiscountValue}
                  onChange={(e) => setManualDiscountValue(e.target.value)}
                  placeholder={manualDiscountType === 'percentage' ? '10' : '5.00'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo (opcional)
              </label>
              <input
                type="text"
                value={manualDiscountReason}
                onChange={(e) => setManualDiscountReason(e.target.value)}
                placeholder="Motivo do desconto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleManualDiscount}
              disabled={loading || !manualDiscountValue.trim()}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Percent className="w-4 h-4" />
              )}
              Aplicar Desconto
            </button>

            {/* Authorization info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Limites de Autorização</p>
                  <p className="text-yellow-700 mt-1">
                    Seu perfil ({currentUser.role}) permite descontos de até{' '}
                    {currentUser.role === 'cashier' && '5% ou R$ 10,00'}
                    {currentUser.role === 'supervisor' && '15% ou R$ 50,00'}
                    {currentUser.role === 'manager' && '30% ou R$ 200,00'}
                    {currentUser.role === 'admin' && '100% ou R$ 1.000,00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Tab */}
        {activeTab === 'coupon' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código do Cupom
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleCouponApplication}
                  disabled={loading || !couponCode.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Tag className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Available Coupons */}
            {availableCoupons.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cupons Disponíveis</h4>
                <div className="space-y-2">
                  {availableCoupons.map(coupon => (
                    <div
                      key={coupon.code}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setCouponCode(coupon.code)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{coupon.code}</p>
                          <p className="text-sm text-gray-600">{coupon.description}</p>
                        </div>
                        <Tag className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotion' && (
          <div className="space-y-4">
            {activePromotions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Promoções Ativas</h4>
                {activePromotions.map(promotion => {
                  const isApplied = appliedDiscounts.some(d => d.promotion_id === promotion.id);
                  
                  return (
                    <div
                      key={promotion.id}
                      className={`border rounded-lg p-3 ${
                        isApplied ? 'border-green-200 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{promotion.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{promotion.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Válida até: {new Date(promotion.end_date).toLocaleDateString('pt-BR')}</span>
                            {promotion.discount_type === 'percentage' && (
                              <span>{promotion.discount_value}% de desconto</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          {isApplied ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="w-4 h-4" />
                              <span className="text-xs">Aplicada</span>
                            </div>
                          ) : (
                            <Gift className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma promoção ativa no momento</p>
              </div>
            )}
          </div>
        )}

        {/* Membership Tab */}
        {activeTab === 'membership' && (
          <div className="space-y-4">
            {memberId && membershipType ? (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Membro {membershipType.toUpperCase()}
                    </span>
                  </div>
                </div>

                {membershipDiscounts
                  .filter(md => md.membership_type === membershipType)
                  .map(discount => {
                    const isApplied = appliedDiscounts.some(d => d.type === 'membership');
                    
                    return (
                      <div key={discount.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="font-medium text-gray-900">{discount.description}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              Valor mínimo: R$ {discount.minimum_order_value.toFixed(2)}
                            </p>
                            {discount.max_discount_amount && (
                              <p className="text-xs text-gray-500">
                                Desconto máximo: R$ {discount.max_discount_amount.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={handleMembershipDiscount}
                            disabled={loading || isApplied || orderTotal < discount.minimum_order_value}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isApplied ? 'Aplicado' : 'Aplicar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum membro identificado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Identifique um membro para aplicar descontos especiais
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Applied Discounts */}
      {appliedDiscounts.length > 0 && (
        <div className="border-t p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Descontos Aplicados</h4>
          <div className="space-y-2">
            {appliedDiscounts.map(discount => (
              <div
                key={discount.id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-green-900">{discount.description}</p>
                  <p className="text-sm text-green-700">
                    R$ {discount.value.toFixed(2)}
                    {discount.requires_authorization && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Requer autorização
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveDiscount(discount.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountPanel;