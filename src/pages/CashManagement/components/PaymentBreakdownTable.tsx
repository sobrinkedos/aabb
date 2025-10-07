import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  HStack,
  Text,
  Badge,
  Box,
  IconButton,
  Tooltip,
  VStack
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import {
  PaymentMethodBreakdown,
  PaymentReconciliationData,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS
} from '../../../types/cash-management';

interface PaymentBreakdownTableProps {
  breakdown: PaymentMethodBreakdown[];
  reconciliation: PaymentReconciliationData[];
  onReconciliationChange: (paymentMethod: string, actualAmount: number) => void;
}

export const PaymentBreakdownTable: React.FC<PaymentBreakdownTableProps> = ({
  breakdown,
  reconciliation,
  onReconciliationChange
}) => {
  const getReconciliation = (paymentMethod: string) => {
    return reconciliation.find(r => r.payment_method === paymentMethod);
  };

  const calculateDiscrepancy = (paymentMethod: string) => {
    const b = breakdown.find(br => br.payment_method === paymentMethod);
    const r = getReconciliation(paymentMethod);
    if (!b || !r) return 0;
    return r.actual_amount - b.expected_amount;
  };

  const getDiscrepancyColor = (discrepancy: number) => {
    if (Math.abs(discrepancy) < 0.01) return 'green';
    return discrepancy > 0 ? 'blue' : 'red';
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Reconciliação por Método de Pagamento
        </Text>
        <Text fontSize="sm" color="gray.600">
          Informe os valores reais contados para cada método de pagamento
        </Text>
      </Box>

      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Método</Th>
              <Th isNumeric>Esperado</Th>
              <Th isNumeric>Real</Th>
              <Th isNumeric>Transações</Th>
              <Th isNumeric>Discrepância</Th>
              <Th>Status</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {breakdown.map((b) => {
              const recon = getReconciliation(b.payment_method);
              const discrepancy = calculateDiscrepancy(b.payment_method);
              const discrepancyPercentage = b.expected_amount > 0
                ? (discrepancy / b.expected_amount) * 100
                : 0;

              return (
                <Tr key={b.payment_method}>
                  <Td>
                    <HStack>
                      <Text fontSize="lg">
                        {PAYMENT_METHOD_ICONS[b.payment_method]}
                      </Text>
                      <Text fontWeight="medium">
                        {PAYMENT_METHOD_LABELS[b.payment_method]}
                      </Text>
                    </HStack>
                  </Td>
                  <Td isNumeric>
                    <Text fontWeight="bold" color="blue.600">
                      R$ {b.expected_amount.toFixed(2)}
                    </Text>
                  </Td>
                  <Td isNumeric>
                    <Input
                      type="number"
                      step="0.01"
                      value={recon?.actual_amount || 0}
                      onChange={(e) =>
                        onReconciliationChange(
                          b.payment_method,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      size="sm"
                      textAlign="right"
                      fontWeight="bold"
                      w="120px"
                    />
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="gray">
                      {b.transaction_count}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <VStack spacing={0} align="end">
                      <Text
                        fontWeight="bold"
                        color={`${getDiscrepancyColor(discrepancy)}.600`}
                      >
                        {discrepancy >= 0 ? '+' : ''}
                        R$ {discrepancy.toFixed(2)}
                      </Text>
                      {Math.abs(discrepancy) > 0.01 && (
                        <Text fontSize="xs" color="gray.600">
                          ({discrepancyPercentage >= 0 ? '+' : ''}
                          {discrepancyPercentage.toFixed(1)}%)
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    {Math.abs(discrepancy) < 0.01 ? (
                      <Badge colorScheme="green">Exato</Badge>
                    ) : discrepancy > 0 ? (
                      <Badge colorScheme="blue">Sobra</Badge>
                    ) : (
                      <Badge colorScheme="red">Falta</Badge>
                    )}
                  </Td>
                  <Td>
                    {b.transactions.length > 0 && (
                      <Tooltip label={`Ver ${b.transactions.length} transações`}>
                        <IconButton
                          aria-label="Ver transações"
                          icon={<FiInfo />}
                          size="sm"
                          variant="ghost"
                        />
                      </Tooltip>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      {/* Resumo Total */}
      <Box p={4} bg="blue.50" borderRadius="md">
        <HStack justify="space-between">
          <Text fontWeight="bold">Total Geral:</Text>
          <HStack spacing={8}>
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.600">Esperado</Text>
              <Text fontSize="lg" fontWeight="bold" color="blue.600">
                R$ {breakdown.reduce((sum, b) => sum + b.expected_amount, 0).toFixed(2)}
              </Text>
            </Box>
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.600">Real</Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                R$ {reconciliation.reduce((sum, r) => sum + r.actual_amount, 0).toFixed(2)}
              </Text>
            </Box>
            <Box textAlign="right">
              <Text fontSize="xs" color="gray.600">Diferença</Text>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={
                  Math.abs(
                    reconciliation.reduce((sum, r) => sum + r.actual_amount, 0) -
                    breakdown.reduce((sum, b) => sum + b.expected_amount, 0)
                  ) < 0.01
                    ? 'green.600'
                    : 'red.600'
                }
              >
                R$ {(
                  reconciliation.reduce((sum, r) => sum + r.actual_amount, 0) -
                  breakdown.reduce((sum, b) => sum + b.expected_amount, 0)
                ).toFixed(2)}
              </Text>
            </Box>
          </HStack>
        </HStack>
      </Box>
    </VStack>
  );
};
