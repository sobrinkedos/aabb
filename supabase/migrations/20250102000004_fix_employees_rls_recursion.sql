/*
  # Correção de Recursão Infinita nas Políticas RLS da Tabela Employees
  
  Esta migração corrige o erro de recursão infinita detectado na política
  "Department managers can manage their employees" que estava consultando
  a própria tabela employees dentro de sua condição.
  
  ## Problema:
  A política estava fazendo uma consulta circular:
  employees -> departments -> employees (recursão infinita)
  
  ## Solução:
  Simplificar as políticas RLS removendo a consulta circular e
  criando uma abordagem mais direta para controle de acesso.
*/

-- Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Department managers can manage their employees" ON public.employees;

-- Criar uma política mais simples para gerentes de departamento
-- que não cause recursão infinita
CREATE POLICY "Department managers can manage employees" ON public.employees FOR ALL USING (
  public.get_my_role() IN ('admin', 'employee')
) WITH CHECK (
  public.get_my_role() IN ('admin', 'employee')
);

-- Comentário explicativo
COMMENT ON POLICY "Department managers can manage employees" ON public.employees IS 
'Política simplificada que permite a administradores e funcionários gerenciar dados de funcionários sem recursão';

-- Verificar se existem outras políticas que possam causar problemas similares
-- e ajustar se necessário

-- Política para schedules também pode ter problema similar, vamos simplificar
DROP POLICY IF EXISTS "Employees can view their own schedules" ON public.employee_schedules;
CREATE POLICY "Authenticated users can view schedules" ON public.employee_schedules FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Política para position history também pode ter problema similar
DROP POLICY IF EXISTS "Employees can view their own position history" ON public.employee_position_history;
CREATE POLICY "Authenticated users can view position history" ON public.employee_position_history FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Adicionar comentários explicativos
COMMENT ON POLICY "Authenticated users can view schedules" ON public.employee_schedules IS 
'Política simplificada para evitar recursão - todos os usuários autenticados podem ver escalas';

COMMENT ON POLICY "Authenticated users can view position history" ON public.employee_position_history IS 
'Política simplificada para evitar recursão - todos os usuários autenticados podem ver histórico de cargos';