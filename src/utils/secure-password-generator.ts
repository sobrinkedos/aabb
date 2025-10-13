/**
 * Gerador de Senhas Seguras
 * 
 * Sistema avançado para geração de senhas temporárias seguras
 * com diferentes níveis de complexidade e validação.
 * 
 * @version 1.0.0
 */

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

export interface PasswordConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  minUppercase?: number;
  minLowercase?: number;
  minNumbers?: number;
  minSymbols?: number;
}

export interface PasswordStrength {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  estimatedCrackTime: string;
  entropy: number;
}

export interface GeneratedPassword {
  password: string;
  strength: PasswordStrength;
  config: PasswordConfig;
  generatedAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// CONFIGURAÇÕES PREDEFINIDAS
// ============================================================================

export const PASSWORD_PRESETS: Record<string, PasswordConfig> = {
  // Para funcionários operacionais (mais simples de lembrar)
  employee: {
    length: 10,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true,
    excludeAmbiguous: true,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 2
  },

  // Para gerentes (mais segura)
  manager: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    excludeAmbiguous: true,
    minUppercase: 2,
    minLowercase: 2,
    minNumbers: 2,
    minSymbols: 1
  },

  // Para administradores (máxima segurança)
  admin: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    excludeAmbiguous: false,
    minUppercase: 3,
    minLowercase: 3,
    minNumbers: 3,
    minSymbols: 2
  },

  // Para acesso temporário (fácil de digitar)
  temporary: {
    length: 8,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true,
    excludeAmbiguous: true,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 2
  }
};

