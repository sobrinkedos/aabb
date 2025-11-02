import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = theme.colors.text.primary,
  style,
}) => {
  return <Ionicons name={name} size={size} color={color} style={style} />;
};

// Ícones pré-configurados para uso comum
export const Icons = {
  // Navegação
  home: (props: Omit<IconProps, 'name'>) => <Icon name="home" {...props} />,
  homeOutline: (props: Omit<IconProps, 'name'>) => <Icon name="home-outline" {...props} />,
  menu: (props: Omit<IconProps, 'name'>) => <Icon name="menu" {...props} />,
  close: (props: Omit<IconProps, 'name'>) => <Icon name="close" {...props} />,
  arrowBack: (props: Omit<IconProps, 'name'>) => <Icon name="arrow-back" {...props} />,
  arrowForward: (props: Omit<IconProps, 'name'>) => <Icon name="arrow-forward" {...props} />,
  
  // Ações
  add: (props: Omit<IconProps, 'name'>) => <Icon name="add" {...props} />,
  addCircle: (props: Omit<IconProps, 'name'>) => <Icon name="add-circle" {...props} />,
  remove: (props: Omit<IconProps, 'name'>) => <Icon name="remove" {...props} />,
  edit: (props: Omit<IconProps, 'name'>) => <Icon name="create-outline" {...props} />,
  delete: (props: Omit<IconProps, 'name'>) => <Icon name="trash-outline" {...props} />,
  save: (props: Omit<IconProps, 'name'>) => <Icon name="save-outline" {...props} />,
  search: (props: Omit<IconProps, 'name'>) => <Icon name="search" {...props} />,
  filter: (props: Omit<IconProps, 'name'>) => <Icon name="filter" {...props} />,
  refresh: (props: Omit<IconProps, 'name'>) => <Icon name="refresh" {...props} />,
  
  // Status
  checkmark: (props: Omit<IconProps, 'name'>) => <Icon name="checkmark" {...props} />,
  checkmarkCircle: (props: Omit<IconProps, 'name'>) => <Icon name="checkmark-circle" {...props} />,
  alert: (props: Omit<IconProps, 'name'>) => <Icon name="alert-circle" {...props} />,
  warning: (props: Omit<IconProps, 'name'>) => <Icon name="warning" {...props} />,
  information: (props: Omit<IconProps, 'name'>) => <Icon name="information-circle" {...props} />,
  
  // Restaurante
  restaurant: (props: Omit<IconProps, 'name'>) => <Icon name="restaurant" {...props} />,
  fastFood: (props: Omit<IconProps, 'name'>) => <Icon name="fast-food" {...props} />,
  pizza: (props: Omit<IconProps, 'name'>) => <Icon name="pizza" {...props} />,
  beer: (props: Omit<IconProps, 'name'>) => <Icon name="beer" {...props} />,
  cafe: (props: Omit<IconProps, 'name'>) => <Icon name="cafe" {...props} />,
  
  // Mesas e Comandas
  grid: (props: Omit<IconProps, 'name'>) => <Icon name="grid" {...props} />,
  list: (props: Omit<IconProps, 'name'>) => <Icon name="list" {...props} />,
  receipt: (props: Omit<IconProps, 'name'>) => <Icon name="receipt" {...props} />,
  document: (props: Omit<IconProps, 'name'>) => <Icon name="document-text" {...props} />,
  
  // Usuário
  person: (props: Omit<IconProps, 'name'>) => <Icon name="person" {...props} />,
  personCircle: (props: Omit<IconProps, 'name'>) => <Icon name="person-circle" {...props} />,
  people: (props: Omit<IconProps, 'name'>) => <Icon name="people" {...props} />,
  
  // Outros
  settings: (props: Omit<IconProps, 'name'>) => <Icon name="settings" {...props} />,
  time: (props: Omit<IconProps, 'name'>) => <Icon name="time" {...props} />,
  calendar: (props: Omit<IconProps, 'name'>) => <Icon name="calendar" {...props} />,
  card: (props: Omit<IconProps, 'name'>) => <Icon name="card" {...props} />,
  cash: (props: Omit<IconProps, 'name'>) => <Icon name="cash" {...props} />,
  sync: (props: Omit<IconProps, 'name'>) => <Icon name="sync" {...props} />,
  cloudDone: (props: Omit<IconProps, 'name'>) => <Icon name="cloud-done" {...props} />,
  cloudOffline: (props: Omit<IconProps, 'name'>) => <Icon name="cloud-offline" {...props} />,
};
