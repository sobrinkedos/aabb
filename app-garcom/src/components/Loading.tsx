import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ message, fullScreen = false }) => {
  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 300,
          loop: true,
        }}
      >
        <LinearGradient
          colors={theme.colors.primary.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <ActivityIndicator size="large" color={theme.colors.text.inverse} />
        </LinearGradient>
      </MotiView>
      
      {message && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 200 }}
        >
          <Text style={styles.message}>{message}</Text>
        </MotiView>
      )}
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradientContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.xl,
  },
  message: {
    marginTop: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
