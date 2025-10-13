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
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Badge,
  useToast,
  Divider
} from '@chakra-ui/react';
import { 
  CashSupplyData, 
  CashWithdrawalData,
  CashMovementType,
  CashMovementPurpose,
  CASH_MOVEMENT_PURPOSE_LABELS,
  DEFAULT_CASH_LIMITS
} from '../../../types/cash-management';
import { useCashManagement } from '../../../hooks/useCashManagement';
import { checkSangriaRequired } from '../../../schemas/cash-movement.schemas';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementType: CashMovementType;
  currentBalance?: number;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  movementType,
  currentBalance = 0
}) => {
  const toast = useToast();
  const { processCashSupply, processCashWithdrawalAdvanced, generateMovementReceipt } = useCashManagement();

  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    sourceOrDestination: '',
    purpose: 'change_fund' as CashMovementPurpose,
    recipient: '',
    reference_number: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sangriaAlert = movementType === 'supply' ? null : checkSangriaRequired(currentBalance);

  useEffect(() => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setValidationError(null);
      setRequiresApproval(false);
      return;
    }

    if (movementType === 'supply') {
      if (amount > DEFAULT_CASH_LIMITS.MAX_SUPPLY_WITHOUT_APPROVAL) {
        setRequiresApproval(true);
        setValidationError(`Suprimentos acima de R$ ${DEFAULT_CASH_LIMITS.MAX_SUPPLY_WITHOUT_APPROVAL} requerem autorização de supervisor`);
      } else {
        setRequiresApproval(false);
        setValidationError(null);
      }
    } else if (movementType === 'withdrawal') {
      const remainingBalance = currentBalance - amount;
      if (remainingBalance < 0) {
        setValidationError('Saldo insuficiente para realizar a sangria');
        return;
      }
      if (remainingBalance < DEFAULT_CASH_LIMITS.MIN_CASH_BALANCE) {
        setValidationError(`A sangria deixaria o caixa abaixo do saldo mínimo recomendado (R$ ${DEFAULT_CASH_LIMITS.MIN_CASH_BALANCE})`);
        return;
      }

      if (amount > DEFAULT_CASH_LIMITS.SUPERVISOR_APPROVAL_THRESHOLD) {
        setRequiresApproval(true);
        setValidationError(`Sangrias acima de R$ ${DEFAULT_CASH_LIMITS.SUPERVISOR_APPROVAL_THRESHOLD} requerem autorização de supervisor`);
      } else {
        setRequiresApproval(false);
        setValidationError(null);
      }
    }
  }, [formData.amount, movementType, currentBalance]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Valor inválido');
      }

      if (!formData.reason.trim()) {
        throw new Error('Justificativa é obrigatória');
      }

      if (!formData.sourceOrDestination.trim()) {
        throw new Error(movementType === 'supply' ? 'Origem é obrigatória' : 'Destino é obrigatório');
      }

      let movementId: string;

      if (movementType === 'supply') {
        const supplyData: CashSupplyData = {
          amount,
          reason: formData.reason,
          source: formData.sourceOrDestination,
          purpose: formData.purpose,
          reference_number: formData.reference_number || undefined,
          notes: formData.notes || undefined
        };

        movementId = await processCashSupply(supplyData);
      } else {
        const withdrawalData: CashWithdrawalData = {
          amount,
          reason: formData.reason,
          destination: formData.sourceOrDestination,
          purpose: formData.purpose,
          recipient: formData.recipient || undefined,
          reference_number: formData.reference_number || undefined,
          notes: formData.notes || undefined
        };

        movementId = await processCashWithdrawalAdvanced(withdrawalData);
      }

      const receipt = await generateMovementReceipt(movementId);

      toast({
        title: movementType === 'supply' ? 'Suprimento realizado' : 'Sangria realizada',
        description: receipt ? `Comprovante: ${receipt.receipt_number}` : 'Movimentação registrada com sucesso',
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      handleClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao processar movimentação',
        description: error.message || 'Erro desconhecido',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      reason: '',
      sourceOrDestination: '',
      purpose: 'change_fund',
      recipient: '',
      reference_number: '',
      notes: ''
    });
    setValidationError(null);
    setRequiresApproval(false);
    onClose();
  };

  const isSupply = movementType === 'supply';
  const title = isSupply ? 'Suprimento de Caixa' : 'Sangria de Caixa';
  const icon = isSupply ? '➕' : '➖';
  const colorScheme = isSupply ? 'green' : 'red';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Text fontSize="2xl">{icon}</Text>
            <Text>{title}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {sangriaAlert && sangriaAlert.required && (
              <Alert status={sangriaAlert.severity === 'critical' ? 'error' : 'warning'}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription>{sangriaAlert.message}</AlertDescription>
                </Box>
              </Alert>
            )}

            <Box p={4} bg="gray.50" borderRadius="md">
              <HStack justify="space-between">
                <Text fontWeight="bold">Saldo Atual do Caixa:</Text>
                <Text fontSize="xl" fontWeight="bold" color={colorScheme + '.600'}>
                  R$ {currentBalance.toFixed(2)}
                </Text>
              </HStack>
            </Box>

            <FormControl isRequired>
              <FormLabel>Valor</FormLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>{isSupply ? 'Origem' : 'Destino'}</FormLabel>
              <Input
                placeholder={isSupply ? 'Ex: Tesouraria, Banco' : 'Ex: Cofre, Banco'}
                value={formData.sourceOrDestination}
                onChange={(e) => setFormData({ ...formData, sourceOrDestination: e.target.value })}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Propósito</FormLabel>
              <Select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as CashMovementPurpose })}
              >
                {Object.entries(CASH_MOVEMENT_PURPOSE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Justificativa</FormLabel>
              <Textarea
                placeholder="Descreva o motivo da movimentação"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </FormControl>

            {!isSupply && (
              <FormControl>
                <FormLabel>Destinatário</FormLabel>
                <Input
                  placeholder="Nome do responsável pelo recebimento"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Número de Referência</FormLabel>
              <Input
                placeholder="Ex: Número do comprovante, nota fiscal"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Observações</FormLabel>
              <Textarea
                placeholder="Informações adicionais (opcional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </FormControl>

            {validationError && (
              <Alert status={requiresApproval ? 'warning' : 'error'}>
                <AlertIcon />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {requiresApproval && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Autorização Necessária</AlertTitle>
                  <AlertDescription>
                    Esta movimentação requer autorização de um supervisor.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            colorScheme={colorScheme}
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={!!validationError && !requiresApproval}
          >
            {isSupply ? 'Realizar Suprimento' : 'Realizar Sangria'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
