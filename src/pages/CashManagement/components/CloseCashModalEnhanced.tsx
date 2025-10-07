import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Divider,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { FiDollarSign, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import {
  CashSessionWithEmployee,
  CashClosingData,
  PaymentMethodBreakdown,
  CashClosingValidation,
  DEFAULT_CASH_LIMITS
} from '../../../types/cash-management';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { PaymentBreakdownTable } from './PaymentBreakdownTable';
import { TreasuryTransferForm } from './TreasuryTransferForm';
import { DiscrepancyHandlingForm } from './DiscrepancyHandlingForm';

interface CloseCashModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashSessionWithEmployee;
}

export const CloseCashModalEnhanced: React.FC<CloseCashModalEnhancedProps> = ({
  isOpen,
  onClose,
  session
}) => {
  const toast = useToast();
  const {
    calculatePaymentBreakdown,
    validateCashClosing,
    closeCashSessionEnhanced
  } = useCashManagement();

  const [loading, setLoading] = useState(false);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [validation, setValidation] = useState<CashClosingValidation | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [formData, setFormData] = useState<CashClosingData>({
    closing_amount: session.expected_amount,
    closing_notes: '',
    reconciliation: []
  });

  // Carregar breakdown ao abrir modal
  useEffect(() => {
    if (isOpen && session) {
      loadPaymentBreakdown();
    }
  }, [isOpen, session]);

  // Validar em tempo real quando valores mudarem
  useEffect(() => {
    if (formData.closing_amount > 0) {
      validateClosing();
    }
  }, [formData.closing_amount, formData.reconciliation]);

  const loadPaymentBreakdown = async () => {
    try {
      setLoadingBreakdown(true);
      const breakdown = await calculatePaymentBreakdown(session.id);
      setPaymentBreakdown(breakdown);

      // Inicializar reconciliação com valores esperados
      const reconciliation = breakdown.map(b => ({
        payment_method: b.payment_method,
        expected_amount: b.expected_amount,
        actual_amount: b.expected_amount, // Iniciar com valor esperado
        transaction_count: b.transaction_count,
        notes: ''
      }));

      setFormData(prev => ({
        ...prev,
        reconciliation
      }));
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const validateClosing = async () => {
    try {
      const result = await validateCashClosing(session.id, formData.closing_amount);
      setValidation(result);
    } catch (error) {
      console.error('Erro ao validar:', error);
    }
  };

  const handleReconciliationChange = (paymentMethod: string, actualAmount: number) => {
    setFormData(prev => ({
      ...prev,
      reconciliation: prev.reconciliation.map(r =>
        r.payment_method === paymentMethod
          ? { ...r, actual_amount: actualAmount }
          : r
      ),
      closing_amount: prev.reconciliation.reduce((sum, r) =>
        r.payment_method === paymentMethod
          ? sum + actualAmount
          : sum + r.actual_amount
      , 0)
    }));
  };

  const handleSubmit = async () => {
    if (!validation?.valid) {
      toast({
        title: 'Validação falhou',
        description: validation?.errors.join(', '),
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      return;
    }

    if (validation.requires_approval && !formData.discrepancy_handling?.approved_by) {
      toast({
        title: 'Aprovação necessária',
        description: 'Discrepância requer aprovação de supervisor',
        status: 'warning',
        duration: 5000,
        isClosable: true
      });
      setActiveTab(2); // Ir para aba de discrepância
      return;
    }

    try {
      setLoading(true);
      const receipt = await closeCashSessionEnhanced(formData);

      toast({
        title: 'Caixa fechado com sucesso',
        description: `Comprovante: ${receipt.receipt_number}`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao fechar caixa',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const getDiscrepancyColor = (discrepancy: number) => {
    const abs = Math.abs(discrepancy);
    if (abs < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_AUTO_ACCEPT) return 'green';
    if (abs < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_WITHOUT_APPROVAL) return 'yellow';
    return 'red';
  };

  const getDiscrepancyLabel = (discrepancy: number) => {
    const abs = Math.abs(discrepancy);
    if (abs < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_AUTO_ACCEPT) return 'Dentro do limite';
    if (abs < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_WITHOUT_APPROVAL) return 'Requer justificativa';
    return 'Requer aprovação';
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <FiDollarSign size={24} />
            <Text>Fechamento de Caixa Aprimorado</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {loadingBreakdown ? (
            <VStack py={10}>
              <Spinner size="xl" />
              <Text>Carregando dados...</Text>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Resumo da Sessão */}
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="lg" fontWeight="bold" mb={3}>Resumo da Sessão</Text>
                <HStack spacing={8}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Abertura</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      R$ {session.opening_amount.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Esperado</Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      R$ {session.expected_amount.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Contado</Text>
                    <Text fontSize="xl" fontWeight="bold" color="green.600">
                      R$ {formData.closing_amount.toFixed(2)}
                    </Text>
                  </Box>
                  {validation && (
                    <Box>
                      <Text fontSize="sm" color="gray.600">Discrepância</Text>
                      <HStack>
                        <Text
                          fontSize="xl"
                          fontWeight="bold"
                          color={`${getDiscrepancyColor(validation.discrepancy)}.600`}
                        >
                          R$ {Math.abs(validation.discrepancy).toFixed(2)}
                        </Text>
                        <Badge colorScheme={getDiscrepancyColor(validation.discrepancy)}>
                          {getDiscrepancyLabel(validation.discrepancy)}
                        </Badge>
                      </HStack>
                    </Box>
                  )}
                </HStack>
              </Box>

              {/* Alertas de Validação */}
              {validation && validation.warnings.length > 0 && (
                <Alert status="warning">
                  <AlertIcon as={FiAlertTriangle} />
                  <Box>
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      <VStack align="start" spacing={1}>
                        {validation.warnings.map((warning, idx) => (
                          <Text key={idx} fontSize="sm">• {warning}</Text>
                        ))}
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {validation && validation.errors.length > 0 && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                      <VStack align="start" spacing={1}>
                        {validation.errors.map((error, idx) => (
                          <Text key={idx} fontSize="sm">• {error}</Text>
                        ))}
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Tabs */}
              <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab>
                    <HStack>
                      <Text>Reconciliação</Text>
                      <Badge colorScheme="blue">{paymentBreakdown.length}</Badge>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack>
                      <Text>Transferência</Text>
                      {formData.treasury_transfer && (
                        <Badge colorScheme="green">✓</Badge>
                      )}
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack>
                      <Text>Discrepância</Text>
                      {validation?.requires_approval && (
                        <Badge colorScheme="red">!</Badge>
                      )}
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Aba 1: Reconciliação */}
                  <TabPanel>
                    <PaymentBreakdownTable
                      breakdown={paymentBreakdown}
                      reconciliation={formData.reconciliation}
                      onReconciliationChange={handleReconciliationChange}
                    />
                  </TabPanel>

                  {/* Aba 2: Transferência */}
                  <TabPanel>
                    <TreasuryTransferForm
                      currentBalance={formData.closing_amount}
                      onTransferChange={(transfer) =>
                        setFormData(prev => ({ ...prev, treasury_transfer: transfer }))
                      }
                    />
                  </TabPanel>

                  {/* Aba 3: Discrepância */}
                  <TabPanel>
                    <DiscrepancyHandlingForm
                      discrepancy={validation?.discrepancy || 0}
                      requiresApproval={validation?.requires_approval || false}
                      onHandlingChange={(handling) =>
                        setFormData(prev => ({ ...prev, discrepancy_handling: handling }))
                      }
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={loading}>
              Cancelar
            </Button>
            <Button
              colorScheme={validation?.requires_approval ? 'red' : 'green'}
              onClick={handleSubmit}
              isLoading={loading}
              isDisabled={!validation?.valid || loadingBreakdown}
              leftIcon={<FiCheckCircle />}
            >
              {validation?.requires_approval ? 'Fechar com Aprovação' : 'Fechar Caixa'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