// ============================================================================
// CONJUNTOS DE CARACTERES
// ============================================================================

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'il1Lo0O', // Caracteres similares que podem confundir
  ambiguous: '{}[]()/\\\'"`~,;.<>' // Caracteres ambíguos
};

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class SecurePasswordGenerator {
  private static instance: SecurePasswordGenerator;

  private constructor() {}

  static getInstance(): SecurePasswordGenerator {
    if (!SecurePasswordGenerator.instance) {
      SecurePasswordGenerator.instance = new SecurePasswordGenerator();
    }
    return SecurePasswordGenerator.instance;
  }

  /**
   * Gera uma senha segura baseada na configuração
   */
  generatePassword(config: PasswordConfig): GeneratedPassword {
    let charset = this.buildCharset(config);
    let password = '';

    // Garantir requisitos mínimos
    password += this.generateRequiredChars(config);
    
    // Preencher o resto aleatoriamente
    const remainingLength = config.length - password.length;
    for (let i = 0; i < remainingLength; i++) {
      password += charset[this.getSecureRandomInt(0, charset.length - 1)];
    }

    // Embaralhar a senha
    password = this.shuffleString(password);

    // Validar e regenerar se necessário
    if (!this.validatePassword(password, config)) {
      return this.generatePassword(config); // Recursão para garantir conformidade
    }

    const strength = this.calculatePasswordStrength(password);

    return {
      password,
      strength,
      config,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
    };
  }

  /**
   * Gera senha usando preset
   */
  generatePasswordFromPreset(presetName: keyof typeof PASSWORD_PRESETS): GeneratedPassword {
    const config = PASSWORD_PRESETS[presetName];
    if (!config) {
      throw new Error(`Preset não encontrado: ${presetName}`);
    }
    return this.generatePassword(config);
  }

  /**
   * Gera senha baseada na função do funcionário
   */
  generatePasswordForRole(role: string): GeneratedPassword {
    const rolePresetMap: Record<string, keyof typeof PASSWORD_PRESETS> = {
      'gerente': 'manager',
      'administrador': 'admin',
      'atendente': 'employee',
      'garcom': 'employee',
      'cozinheiro': 'employee',
      'barman': 'employee'
    };

    const preset = rolePresetMap[role.toLowerCase()] || 'employee';
    return this.generatePasswordFromPreset(preset);
  }

  /**
   * Constrói conjunto de caracteres baseado na configuração
   */
  private buildCharset(config: PasswordConfig): string {
    let charset = '';

    if (config.includeUppercase) charset += CHAR_SETS.uppercase;
    if (config.includeLowercase) charset += CHAR_SETS.lowercase;
    if (config.includeNumbers) charset += CHAR_SETS.numbers;
    if (config.includeSymbols) charset += CHAR_SETS.symbols;

    // Remover caracteres similares se solicitado
    if (config.excludeSimilar) {
      charset = charset.split('').filter(char => !CHAR_SETS.similar.includes(char)).join('');
    }

    // Remover caracteres ambíguos se solicitado
    if (config.excludeAmbiguous) {
      charset = charset.split('').filter(char => !CHAR_SETS.ambiguous.includes(char)).join('');
    }

    return charset;
  }

  /**
   * Gera caracteres obrigatórios baseados nos requisitos mínimos
   */
  private generateRequiredChars(config: PasswordConfig): string {
    let required = '';

    if (config.minUppercase && config.includeUppercase) {
      const chars = config.excludeSimilar 
        ? CHAR_SETS.uppercase.split('').filter(c => !CHAR_SETS.similar.includes(c))
        : CHAR_SETS.uppercase.split('');
      
      for (let i = 0; i < config.minUppercase; i++) {
        required += chars[this.getSecureRandomInt(0, chars.length - 1)];
      }
    }

    if (config.minLowercase && config.includeLowercase) {
      const chars = config.excludeSimilar 
        ? CHAR_SETS.lowercase.split('').filter(c => !CHAR_SETS.similar.includes(c))
        : CHAR_SETS.lowercase.split('');
      
      for (let i = 0; i < config.minLowercase; i++) {
        required += chars[this.getSecureRandomInt(0, chars.length - 1)];
      }
    }

    if (config.minNumbers && config.includeNumbers) {
      const chars = config.excludeSimilar 
        ? CHAR_SETS.numbers.split('').filter(c => !CHAR_SETS.similar.includes(c))
        : CHAR_SETS.numbers.split('');
      
      for (let i = 0; i < config.minNumbers; i++) {
        required += chars[this.getSecureRandomInt(0, chars.length - 1)];
      }
    }

    if (config.minSymbols && config.includeSymbols) {
      const chars = config.excludeAmbiguous 
        ? CHAR_SETS.symbols.split('').filter(c => !CHAR_SETS.ambiguous.includes(c))
        : CHAR_SETS.symbols.split('');
      
      for (let i = 0; i < config.minSymbols; i++) {
        required += chars[this.getSecureRandomInt(0, chars.length - 1)];
      }
    }

    return required;
  }

  /**
   * Embaralha uma string de forma segura
   */
  private shuffleString(str: string): string {
    const array = str.split('');
    
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.getSecureRandomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    
    return array.join('');
  }

  /**
   * Gera número aleatório seguro
   */
  private getSecureRandomInt(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const randomBytes = new Uint8Array(bytesNeeded);
    
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomBytes);
    } else {
      // Fallback para Node.js
      const crypto = require('crypto');
      crypto.randomFillSync(randomBytes);
    }
    
    let randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
    
    if (randomValue >= maxValue - (maxValue % range)) {
      return this.getSecureRandomInt(min, max); // Retry para evitar bias
    }
    
    return min + (randomValue % range);
  }

  /**
   * Valida se a senha atende aos requisitos
   */
  private validatePassword(password: string, config: PasswordConfig): boolean {
    if (password.length !== config.length) return false;

    const counts = {
      uppercase: (password.match(/[A-Z]/g) || []).length,
      lowercase: (password.match(/[a-z]/g) || []).length,
      numbers: (password.match(/[0-9]/g) || []).length,
      symbols: (password.match(/[^A-Za-z0-9]/g) || []).length
    };

    if (config.minUppercase && counts.uppercase < config.minUppercase) return false;
    if (config.minLowercase && counts.lowercase < config.minLowercase) return false;
    if (config.minNumbers && counts.numbers < config.minNumbers) return false;
    if (config.minSymbols && counts.symbols < config.minSymbols) return false;

    return true;
  }

  /**
   * Calcula a força da senha
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    let score = 0;
    const feedback: string[] = [];

    // Comprimento
    if (password.length >= 12) {
      score += 25;
    } else if (password.length >= 8) {
      score += 15;
      feedback.push('Considere usar pelo menos 12 caracteres');
    } else {
      score += 5;
      feedback.push('Senha muito curta, use pelo menos 8 caracteres');
    }

    // Variedade de caracteres
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    const variety = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
    score += variety * 15;

    if (variety < 3) {
      feedback.push('Use uma combinação de letras, números e símbolos');
    }

    // Padrões comuns
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Evite repetir o mesmo caractere');
    }

    if (/123|abc|qwe/i.test(password)) {
      score -= 15;
      feedback.push('Evite sequências óbvias');
    }

    // Entropia
    const entropy = this.calculateEntropy(password);
    if (entropy > 60) {
      score += 20;
    } else if (entropy > 40) {
      score += 10;
    }

    // Normalizar score
    score = Math.max(0, Math.min(100, score));

    // Determinar nível
    let level: PasswordStrength['level'];
    if (score >= 90) level = 'very-strong';
    else if (score >= 75) level = 'strong';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else if (score >= 20) level = 'weak';
    else level = 'very-weak';

    // Estimar tempo de quebra
    const estimatedCrackTime = this.estimateCrackTime(entropy);

    return {
      score,
      level,
      feedback,
      estimatedCrackTime,
      entropy
    };
  }

  /**
   * Calcula a entropia da senha
   */
  private calculateEntropy(password: string): number {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^A-Za-z0-9]/.test(password)) charsetSize += 32;

    return password.length * Math.log2(charsetSize);
  }

  /**
   * Estima tempo para quebrar a senha
   */
  private estimateCrackTime(entropy: number): string {
    const guessesPerSecond = 1e9; // 1 bilhão de tentativas por segundo
    const secondsToBreak = Math.pow(2, entropy - 1) / guessesPerSecond;

    if (secondsToBreak < 60) return 'menos de 1 minuto';
    if (secondsToBreak < 3600) return `${Math.round(secondsToBreak / 60)} minutos`;
    if (secondsToBreak < 86400) return `${Math.round(secondsToBreak / 3600)} horas`;
    if (secondsToBreak < 31536000) return `${Math.round(secondsToBreak / 86400)} dias`;
    if (secondsToBreak < 31536000000) return `${Math.round(secondsToBreak / 31536000)} anos`;
    
    return 'séculos';
  }

  /**
   * Gera múltiplas opções de senha
   */
  generatePasswordOptions(config: PasswordConfig, count: number = 3): GeneratedPassword[] {
    const options: GeneratedPassword[] = [];
    
    for (let i = 0; i < count; i++) {
      options.push(this.generatePassword(config));
    }

    // Ordenar por força (mais forte primeiro)
    return options.sort((a, b) => b.strength.score - a.strength.score);
  }

  /**
   * Verifica se a senha expirou
   */
  isPasswordExpired(generatedPassword: GeneratedPassword): boolean {
    if (!generatedPassword.expiresAt) return false;
    return new Date() > generatedPassword.expiresAt;
  }

  /**
   * Gera senha memorável (usando palavras + números)
   */
  generateMemorablePassword(wordCount: number = 3, includeNumbers: boolean = true): GeneratedPassword {
    // Lista de palavras simples e seguras
    const words = [
      'casa', 'gato', 'sol', 'mar', 'flor', 'lua', 'rio', 'paz', 'luz', 'cor',
      'vida', 'amor', 'tempo', 'mundo', 'terra', 'agua', 'fogo', 'vento', 'ceu', 'estrela'
    ];

    let password = '';
    
    for (let i = 0; i < wordCount; i++) {
      const word = words[this.getSecureRandomInt(0, words.length - 1)];
      password += word.charAt(0).toUpperCase() + word.slice(1);
      
      if (includeNumbers && i < wordCount - 1) {
        password += this.getSecureRandomInt(10, 99);
      }
    }

    if (includeNumbers) {
      password += this.getSecureRandomInt(10, 99);
    }

    const strength = this.calculatePasswordStrength(password);

    return {
      password,
      strength,
      config: {
        length: password.length,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: includeNumbers,
        includeSymbols: false,
        excludeSimilar: true,
        excludeAmbiguous: true
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON E FUNÇÕES UTILITÁRIAS
// ============================================================================

export const passwordGenerator = SecurePasswordGenerator.getInstance();

/**
 * Função utilitária para gerar senha rápida
 */
export function generateSecurePassword(role: string = 'employee'): GeneratedPassword {
  return passwordGenerator.generatePasswordForRole(role);
}

/**
 * Função utilitária para validar força da senha
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  return passwordGenerator.calculatePasswordStrength(password);
}

/**
 * Função utilitária para gerar opções de senha
 */
export function generatePasswordOptions(role: string = 'employee', count: number = 3): GeneratedPassword[] {
  const config = PASSWORD_PRESETS[role] || PASSWORD_PRESETS.employee;
  return passwordGenerator.generatePasswordOptions(config, count);
}

export default passwordGenerator;