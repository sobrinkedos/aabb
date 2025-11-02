import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme';

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fade',
}) => {
  const getAnimation = () => {
    switch (type) {
      case 'fade':
        return {
          from: { opacity: 0 },
          animate: { opacity: 1 },
        };
      case 'slide':
        return {
          from: { opacity: 0, translateX: 50 },
          animate: { opacity: 1, translateX: 0 },
        };
      case 'scale':
        return {
          from: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
        };
      case 'slideUp':
        return {
          from: { opacity: 0, translateY: 50 },
          animate: { opacity: 1, translateY: 0 },
        };
      default:
        return {
          from: { opacity: 0 },
          animate: { opacity: 1 },
        };
    }
  };

  const animation = getAnimation();

  return (
    <MotiView
      {...animation}
      transition={{
        type: 'timing',
        duration: 400,
      }}
      style={styles.container}
    >
      {children}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
