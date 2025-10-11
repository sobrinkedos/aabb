/**
 * Processador de Pagamentos para o Módulo de Gestão de Vendas
 * 
 * Esta classe é responsável por processar diferentes métodos de pagamento,
 * integrar com terminais, gerar comprovantes e validar transações
 */

import { 
  PaymentData, 
  PaymentResult, 
  PaymentMethod, 
  Receipt, 
  Transaction,
  PaymentValidationResult
} from '../types/sales-management';

export class PaymentProcessor {
  private static instance: PaymentProcessor;
  private transactionCounter: number = 1;

  private constructor() {}

  static getInstance(): PaymentProcessor {
    if (!PaymentProcessor.instance) {
      PaymentProcessor.instance = new PaymentProcessor();
    }
    return PaymentProcessor.instance;
  }

  /**
   * Processa um pagamento baseado no método selecionado
   * @param paymentData Dados do pagamento
   * @returns Resultado do processamento
   */
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      // Validar dados do pagamento
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valido) {
        return {
          sucesso: false,
          erro: validation.erros.join(', ')
        };
      }

      // Processar baseado no método
      switch (paymentData.metodo_pagamento) {
        case 'dinheiro':
          return await this.processCashPayment(paymentData);
        
        case 'cartao_debito':
        case 'cartao_credito':
          return await this.processCardPayment(paymentData);
        
        case 'pix':
          return await this.processPixPayment(paymentData);
        
        case 'credito_membro':
          return await this.processMemberCreditPayment(paymentData);
        
        case 'transferencia':
          return await this.processTransferPayment(paymentData);
        
        default:
          return {
            sucesso: false,
            erro: `Método de pagamento não suportado: ${paymentData.metodo_pagamento}`
          };
      }
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido no processamento'
      };
    }
  }

  /**
   * Processa pagamento em dinheiro
   */
  private async processCashPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Simular processamento
    await this.simulateProcessingDelay(500);

    const transactionId = this.generateTransactionId();
    const referenceNumber = this.generateReferenceNumber();

    return {
      sucesso: true,
      transacao_id: transactionId,
      numero_referencia: referenceNumber,
      comprovante: this.generateReceiptText(paymentData, transactionId, referenceNumber)
    };
  }

  /**
   * Processa pagamento com cartão
   */
  private async processCardPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Simular comunicação com terminal
    await this.simulateProcessingDelay(2000);

    // Simular falha ocasional (5% de chance)
    if (Math.random() < 0.05) {
      return {
        sucesso: false,
        erro: 'Transação negada pelo banco emissor'
      };
    }

    const transactionId = this.generateTransactionId();
    const referenceNumber = this.generateReferenceNumber();
    const authorizationNumber = this.generateAuthorizationNumber();

    // Simular dados do cartão
    const cardData = paymentData.dados_cartao || {
      bandeira: 'Visa',
      ultimos_digitos: '1234',
      numero_autorizacao: authorizationNumber
    };

    return {
      sucesso: true,
      transacao_id: transactionId,
      numero_referencia: referenceNumber,
      comprovante: this.generateReceiptText(paymentData, transactionId, referenceNumber),
      dados_adicionais: {
        numero_autorizacao: authorizationNumber,
        ...cardData
      }
    };
  }

  /**
   * Processa pagamento via PIX
   */
  private async processPixPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Gerar QR Code PIX
    const qrCode = await this.generatePixQR(paymentData.valor_total);
    const pixKey = this.generatePixKey();

    // Simular processamento PIX
    await this.simulateProcessingDelay(1500);

    const transactionId = this.generateTransactionId();
    const referenceNumber = this.generateReferenceNumber();

    return {
      sucesso: true,
      transacao_id: transactionId,
      numero_referencia: referenceNumber,
      comprovante: this.generateReceiptText(paymentData, transactionId, referenceNumber),
      dados_adicionais: {
        qr_code: qrCode,
        chave_pix: pixKey
      }
    };
  }

  /**
   * Processa pagamento com crédito de membro
   */
  private async processMemberCreditPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Validar crédito do membro (simulado)
    const memberId = paymentData.dados_membro?.membro_id;
    if (!memberId) {
      return {
        sucesso: false,
        erro: 'ID do membro não fornecido'
      };
    }

    const hasCredit = await this.validateMemberCredit(memberId, paymentData.valor_total);
    if (!hasCredit) {
      return {
        sucesso: false,
        erro: 'Saldo insuficiente na conta do membro'
      };
    }

    await this.simulateProcessingDelay(1000);

    const transactionId = this.generateTransactionId();
    const referenceNumber = this.generateReferenceNumber();

    return {
      sucesso: true,
      transacao_id: transactionId,
      numero_referencia: referenceNumber,
      comprovante: this.generateReceiptText(paymentData, transactionId, referenceNumber)
    };
  }

  /**
   * Processa pagamento via transferência
   */
  private async processTransferPayment(paymentData: PaymentData): Promise<PaymentResult> {
    await this.simulateProcessingDelay(3000);

    // Simular falha ocasional (10% de chance)
    if (Math.random() < 0.1) {
      return {
        sucesso: false,
        erro: 'Falha na comunicação com o banco'
      };
    }

    const transactionId = this.generateTransactionId();
    const referenceNumber = this.generateReferenceNumber();

    return {
      sucesso: true,
      transacao_id: transactionId,
      numero_referencia: referenceNumber,
      comprovante: this.generateReceiptText(paymentData, transactionId, referenceNumber)
    };
  }

  /**
   * Gera QR Code para pagamento PIX
   */
  async generatePixQR(amount: number): Promise<string> {
    // Simular geração de QR Code PIX
    const pixData = {
      version: '01',
      initMethod: '12',
      merchantAccount: '0014BR.GOV.BCB.PIX',
      merchantName: 'AABB RESTAURANTE',
      merchantCity: 'SAO PAULO',
      amount: amount.toFixed(2),
      currency: 'BRL',
      countryCode: 'BR'
    };

    // Gerar string do QR Code (simulado)
    const qrString = `00020126${pixData.initMethod}${pixData.merchantAccount}52040000530398654${pixData.amount.padStart(10, '0')}5802BR5913${pixData.merchantName}6009${pixData.merchantCity}62070503***6304`;
    
    return qrString + this.calculateCRC16(qrString);
  }

  /**
   * Valida crédito de membro
   */
  async validateMemberCredit(memberId: string, amount: number): Promise<boolean> {
    // Simular consulta ao sistema de membros
    await this.simulateProcessingDelay(500);
    
    // Simular saldos diferentes para diferentes membros
    const memberBalances: Record<string, number> = {
      'member-001': 500.00,
      'member-002': 150.00,
      'member-003': 1000.00,
      'member-004': 50.00
    };

    const balance = memberBalances[memberId] || 0;
    return balance >= amount;
  }

  /**
   * Emite comprovante de pagamento
   */
  async issueReceipt(transaction: Transaction): Promise<Receipt> {
    const receipt: Receipt = {
      id: `REC-${Date.now()}`,
      transacao_id: transaction.id,
      numero_recibo: this.generateReceiptNumber(),
      data_emissao: new Date().toISOString(),
      valor: transaction.valor,
      metodo_pagamento: transaction.metodo_pagamento,
      itens: [], // Seria preenchido com os itens da comanda
      observacoes: transaction.observacoes
    };

    return receipt;
  }

  /**
   * Valida dados de pagamento
   */
  private validatePaymentData(paymentData: PaymentData): PaymentValidationResult {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validar valor
    if (paymentData.valor_total <= 0) {
      erros.push('Valor do pagamento deve ser maior que zero');
    }

    // Validar método de pagamento
    const metodosValidos: PaymentMethod[] = [
      'dinheiro', 'cartao_debito', 'cartao_credito', 
      'pix', 'credito_membro', 'transferencia'
    ];
    
    if (!metodosValidos.includes(paymentData.metodo_pagamento)) {
      erros.push('Método de pagamento inválido');
    }

    // Validações específicas por método
    switch (paymentData.metodo_pagamento) {
      case 'credito_membro':
        if (!paymentData.dados_membro?.membro_id) {
          erros.push('ID do membro é obrigatório para pagamento com crédito');
        }
        break;
      
      case 'cartao_debito':
      case 'cartao_credito':
        if (paymentData.valor_total > 5000) {
          avisos.push('Valor alto para pagamento com cartão - confirme com o cliente');
        }
        break;
      
      case 'pix':
        if (paymentData.valor_total > 1000) {
          avisos.push('Valor alto para PIX - verifique limites do cliente');
        }
        break;
    }

    // Validar comissão
    if (paymentData.percentual_comissao < 0 || paymentData.percentual_comissao > 30) {
      erros.push('Percentual de comissão deve estar entre 0% e 30%');
    }

    return {
      valido: erros.length === 0,
      metodo_disponivel: true, // Simular que todos os métodos estão disponíveis
      valor_suficiente: true,  // Validação específica seria feita em cada método
      dados_completos: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Gera ID único para transação
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const counter = this.transactionCounter++;
    return `TXN-${timestamp}-${counter.toString().padStart(4, '0')}`;
  }

  /**
   * Gera número de referência
   */
  private generateReferenceNumber(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /**
   * Gera número de autorização para cartão
   */
  private generateAuthorizationNumber(): string {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  /**
   * Gera chave PIX simulada
   */
  private generatePixKey(): string {
    return `pix-${Math.random().toString(36).substr(2, 12)}@aabb.com.br`;
  }

  /**
   * Gera número do comprovante
   */
  private generateReceiptNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `${dateStr}${sequence}`;
  }

  /**
   * Gera texto do comprovante
   */
  private generateReceiptText(
    paymentData: PaymentData, 
    transactionId: string, 
    referenceNumber: string
  ): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    return `
=================================
       AABB RESTAURANTE
=================================
Data: ${dateStr}  Hora: ${timeStr}
Transação: ${transactionId}
Referência: ${referenceNumber}
---------------------------------
Valor: R$ ${paymentData.valor_total.toFixed(2)}
Comissão: R$ ${paymentData.valor_comissao.toFixed(2)}
Método: ${this.getPaymentMethodLabel(paymentData.metodo_pagamento)}
---------------------------------
${paymentData.observacoes || ''}
=================================
    OBRIGADO PELA PREFERÊNCIA!
=================================
    `.trim();
  }

  /**
   * Obtém label do método de pagamento
   */
  private getPaymentMethodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      dinheiro: 'DINHEIRO',
      cartao_debito: 'CARTÃO DÉBITO',
      cartao_credito: 'CARTÃO CRÉDITO',
      pix: 'PIX',
      credito_membro: 'CRÉDITO MEMBRO',
      transferencia: 'TRANSFERÊNCIA'
    };
    return labels[method] || method.toUpperCase();
  }

  /**
   * Simula delay de processamento
   */
  private async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calcula CRC16 para QR Code PIX (simulado)
   */
  private calculateCRC16(data: string): string {
    // Implementação simplificada do CRC16
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Obtém estatísticas de pagamentos
   */
  async getPaymentStatistics(): Promise<{
    total_transacoes: number;
    valor_total_processado: number;
    metodos_mais_usados: { metodo: PaymentMethod; quantidade: number }[];
    taxa_sucesso: number;
  }> {
    // Simular estatísticas
    return {
      total_transacoes: 150,
      valor_total_processado: 12500.00,
      metodos_mais_usados: [
        { metodo: 'cartao_debito', quantidade: 45 },
        { metodo: 'pix', quantidade: 38 },
        { metodo: 'dinheiro', quantidade: 32 },
        { metodo: 'cartao_credito', quantidade: 25 },
        { metodo: 'credito_membro', quantidade: 8 },
        { metodo: 'transferencia', quantidade: 2 }
      ],
      taxa_sucesso: 0.95
    };
  }
}