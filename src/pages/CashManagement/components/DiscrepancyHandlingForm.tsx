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
  AlertTitle,
  AlertDescription,
  Badge,
  Divider
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';
import { DiscrepancyHandlingData, DEFAULT_CASH_LIMITS } from '../../../types/cash-management';

interface DiscrepancyHandlingFormProps {
  discrepancy: number;
  requiresApproval: boolean;
  onHandlingChange: (handling: DiscrepancyHandlingData | undefined) => void;
}

export const DiscrepancyHandlingForm: React.FC<DiscrepancyHandlingFormProps> = ({
  discrepancy,
  requiresApproval,
  onHandlingChange
}) => {
  const [formData, setFormData] = useState<DiscrepancyHandlingData>({
    discrepancy_amount: discrepancy,
    reason: '',
    action_taken: 'pending',
    approved_by: '',
    resolution_notes: ''
  });

  const handleChange = (field: keyof DiscrepancyHandlingData, value: any) => {
    const updated = { ...formData, [field]: value, discrepancy_amount: discrepancy };
    setFormData(updated);
    
    // Só enviar se tiver motivo preenchido
    if (updated.reason.trim()) {
      onHandlingChange(updated);
    } else {
      onHandlingChange(undefined);
    }
  };

  const getDiscrepancyLevel = () => {
    const abs = Math.abs(discrepancy);
    if (abs < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_AUTO_ACCEPT) {
      return { level: 'low', label: 'Baixa', color: 'green' };
    }
    if (abs < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_WITHOUT_APPROVAL) {
      return { level: 'medium', label: 'Média', color: 'yellow' };
    }
    return { level: 'high', label: 'Alta', color: 'red' };
  };

  const discrepancyLevel = getDiscrepancyLevel();
  const absDiscrepancy = Math.abs(discrepancy);

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <HStack>
          <FiAlertTriangle size={20} />
          <Text fontSize="lg" fontWeight="bold">
            Tratamento de Discrepância
          </Text>
        </HStack>
        <Badge colorScheme={discrepancyLevel.color} fontSize="md" px={3} py={1}>
          {discrepancyLevel.label}
        </Badge>
      </HStack>

      {/* Resumo da Discrepância */}
      <Box p={4} bg={`${discrepancyLevel.color}.50`} borderRadius="md" borderWidth={2} borderColor={`${discrepancyLevel.color}.200`}>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontWeight="bold">Valor da Discrepância:</Text>
            <Text fontSize="2xl" fontWeight="bold" color={`${discrepancyLevel.color}.600`}>
              {discrepancy >= 0 ? '+' : ''}R$ {discrepancy.toFixed(2)}
            </Text>
          </HStack>
          <Divider />
          <HStack justify="space-between" fontSize="sm">
            <Text color="gray.600">Tipo:</Text>
            <Text fontWeight="medium">
              {discrepancy > 0 ? 'Sobra de Caixa' : 'Falta de Caixa'}
            </Text>
          </HStack>
          <HStack justify="space-between" fontSize="sm">
            <Text color="gray.600">Limite sem aprovação:</Text>
            <Text fontWeight="medium">
              R$ {DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_WITHOUT_APPROVAL.toFixed(2)}
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Alertas */}
      {absDiscrepancy < DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_AUTO_ACCEPT ? (
        <Alert status="success">
          <AlertIcon />
          <Box>
            <AlertTitle>Discrepância Aceitável</AlertTitle>
            <AlertDescription fontSize="sm">
              A diferença está dentro do limite aceitável (R$ {DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_AUTO_ACCEPT.toFixed(2)}).
              Você pode aceitar automaticamente.
            </AlertDescription>
          </Box>
        </Alert>
      ) : requiresApproval ? (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Aprovação de Supervisor Necessária</AlertTitle>
            <AlertDescription fontSize="sm">
              A discrepância excede R$ {DEFAULT_CASH_LIMITS.MAX_DISCREPANCY_WITHOUT_APPROVAL.toFixed(2)}.
              É necessária a aprovação de um supervisor para fechar o caixa.
            </AlertDescription>
          </Box>
        </Alert>
      ) : (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <AlertTitle>Justificativa Necessária</AlertTitle>
            <AlertDescription fontSize="sm">
              Por favor, informe o motivo da discrepância.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Formulário */}
      <FormControl isRequired>
        <FormLabel>Motivo da Discrepância</FormLabel>
        <Textarea
          value={formData.reason}
          onChange={(e) => handleChange('reason', e.target.value)}
          placeholder="Descreva o motivo da diferença encontrada..."
          rows={4}
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Ação Tomada</FormLabel>
        <Select
          value={formData.action_taken}
          onChange={(e) => handleChange('action_taken', e.target.value)}
        >
          <option value="pending">Pendente de Análise</option>
          <option value="accepted">Aceitar Discrepância</option>
          <option value="investigation">Abrir Investigação</option>
          <option value="adjustment">Realizar Ajuste</option>
        </Select>
      </FormControl>

      {requiresApproval && (
        <FormControl isRequired>
          <FormLabel>ID do Supervisor Aprovador</FormLabel>
          <Input
            value={formData.approved_by}
            onChange={(e) => handleChange('approved_by', e.target.value)}
            placeholder="ID do supervisor que aprovou"
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            O supervisor deve revisar e aprovar esta discrepância
          </Text>
        </FormControl>
      )}

      <FormControl>
        <FormLabel>Notas de Resolução</FormLabel>
        <Textarea
          value={formData.resolution_notes}
          onChange={(e) => handleChange('resolution_notes', e.target.value)}
          placeholder="Informações adicionais sobre como a discrepância será tratada..."
          rows={3}
        />
      </FormControl>

      {/* Resumo da Ação */}
      {formData.reason && (
        <Box p={4} bg="blue.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="bold" mb={2}>Resumo do Tratamento:</Text>
          <VStack align="start" spacing={1} fontSize="sm">
            <Text>• Discrepância: R$ {discrepancy.toFixed(2)}</Text>
            <Text>• Ação: {
              formData.action_taken === 'pending' ? 'Pendente de Análise' :
              formData.action_taken === 'accepted' ? 'Aceitar Discrepância' :
              formData.action_taken === 'investigation' ? 'Abrir Investigação' :
              'Realizar Ajuste'
            }</Text>
            {requiresApproval && formData.approved_by && (
              <Text>• Aprovado por: {formData.approved_by}</Text>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};
