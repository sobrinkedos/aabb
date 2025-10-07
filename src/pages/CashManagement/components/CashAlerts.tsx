import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Badge,
  useToast
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { CashMovementAlert, RISK_LEVEL_LABELS } from '../../../types/cash-management';
import { useCashManagement } from '../../../hooks/useCashManagement';

export const CashAlerts: React.FC = () => {
  const toast = useToast();
  const { checkCashAlerts, currentSession } = useCashManagement();

  const [alerts, setAlerts] = useState<CashMovementAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await checkCashAlerts();
      setAlerts(data);
    } catch (error: any) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast({
      title: 'Alerta reconhecido',
      status: 'success',
      duration: 2000,
      isClosable: true
    });
  };

  const getAlertStatus = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  };

  if (alerts.length === 0) {
    return (
      <Alert status="success" borderRadius="md">
        <AlertIcon as={FiCheckCircle} />
        <AlertTitle>Tudo certo!</AlertTitle>
        <AlertDescription>Não há alertas no momento.</AlertDescription>
      </Alert>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      <HStack justify="space-between">
        <HStack>
          <FiAlertTriangle />
          <Text fontWeight="bold">Alertas de Caixa</Text>
          <Badge colorScheme="red">{alerts.length}</Badge>
        </HStack>
      </HStack>

      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          status={getAlertStatus(alert.severity)}
          borderRadius="md"
          flexDirection="column"
          alignItems="flex-start"
        >
          <HStack w="100%" justify="space-between" mb={2}>
            <HStack>
              <AlertIcon />
              <Badge colorScheme={alert.severity === 'critical' ? 'red' : 'orange'}>
                {RISK_LEVEL_LABELS[alert.severity]}
              </Badge>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAcknowledge(alert.id)}
            >
              Reconhecer
            </Button>
          </HStack>
          <AlertDescription w="100%">
            <Text fontWeight="bold" mb={1}>{alert.message}</Text>
            {alert.threshold_value && alert.current_value && (
              <Text fontSize="sm" color="gray.600">
                Limite: R$ {alert.threshold_value.toFixed(2)} | 
                Atual: R$ {alert.current_value.toFixed(2)}
              </Text>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </VStack>
  );
};
