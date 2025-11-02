/**
 * Componente de Transição de Tela
 * 
 * Adiciona animações suaves de slide entre telas
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScreenTransitionProps {
  children: React.ReactNode;
  screenKey: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function ScreenTransition({ 
  children, 
  screenKey,
  direction = 'up' 
}: ScreenTransitionProps) {
  const translateX = useRef(new Animated.Value(
    direction === 'right' ? SCREEN_WIDTH : 
    direction === 'left' ? -SCREEN_WIDTH : 0
  )).current;
  
  const translateY = useRef(new Animated.Value(
    direction === 'up' ? SCREEN_HEIGHT : // De baixo para cima (vem de baixo)
    direction === 'down' ? -SCREEN_HEIGHT : 0 // De cima para baixo (vem de cima)
  )).current;
  
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset valores
    translateX.setValue(
      direction === 'right' ? SCREEN_WIDTH : 
      direction === 'left' ? -SCREEN_WIDTH : 0
    );
    translateY.setValue(
      direction === 'up' ? SCREEN_HEIGHT : // De baixo para cima
      direction === 'down' ? -SCREEN_HEIGHT : 0 // De cima para baixo
    );
    opacity.setValue(0);

    // Animar entrada
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenKey]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          transform: [
            { translateX },
            { translateY },
          ],
          opacity,
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
