/**
 * Exemplo de uso do EmployeeCreationService refatorado
 * 
 * Este arquivo demonstra como usar o serviço com as novas funcionalidades
 * de logging, tratamento de erros e validação.
 */

import { EmployeeCreationService, EmployeeCreationData } from './employee-creation-service';

// Exemplo de configuração do serviço
export function configureEmployeeService() {
  const service = EmployeeCreationService.getInstance();
  
  // Configurar logging para desenvolvimento
  service.configureLogging({
    level: 'debug',
    enableConsole: true,
    enablePersistence: true
  });
  
  return service;
}

// Exemplo de criação de funcionário com dados completos
export async function createExampleEmployee() {
  const service = configureEmployeeService();
  
  const employeeData: EmployeeCreationData = {
    nome_completo: "João Silva Santos",
    email: "joao.silva@exemplo.com",
    telefone: "(11) 99999-9999",
    cpf: "123.456.789-00",
    bar_role: "garcom",
    shift_preference: "noite",
    specialties: ["Drinks especiais", "Atendimento VIP"],
    commission_rate: 5.0,
    observacoes: "Funcionário experiente, trabalhou em outros bares",
    cargo: "Garçom Senior",
    tipo_usuario: "funcionario",
    papel: "USER",
    tem_acesso_sistema: true,
    permissoes_modulos: EmployeeCreationService.generateDefaultPermissions("garcom")
  };
  
  try {
    const result = await service.createCompleteEmployee(
      employeeData, 
      "00000000-0000-0000-0000-000000000001"
    );
    
    if (result.success) {
      console.log("✅ Funcionário criado com sucesso!");
      console.log("ID do funcionário:", result.employee_id);
      console.log("Credenciais:", result.credentials);
      console.log("Detalhes:", result.details);
      
      // Verificar logs se necessário
      const logs = service.getLogs('create_employee');
      console.log("Logs da operação:", logs);
    } else {
      console.error("❌ Erro ao criar funcionário:", result.error);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    throw error;
  }
}

// Exemplo de atualização de senha
export async function updateEmployeePasswordExample(userId: string) {
  const service = configureEmployeeService();
  
  const result = await service.updateEmployeePassword(
    userId, 
    "NovaSenha123@", 
    false // não é temporária
  );
  
  if (result.success) {
    console.log("✅ Senha atualizada com sucesso!");
  } else {
    console.error("❌ Erro ao atualizar senha:", result.error);
  }
  
  return result;
}

// Exemplo de listagem de funcionários
export async function listEmployeesExample(empresaId: string) {
  const service = configureEmployeeService();
  
  const result = await service.listEmployees(empresaId, false);
  
  if (result.success) {
    console.log(`✅ ${result.total} funcionários encontrados`);
    console.log("Funcionários:", result.employees);
  } else {
    console.error("❌ Erro ao listar funcionários:", result.error);
  }
  
  return result;
}

// Exemplo de análise de logs
export function analyzeLogs() {
  const service = EmployeeCreationService.getInstance();
  
  // Obter todos os logs
  const allLogs = service.getLogs();
  console.log("Total de logs:", allLogs.length);
  
  // Obter apenas logs de erro
  const errorLogs = service.getLogs(undefined, 'error');
  console.log("Logs de erro:", errorLogs.length);
  
  // Obter logs de uma operação específica
  const createLogs = service.getLogs('create_employee');
  console.log("Logs de criação:", createLogs.length);
  
  // Limpar logs se necessário
  // service.clearLogs();
}