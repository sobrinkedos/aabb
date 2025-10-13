/*
  # Módulo de Gestão de Funcionários - Estrutura de Banco de Dados
  
  Esta migração cria a estrutura completa para o módulo de gestão de funcionários,
  incluindo núcleos de atuação, cargos, turnos e relacionamento com perfis de usuário.
  
  ## Tabelas Criadas:
  - departments: Núcleos/departamentos do clube
  - positions: Cargos disponíveis
  - employees: Funcionários do clube
  - employee_shifts: Turnos de trabalho
  - employee_schedules: Escalas de trabalho
  
  ## Funcionalidades:
  - Organização por núcleos (bar, cozinha, administração, etc.)
  - Relacionamento opcional com perfis de usuário para acesso ao sistema
  - Controle de turnos e escalas
  - Histórico de mudanças de cargo
*/

-- 1. TABELA DE NÚCLEOS/DEPARTAMENTOS
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID, -- Referência circular, será adicionada depois
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.departments IS 'Núcleos/departamentos do clube (bar, cozinha, administração, etc.)';
COMMENT ON COLUMN public.departments.manager_id IS 'ID do funcionário responsável pelo núcleo';

-- 2. TABELA DE CARGOS
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  description TEXT,
  requires_system_access BOOLEAN DEFAULT FALSE,
  base_salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, department_id)
);

COMMENT ON TABLE public.positions IS 'Cargos disponíveis em cada núcleo';
COMMENT ON COLUMN public.positions.requires_system_access IS 'Indica se o cargo requer acesso ao sistema (perfil de usuário)';

-- 3. TABELA DE FUNCIONÁRIOS
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT NOT NULL UNIQUE, -- Código único do funcionário
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address JSONB, -- {"street": "", "city": "", "state": "", "zip_code": ""}
  birth_date DATE,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  termination_date DATE,
  position_id UUID NOT NULL REFERENCES public.positions(id),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  profile_id UUID REFERENCES public.profiles(id), -- Relacionamento opcional com perfil de usuário
  salary DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  emergency_contact JSONB, -- {"name": "", "phone": "", "relationship": ""}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.employees IS 'Funcionários do clube com informações completas';
COMMENT ON COLUMN public.employees.employee_code IS 'Código único do funcionário para identificação';
COMMENT ON COLUMN public.employees.profile_id IS 'Relacionamento opcional com perfil de usuário para acesso ao sistema';
COMMENT ON COLUMN public.employees.address IS 'Endereço em formato JSON';
COMMENT ON COLUMN public.employees.emergency_contact IS 'Contato de emergência em formato JSON';

-- 4. TABELA DE TURNOS
CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.employee_shifts IS 'Turnos de trabalho disponíveis';

-- 5. TABELA DE ESCALAS
CREATE TABLE public.employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.employee_shifts(id),
  work_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'worked', 'absent', 'cancelled')),
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  break_duration INTEGER, -- em minutos
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, work_date, shift_id)
);

COMMENT ON TABLE public.employee_schedules IS 'Escalas de trabalho dos funcionários';
COMMENT ON COLUMN public.employee_schedules.break_duration IS 'Duração do intervalo em minutos';

-- 6. TABELA DE HISTÓRICO DE CARGOS
CREATE TABLE public.employee_position_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  start_date DATE NOT NULL,
  end_date DATE,
  salary DECIMAL(10,2),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.employee_position_history IS 'Histórico de mudanças de cargo dos funcionários';

-- 7. ADICIONAR REFERÊNCIA CIRCULAR PARA MANAGER
ALTER TABLE public.departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES public.employees(id);

-- 8. INSERIR NÚCLEOS PADRÃO
INSERT INTO public.departments (name, description) VALUES
('Administração', 'Núcleo administrativo e financeiro'),
('Bar', 'Atendimento no bar e preparo de bebidas'),
('Cozinha', 'Preparo de alimentos e cozinha'),
('Portaria', 'Controle de acesso e segurança'),
('Limpeza', 'Serviços de limpeza e manutenção'),
('Eventos', 'Organização e suporte a eventos'),
('Esportes', 'Atividades esportivas e recreativas'),
('Manutenção', 'Manutenção predial e equipamentos');

