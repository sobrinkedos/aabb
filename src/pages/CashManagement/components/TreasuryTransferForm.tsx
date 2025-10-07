import React, { useState } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Text,
  Box,
  Alert,
  AlertIcon,
  Switch,
  Badge
} from '@chakra-ui/react';
import { FiTrendingUp } from 'react-icons/fi';
import { TreasuryTransferData } from '../../../types/cash-management';
import { useAuth } from '../../../contexts/AuthContextSimple';

interface TreasuryTransferFormProps {
  currentBalance: number;
  onTransferChange: (transfer: TreasuryTransferData | undefined) => void;
}

export const TreasuryTransferForm: React.FC<TreasuryTransferFormProps> = ({
  currentBalance,
  onTransferChange
}) => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [formData, setFormData] = useState<TreasuryTransferData>({
    amount: 0,
    destination: 'cofre',
    authorized_by: user?.id || '',
    recipient_name: '',
    receipt_number: '',
    notes: ''
  });

  const handleChange = (field: keyof TreasuryTransferData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    
    if (enabled && updated.amount > 0 && updated.destination) {
      onTransferChange(updated);
    } else {
      onTransferChange(undefined);
    }
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked && formData.amount > 0 && formData.destination) {
      onTransferChange(formData);
    } else {
      onTransferChange(undefined);
    }
  };

  const remainingBalance = currentBalance - formData.amount;

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <HStack>
          <FiTrendingUp size={20} />
          <Text fontSize="lg" fontWeight="bold">
            Transferência para Tesouraria
          </Text>
        </HStack>
        <HStack>
          <Text fontSize="sm">Registrar transferência</Text>
          <Switch
            isChecked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            colorScheme="green"
          />
        </HStack>
      </HStack>

      {!enabled ? (
        <Alert status="info">
          <AlertIcon />
          <Text fontSize="sm">
            Ative esta opção se você transferiu dinheiro do caixa para a tesouraria
          </Text>
        </Alert>
      ) : (
        <>
          <Box p={4} bg="gray.50" borderRadius="md">
            <HStack spacing={8}>
              <Box>
                <Text fontSize="sm" color="gray.600">Saldo do Caixa</Text>
                <Text fontSize="xl" fontWeight="bold">
                  R$ {currentBalance.toFixed(2)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Valor a Transferir</Text>
                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                  R$ {formData.amount.toFixed(2)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600">Saldo Restante</Text>
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={remainingBalance >= 0 ? 'green.600' : 'red.600'}
                >
                  R$ {remainingBalance.toFixed(2)}
                </Text>
              </Box>
            </HStack>
          </Box>

          {remainingBalance < 0 && (
            <Alert status="error">
              <AlertIcon />
              <Text fontSize="sm">
                O valor da transferência não pode ser maior que o saldo do caixa
              </Text>
            </Alert>
          )}

          <FormControl isRequired>
            <FormLabel>Valor a Transferir</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Destino</FormLabel>
            <Select
              value={formData.destination}
              onChange={(e) => handleChange('destination', e.target.value)}
            >
              <option value="cofre">Cofre</option>
              <option value="banco">Banco</option>
              <option value="tesouraria_central">Tesouraria Central</option>
              <option value="outro">Outro</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Responsável pelo Recebimento</FormLabel>
            <Input
              value={formData.recipient_name}
              onChange={(e) => handleChange('recipient_name', e.target.value)}
              placeholder="Nome do responsável"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Número do Comprovante</FormLabel>
            <Input
              value={formData.receipt_number}
              onChange={(e) => handleChange('receipt_number', e.target.value)}
              placeholder="Ex: COMP-2025-001"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Observações</FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Informações adicionais sobre a transferência"
              rows={3}
            />
          </FormControl>

          <Alert status="success">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="bold">
                Transferência será registrada
              </Text>
              <Text fontSize="xs" color="gray.600">
                Esta operação ficará registrada no histórico de auditoria
              </Text>
            </Box>
          </Alert>
        </>
      )}
    </VStack>
  );
};
