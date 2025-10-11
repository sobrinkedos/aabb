import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  Select,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiDownload, FiFilter, FiRefreshCw } from 'react-icons/fi';
import {
  CashMovementWithDetails,
  CASH_MOVEMENT_TYPE_LABELS,
  CASH_MOVEMENT_TYPE_ICONS,
  CASH_MOVEMENT_PURPOSE_LABELS,
  AUTHORIZATION_STATUS_LABELS
} from '../../../types/cash-management';
import { useCashManagement } from '../../../hooks/useCashManagement';

interface CashMovementHistoryProps {
  sessionId?: string;
}

export const CashMovementHistory: React.FC<CashMovementHistoryProps> = ({ sessionId }) => {
  const toast = useToast();
  const { getCashMovements, generateMovementReceipt } = useCashManagement();

  const [movements, setMovements] = useState<CashMovementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    movementType: '',
    purpose: '',
    searchTerm: ''
  });

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await getCashMovements(sessionId);
      setMovements(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar movimentações',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [sessionId]);

  const handleDownloadReceipt = async (movementId: string) => {
    try {
      const receipt = await generateMovementReceipt(movementId);
      if (receipt) {
        toast({
          title: 'Comprovante gerado',
          description: `Número: ${receipt.receipt_number}`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar comprovante',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const filteredMovements = movements.filter(movement => {
    if (filters.movementType && movement.movement_type !== filters.movementType) {
      return false;
    }
    if (filters.purpose && movement.purpose !== filters.purpose) {
      return false;
    }
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        movement.reason.toLowerCase().includes(searchLower) ||
        movement.reference_number?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totalSupply = movements
    .filter(m => m.movement_type === 'supply')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalWithdrawal = movements
    .filter(m => m.movement_type === 'withdrawal')
    .reduce((sum, m) => sum + m.amount, 0);

  const netMovement = totalSupply - totalWithdrawal;

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Carregando movimentações...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="xl" fontWeight="bold">Histórico de Movimentações</Text>
        <Tooltip label="Atualizar">
          <IconButton
            aria-label="Atualizar"
            icon={<FiRefreshCw />}
            onClick={loadMovements}
            size="sm"
          />
        </Tooltip>
      </HStack>

      <Box p={4} bg="gray.50" borderRadius="md">
        <HStack spacing={8}>
          <Box>
            <Text fontSize="sm" color="gray.600">Total Suprimentos</Text>
            <Text fontSize="xl" fontWeight="bold" color="green.600">
              R$ {totalSupply.toFixed(2)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600">Total Sangrias</Text>
            <Text fontSize="xl" fontWeight="bold" color="red.600">
              R$ {totalWithdrawal.toFixed(2)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.600">Movimento Líquido</Text>
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color={netMovement >= 0 ? 'green.600' : 'red.600'}
            >
              R$ {netMovement.toFixed(2)}
            </Text>
          </Box>
        </HStack>
      </Box>

      <HStack spacing={4}>
        <Input
          placeholder="Buscar por justificativa ou referência..."
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          leftIcon={<FiFilter />}
        />
        <Select
          placeholder="Tipo"
          value={filters.movementType}
          onChange={(e) => setFilters({ ...filters, movementType: e.target.value })}
          maxW="200px"
        >
          <option value="supply">Suprimento</option>
          <option value="withdrawal">Sangria</option>
        </Select>
        <Select
          placeholder="Propósito"
          value={filters.purpose}
          onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
          maxW="200px"
        >
          {Object.entries(CASH_MOVEMENT_PURPOSE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </HStack>

      {filteredMovements.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          Nenhuma movimentação encontrada
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Data/Hora</Th>
                <Th>Tipo</Th>
                <Th>Valor</Th>
                <Th>Propósito</Th>
                <Th>Justificativa</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredMovements.map((movement) => (
                <Tr key={movement.id}>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {new Date(movement.created_at).toLocaleTimeString('pt-BR')}
                    </Text>
                  </Td>
                  <Td>
                    <HStack>
                      <Text>{CASH_MOVEMENT_TYPE_ICONS[movement.movement_type]}</Text>
                      <Text fontSize="sm">
                        {CASH_MOVEMENT_TYPE_LABELS[movement.movement_type]}
                      </Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Text
                      fontWeight="bold"
                      color={movement.movement_type === 'supply' ? 'green.600' : 'red.600'}
                    >
                      {movement.movement_type === 'supply' ? '+' : '-'} R$ {movement.amount.toFixed(2)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue" fontSize="xs">
                      {CASH_MOVEMENT_PURPOSE_LABELS[movement.purpose]}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm" noOfLines={2} maxW="200px">
                      {movement.reason}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        movement.authorization_status === 'approved' ? 'green' :
                        movement.authorization_status === 'pending' ? 'yellow' :
                        movement.authorization_status === 'rejected' ? 'red' : 'gray'
                      }
                    >
                      {AUTHORIZATION_STATUS_LABELS[movement.authorization_status]}
                    </Badge>
                  </Td>
                  <Td>
                    <Tooltip label="Baixar Comprovante">
                      <IconButton
                        aria-label="Baixar comprovante"
                        icon={<FiDownload />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReceipt(movement.id)}
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </VStack>
  );
};
