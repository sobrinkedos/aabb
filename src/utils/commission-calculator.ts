/**
 * Calculadora de Comissão para o Módulo de Gestão de Vendas
 * 
 * Esta classe é responsável por calcular comissões de garçom
 * com validação de percentual entre 0% e 30%
 */

import { 
  CommissionCalculationResult, 
  CommissionValidationResult,
  DEFAULT_COMMISSION_PERCENTAGE,
  MIN_COMMISSION_PERCENTAGE,
  MAX_COMMISSION_PERCENTAGE 
} from '../types/sales-management';

export class CommissionCalculator {
  /**
   * Valida se o percentual de comissão está dentro dos limites permitidos
   * @param percentage Percentual a ser validado (0-30)
   * @returns true se válido, false caso contrário
   */
  static validatePercentage(percentage: number): boolean {
    return percentage >= MIN_COMMISSION_PERCENTAGE && 
           percentage <= MAX_COMMISSION_PERCENTAGE &&
           !isNaN(percentage) &&
           isFinite(percentage);
  }

  /**
   * Calcula o valor da comissão baseado no valor base e percentual
   * @param baseAmount Valor base para cálculo
   * @param percentage Percentual de comissão (0-30)
   * @returns Valor da comissão calculada
   * @throws Error se o percentual for inválido
   */
  static calculateCommission(baseAmount: number, percentage: number): number {
    if (!this.validatePercentage(percentage)) {
      throw new Error(
        `Percentual de comissão deve estar entre ${MIN_COMMISSION_PERCENTAGE}% e ${MAX_COMMISSION_PERCENTAGE}%`
      );
    }

    if (baseAmount <= 0) {
      throw new Error('Valor base deve ser maior que zero');
    }

    return (baseAmount * percentage) / 100;
  }

  /**
   * Calcula o total incluindo a comissão
   * @param baseAmount Valor base
   * @param percentage Percentual de comissão
   * @returns Valor total (base + comissão)
   */
  static calculateTotal(baseAmount: number, percentage: number): number {
    const commissionAmount = this.calculateCommission(baseAmount, percentage);
    return baseAmount + commissionAmount;
  }

  /**
   * Realiza cálculo completo com validação e retorna resultado estruturado
   * @param baseAmount Valor base
   * @param percentage Percentual de comissão
   * @returns Resultado completo do cálculo
   */
  static calculateWithValidation(
    baseAmount: number, 
    percentage: number
  ): CommissionCalculationResult {
    try {
      const percentualValido = this.validatePercentage(percentage);
      
      if (!percentualValido) {
        return {
          valor_base: baseAmount,
          percentual_comissao: percentage,
          valor_comissao: 0,
          valor_total: baseAmount,
          percentual_valido: false,
          erro: `Percentual deve estar entre ${MIN_COMMISSION_PERCENTAGE}% e ${MAX_COMMISSION_PERCENTAGE}%`
        };
      }

      if (baseAmount <= 0) {
        return {
          valor_base: baseAmount,
          percentual_comissao: percentage,
          valor_comissao: 0,
          valor_total: baseAmount,
          percentual_valido: false,
          erro: 'Valor base deve ser maior que zero'
        };
      }

      const valorComissao = this.calculateCommission(baseAmount, percentage);
      const valorTotal = baseAmount + valorComissao;

      return {
        valor_base: baseAmount,
        percentual_comissao: percentage,
        valor_comissao: valorComissao,
        valor_total: valorTotal,
        percentual_valido: true
      };
    } catch (error) {
      return {
        valor_base: baseAmount,
        percentual_comissao: percentage,
        valor_comissao: 0,
        valor_total: baseAmount,
        percentual_valido: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Valida dados de comissão com sugestões
   * @param baseAmount Valor base
   * @param percentage Percentual proposto
   * @returns Resultado da validação com sugestões
   */
  static validateCommissionData(
    baseAmount: number, 
    percentage: number
  ): CommissionValidationResult {
    const sugestoes: string[] = [];
    let valido = true;
    let mensagemErro: string | undefined;

    // Validar valor base
    if (baseAmount <= 0) {
      valido = false;
      mensagemErro = 'Valor base deve ser maior que zero';
    }

    // Validar percentual
    if (!this.validatePercentage(percentage)) {
      valido = false;
      mensagemErro = `Percentual deve estar entre ${MIN_COMMISSION_PERCENTAGE}% e ${MAX_COMMISSION_PERCENTAGE}%`;
      
      if (percentage < MIN_COMMISSION_PERCENTAGE) {
        sugestoes.push(`Percentual mínimo é ${MIN_COMMISSION_PERCENTAGE}%`);
      } else if (percentage > MAX_COMMISSION_PERCENTAGE) {
        sugestoes.push(`Percentual máximo é ${MAX_COMMISSION_PERCENTAGE}%`);
      }
    }

    // Sugestões baseadas no valor
    if (valido) {
      if (percentage === 0) {
        sugestoes.push('Comissão zerada - confirme se está correto');
      } else if (percentage < 5) {
        sugestoes.push('Percentual baixo - considere o padrão de 10%');
      } else if (percentage > 20) {
        sugestoes.push('Percentual alto - verifique se está correto');
      }
    }

    const valorCalculado = valido ? this.calculateCommission(baseAmount, percentage) : 0;

    return {
      valido,
      percentual: percentage,
      valor_calculado: valorCalculado,
      mensagem_erro: mensagemErro,
      sugestoes: sugestoes.length > 0 ? sugestoes : undefined
    };
  }

  /**
   * Calcula percentual baseado no valor da comissão e valor base
   * @param baseAmount Valor base
   * @param commissionAmount Valor da comissão
   * @returns Percentual calculado
   */
  static calculatePercentageFromAmount(
    baseAmount: number, 
    commissionAmount: number
  ): number {
    if (baseAmount <= 0) {
      throw new Error('Valor base deve ser maior que zero');
    }

    return (commissionAmount / baseAmount) * 100;
  }

  /**
   * Formata valores monetários para exibição
   * @param value Valor a ser formatado
   * @returns String formatada em Real brasileiro
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata percentual para exibição
   * @param percentage Percentual a ser formatado
   * @returns String formatada com símbolo %
   */
  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }
}

// Funções utilitárias exportadas para compatibilidade
export const validarPercentualComissao = CommissionCalculator.validatePercentage;
export const calcularComissao = CommissionCalculator.calculateCommission;
export const calcularTotalComComissao = CommissionCalculator.calculateTotal;
export const formatarMoeda = CommissionCalculator.formatCurrency;