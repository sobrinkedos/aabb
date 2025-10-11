import { useCallback, useRef, useState } from 'react';

export interface NotificationSound {
  play: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isEnabled: boolean;
  toggle: () => void;
}

export const useNotificationSound = (): NotificationSound => {
  const [isEnabled, setIsEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializar AudioContext quando necessário
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Criar som de notificação usando Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!isEnabled) return;

    try {
      const audioContext = getAudioContext();
      
      // Criar um som agradável de notificação (dois beeps)
      const playBeep = (frequency: number, duration: number, delay: number = 0) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      // Tocar dois beeps harmoniosos
      playBeep(800, 0.2, 0);    // Primeiro beep
      playBeep(1000, 0.3, 200); // Segundo beep mais alto

    } catch (error) {
      console.warn('Erro ao reproduzir som de notificação:', error);
      
      // Fallback para navegadores que não suportam Web Audio API
      try {
        // Criar elemento de áudio temporário com data URL
        const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcCTSNzPLOdSUGMIMcaYOlhAAAaYOlhAAAaYOlhAAAaYOlhAAAAA==';
        const audio = new Audio(audioData);
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Se mesmo o fallback falhar, usar beep do sistema
          console.log('🔔 Pedido pronto!');
        });
      } catch (fallbackError) {
        console.log('🔔 Pedido pronto!');
      }
    }
  }, [isEnabled, getAudioContext]);

  const stopSound = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    // Para implementação futura - ajustar volume do gainNode
    console.log('Volume definido para:', volume);
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    play: playNotificationSound,
    stop: stopSound,
    setVolume,
    isEnabled,
    toggle
  };
};