-- 9. INSERIR CARGOS PADRÃO
INSERT INTO public.positions (name, department_id, description, requires_system_access) 
SELECT 
  cargo.name,
  dept.id,
  cargo.description,
  cargo.requires_system_access
FROM (
  VALUES 
    ('Gerente Administrativo', 'Administração', 'Responsável pela gestão administrativa', true),
    ('Assistente Administrativo', 'Administração', 'Suporte administrativo', true),
    ('Contador', 'Administração', 'Responsável pela contabilidade', true),
    ('Bartender', 'Bar', 'Preparo de bebidas e atendimento no bar', true),
    ('Garçom', 'Bar', 'Atendimento aos clientes', true),
    ('Auxiliar de Bar', 'Bar', 'Suporte ao bar', false),
    ('Chef de Cozinha', 'Cozinha', 'Responsável pela cozinha', true),
    ('Cozinheiro', 'Cozinha', 'Preparo de alimentos', true),
    ('Auxiliar de Cozinha', 'Cozinha', 'Suporte na cozinha', false),
    ('Porteiro', 'Portaria', 'Controle de acesso', true),
    ('Segurança', 'Portaria', 'Segurança do clube', false),
    ('Auxiliar de Limpeza', 'Limpeza', 'Serviços de limpeza', false),
    ('Coordenador de Eventos', 'Eventos', 'Organização de eventos', true),
    ('Monitor Esportivo', 'Esportes', 'Atividades esportivas', false),
    ('Técnico de Manutenção', 'Manutenção', 'Manutenção predial', false)
) AS cargo(name, dept_name, description, requires_system_access)
JOIN public.departments dept ON dept.name = cargo.dept_name;

-- 10. INSERIR TURNOS PADRÃO
INSERT INTO public.employee_shifts (name, start_time, end_time, description) VALUES
('Manhã', '06:00:00', '14:00:00', 'Turno da manhã'),
('Tarde', '14:00:00', '22:00:00', 'Turno da tarde'),
('Noite', '22:00:00', '06:00:00', 'Turno da noite'),
('Comercial', '08:00:00', '17:00:00', 'Horário comercial'),
('Meio Período Manhã', '06:00:00', '12:00:00', 'Meio período manhã'),
('Meio Período Tarde', '12:00:00', '18:00:00', 'Meio período tarde');

-- 11. FUNÇÕES AUXILIARES

