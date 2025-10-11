/**
 * Calculadora de Preços para o Módulo de Gestão de Vendas
 * 
 * Esta classe complementa a CommissionCalculator fornecendo
 * funcionalidades para cálculo de preços, descontos e totais
 */

import { PriceCalculationData } from '../types/sales-management';

export class PriceCalculator {
  /**
   * Calcula o subtotal dos itens
   * @param itens Array de itens com quantidade e preço
   * @returns Subtotal calculado
   */
  static calculateSubtotal(itens: { quantidade: number; preco_unitario: number }[]): number {
    return itens.reduce((total, item) => {
      return total + (item.quantidade * item.preco_unitario);
    }, 0);
  }

  /**
   * Aplica desconto ao valor
   * @param valor Valor original
   * @param desconto Objeto com tipo e valor do desconto
   * @returns Valor com desconto aplicado
   */
  static applyDiscount(
    valor: number,
    desconto: { tipo: 'percentual' | 'valor'; valor: number }
  ): number {
    if (desconto.tipo === 'percentual') {
      const percentualDesconto = Math.min(Math.max(desconto.valor, 0), 100);
      return valor - (valor * percentualDesconto / 100);
    } else {
      const valorDesconto = Math.min(desconto.valor, valor);
      return valor - valorDesconto;
    }
  }

  /**
   * Aplica acréscimo ao valor
   * @param valor Valor original
   * @param acrescimo Objeto com tipo e valor do acréscimo
   * @returns Valor com acréscimo aplicado
   */
  static applyIncrease(
    valor: number,
    acrescimo: { tipo: 'percentual' | 'valor'; valor: number }
  ): number {
    if (acrescimo.tipo === 'percentual') {
      const percentualAcrescimo = Math.max(acrescimo.valor, 0);
      return valor + (valor * percentualAcrescimo / 100);
    } else {
      const valorAcrescimo = Math.max(acrescimo.valor, 0);
      return valor + valorAcrescimo;
    }
  }

  /**
   * Calcula o total final com descontos e acréscimos
   * @param data Dados para cálculo de preços
   * @returns Valor total calculado
   */
  static calculateTotal(data: PriceCalculationData): number {
    // Calcular subtotal dos itens
    let total = this.calculateSubtotal(data.itens);

    // Aplicar descontos
    if (data.descontos) {
      for (const desconto of data.descontos) {
        total = this.applyDiscount(total, desconto);
      }
    }

    // Aplicar acréscimos
    if (data.acrescimos) {
      for (const acrescimo of data.acrescimos) {
        total = this.applyIncrease(total, acrescimo);
      }
    }

    return Math.max(total, 0); // Garantir que não seja negativo
  }

  /**
   * Calcula detalhamento completo do preço
   * @param data Dados para cálculo
   * @returns Objeto com detalhamento completo
   */
  static calculateDetailedTotal(data: PriceCalculationData) {
    const subtotal = this.calculateSubtotal(data.itens);
    let valorComDescontos = subtotal;
    let valorComAcrescimos = subtotal;
    let totalDescontos = 0;
    let totalAcrescimos = 0;

    // Calcular descontos
    if (data.descontos) {
      for (const desconto of data.descontos) {
        const valorAnterior = valorComDescontos;
        valorComDescontos = this.applyDiscount(valorComDescontos, desconto);
        totalDescontos += valorAnterior - valorComDescontos;
      }
    }

    // Aplicar acréscimos sobre o valor com descontos
    valorComAcrescimos = valorComDescontos;
    if (data.acrescimos) {
      for (const acrescimo of data.acrescimos) {
        const valorAnterior = valorComAcrescimos;
        valorComAcrescimos = this.applyIncrease(valorComAcrescimos, acrescimo);
        totalAcrescimos += valorComAcrescimos - valorAnterior;
      }
    }

    const total = Math.max(valorComAcrescimos, 0);

    return {
      subtotal,
      total_descontos: totalDescontos,
      total_acrescimos: totalAcrescimos,
      total,
      economia: totalDescontos > 0 ? totalDescontos : 0,
      percentual_desconto: subtotal > 0 ? (totalDescontos / subtotal) * 100 : 0
    };
  }

  /**
   * Valida se um desconto pode ser aplicado
   * @param valor Valor original
   * @param desconto Desconto a ser validado
   * @returns true se válido
   */
  static validateDiscount(
    valor: number,
    desconto: { tipo: 'percentual' | 'valor'; valor: number }
  ): boolean {
    if (valor <= 0) return false;
    
    if (desconto.tipo === 'percentual') {
      return desconto.valor >= 0 && desconto.valor <= 100;
    } else {
      return desconto.valor >= 0 && desconto.valor <= valor;
    }
  }

  /**
   * Calcula o valor unitário médio dos itens
   * @param itens Array de itens
   * @returns Preço unitário médio
   */
  static calculateAverageUnitPrice(
    itens: { quantidade: number; preco_unitario: number }[]
  ): number {
    if (itens.length === 0) return 0;

    const totalQuantidade = itens.reduce((sum, item) => sum + item.quantidade, 0);
    const totalValor = this.calculateSubtotal(itens);

    return totalQuantidade > 0 ? totalValor / totalQuantidade : 0;
  }

  /**
   * Formata valor monetário
   * @param valor Valor a ser formatado
   * @returns String formatada
   */
  static formatCurrency(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Arredonda valor para 2 casas decimais
   * @param valor Valor a ser arredondado
   * @returns Valor arredondado
   */
  static roundToTwoDecimals(valor: number): number {
    return Math.round(valor * 100) / 100;
  }
}

// Funções utilitárias exportadas
export const calcularSubtotal = PriceCalculator.calculateSubtotal;
export const aplicarDesconto = PriceCalculator.applyDiscount;
export const calcularTotal = PriceCalculator.calculateTotal;