export * from './colors';
export * from './spacing';

import { colors } from './colors';
import { spacing, borderRadius, shadows } from './spacing';

export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