-- Função para criar funcionário com perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.create_employee_with_profile(
  p_name TEXT,
  p_email TEXT,
  p_position_id UUID,
  p_employee_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_employee_id UUID;
  v_profile_id UUID;
  v_requires_access BOOLEAN;
  v_department_id UUID;
BEGIN
  -- Verificar se o cargo requer acesso ao sistema
  SELECT p.requires_system_access, p.department_id 
  INTO v_requires_access, v_department_id
  FROM public.positions p 
  WHERE p.id = p_position_id;
  
  -- Gerar código do funcionário se não fornecido
  IF p_employee_code IS NULL THEN
    p_employee_code := 'EMP' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  END IF;
  
  -- Criar funcionário
  INSERT INTO public.employees (
    employee_code, name, email, position_id, department_id
  ) VALUES (
    p_employee_code, p_name, p_email, p_position_id, v_department_id
  ) RETURNING id INTO v_employee_id;
  
  -- Se o cargo requer acesso, criar perfil de usuário
  IF v_requires_access AND p_email IS NOT NULL THEN
    -- Aqui seria necessário integrar com o sistema de autenticação
    -- Por enquanto, apenas registramos a necessidade
    RAISE NOTICE 'Funcionário % requer criação de perfil de usuário com email %', p_name, p_email;
  END IF;
  
  RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter funcionários por núcleo
CREATE OR REPLACE FUNCTION public.get_employees_by_department(dept_name TEXT)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  position_name TEXT,
  status TEXT,
  has_system_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    p.name,
    e.status,
    (e.profile_id IS NOT NULL) as has_system_access
  FROM public.employees e
  JOIN public.positions p ON e.position_id = p.id
  JOIN public.departments d ON e.department_id = d.id
  WHERE d.name = dept_name AND e.status = 'active'
  ORDER BY e.name;
END;
$$ LANGUAGE plpgsql;

-- 12. TRIGGERS

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.employee_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar histórico de mudanças de cargo
CREATE OR REPLACE FUNCTION public.track_position_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Se houve mudança de cargo ou departamento
  IF OLD.position_id != NEW.position_id OR OLD.department_id != NEW.department_id THEN
    -- Finalizar registro anterior
    UPDATE public.employee_position_history 
    SET end_date = CURRENT_DATE
    WHERE employee_id = NEW.id AND end_date IS NULL;
    
    -- Criar novo registro
    INSERT INTO public.employee_position_history (
      employee_id, position_id, department_id, start_date, salary
    ) VALUES (
      NEW.id, NEW.position_id, NEW.department_id, CURRENT_DATE, NEW.salary
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_employee_position_changes
  AFTER UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.track_position_changes();

-- Trigger para criar registro inicial no histórico
CREATE OR REPLACE FUNCTION public.create_initial_position_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employee_position_history (
    employee_id, position_id, department_id, start_date, salary
  ) VALUES (
    NEW.id, NEW.position_id, NEW.department_id, NEW.hire_date, NEW.salary
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_employee_position_history
  AFTER INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.create_initial_position_history();

-- 13. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_position ON public.employees(position_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_profile ON public.employees(profile_id);
CREATE INDEX idx_schedules_employee_date ON public.employee_schedules(employee_id, work_date);
CREATE INDEX idx_schedules_date ON public.employee_schedules(work_date);
CREATE INDEX idx_position_history_employee ON public.employee_position_history(employee_id);

-- 14. ROW LEVEL SECURITY (RLS)

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_position_history ENABLE ROW LEVEL SECURITY;

-- Políticas para administradores (acesso total)
CREATE POLICY "Admins have full access to departments" ON public.departments FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to positions" ON public.positions FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to employees" ON public.employees FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to shifts" ON public.employee_shifts FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to schedules" ON public.employee_schedules FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to position history" ON public.employee_position_history FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Políticas para usuários autenticados (leitura)
CREATE POLICY "Authenticated users can view departments" ON public.departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view positions" ON public.positions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view employees" ON public.employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view shifts" ON public.employee_shifts FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas específicas para funcionários verem suas próprias informações
CREATE POLICY "Employees can view their own schedules" ON public.employee_schedules FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

CREATE POLICY "Employees can view their own position history" ON public.employee_position_history FOR SELECT USING (
  auth.role() = 'authenticated' AND 
  employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);

-- Políticas para gerentes de núcleo
CREATE POLICY "Department managers can manage their employees" ON public.employees FOR ALL USING (
  public.get_my_role() IN ('admin', 'employee') AND
  department_id IN (
    SELECT id FROM public.departments 
    WHERE manager_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  )
) WITH CHECK (
  public.get_my_role() IN ('admin', 'employee') AND
  department_id IN (
    SELECT id FROM public.departments 
    WHERE manager_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  )
);

CREATE POLICY "Department managers can manage schedules" ON public.employee_schedules FOR ALL USING (
  public.get_my_role() IN ('admin', 'employee') AND
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.departments d ON e.department_id = d.id
    WHERE d.manager_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  )
) WITH CHECK (
  public.get_my_role() IN ('admin', 'employee') AND
  employee_id IN (
    SELECT e.id FROM public.employees e
    JOIN public.departments d ON e.department_id = d.id
    WHERE d.manager_id IN (
      SELECT id FROM public.employees WHERE profile_id = auth.uid()
    )
  )
);