/**
 * Utilitários para manipulação de datas com fuso horário correto
 * Garante que todas as datas sejam tratadas no fuso horário de Brasília (America/Sao_Paulo)
 */

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data atual no fuso horário de Brasília
 */
export const getToday = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
};

/**
 * Obtém a data de hoje no formato YYYY-MM-DD para inputs de data
 */
export const getTodayString = (): string => {
  const today = getToday();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtém o início do dia atual no fuso horário de Brasília
 */
export const getStartOfToday = (): Date => {
  const today = getToday();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Obtém o fim do dia atual no fuso horário de Brasília
 */
export const getEndOfToday = (): Date => {
  const today = getToday();
  today.setHours(23, 59, 59, 999);
  return today;
};

/**
 * Converte uma data para o início do dia no fuso horário de Brasília
 */
export const getStartOfDay = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  localDate.setHours(0, 0, 0, 0);
  return localDate;
};

/**
 * Converte uma data para o fim do dia no fuso horário de Brasília
 */
export const getEndOfDay = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const localDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  localDate.setHours(23, 59, 59, 999);
  return localDate;
};

/**
 * Formata uma data para exibição no formato brasileiro
 */
export const formatDateBR = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { timeZone: TIMEZONE });
};

/**
 * Formata uma data e hora para exibição no formato brasileiro
 */
export const formatDateTimeBR = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { timeZone: TIMEZONE });
};

/**
 * Formata apenas a hora no formato brasileiro
 */
export const formatTimeBR = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', { 
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Verifica se uma data é hoje
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = getTodayString();
  const dateStr = d.toISOString().split('T')[0];
  return dateStr === today;
};

/**
 * Obtém a data/hora atual no formato ISO para o banco de dados
 * Mas ajustada para o fuso horário de Brasília
 */
export const getNowISO = (): string => {
  return getToday().toISOString();
};

/**
 * Converte uma string de data YYYY-MM-DD para Date no fuso horário correto
 */
export const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date;
};
