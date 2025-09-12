/*
  Bar Customers Management Module
  
  Este módulo implementa um sistema de gestão de clientes específico para o bar,
  onde os clientes são identificados pelo número do celular para facilitar
  o cadastro rápido durante pedidos no balcão ou abertura de comandas.
*/

-- Tabela de clientes do bar
CREATE TABLE IF NOT EXISTS bar_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE, -- Identificação principal por celular
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  cpf VARCHAR(14),
  birth_date DATE,
  gender VARCHAR(20),
  
  -- Informações de preferências
  preferred_table VARCHAR(10), -- Mesa preferida
  dietary_restrictions TEXT, -- Restrições alimentares
  favorite_items JSONB, -- IDs dos itens favoritos do cardápio
  
  -- Controle financeiro
  credit_limit DECIMAL(10,2) DEFAULT 0.00,
  current_balance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status e controle
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  is_vip BOOLEAN DEFAULT FALSE,
  loyalty_points INTEGER DEFAULT 0,
  
  -- Informações de contato de emergência
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  
  -- Observações gerais
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit TIMESTAMP WITH TIME ZONE
);

-- Tabela de histórico de visitas
CREATE TABLE IF NOT EXISTS bar_customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES bar_customers(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  table_number VARCHAR(10),
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  items_ordered JSONB, -- Array de itens pedidos
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de funcionários do bar
CREATE TABLE IF NOT EXISTS bar_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  bar_role VARCHAR(50) NOT NULL CHECK (bar_role IN ('atendente', 'garcom', 'cozinheiro', 'barman', 'gerente')),
  shift_preference VARCHAR(20) CHECK (shift_preference IN ('manha', 'tarde', 'noite', 'qualquer')),
  specialties TEXT[], -- Especialidades (ex: drinks, pratos quentes, etc.)
  commission_rate DECIMAL(5,2) DEFAULT 0.00, -- Taxa de comissão em %
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bar_customers_phone ON bar_customers(phone);
CREATE INDEX IF NOT EXISTS idx_bar_customers_name ON bar_customers(name);
CREATE INDEX IF NOT EXISTS idx_bar_customers_status ON bar_customers(status);
CREATE INDEX IF NOT EXISTS idx_bar_customers_last_visit ON bar_customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_bar_customer_visits_customer_id ON bar_customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_bar_customer_visits_date ON bar_customer_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_bar_employees_role ON bar_employees(bar_role);
CREATE INDEX IF NOT EXISTS idx_bar_employees_active ON bar_employees(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_bar_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bar_customers_updated_at
  BEFORE UPDATE ON bar_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_bar_customers_updated_at();

CREATE OR REPLACE FUNCTION update_bar_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bar_employees_updated_at
  BEFORE UPDATE ON bar_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_bar_employees_updated_at();

-- Trigger para atualizar last_visit quando há uma nova visita
CREATE OR REPLACE FUNCTION update_customer_last_visit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bar_customers 
  SET last_visit = NEW.visit_date
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_last_visit
  AFTER INSERT ON bar_customer_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_last_visit();

-- Funções auxiliares

-- Função para buscar cliente por telefone
CREATE OR REPLACE FUNCTION get_bar_customer_by_phone(customer_phone VARCHAR)
RETURNS TABLE (
  id UUID,
  phone VARCHAR,
  name VARCHAR,
  email VARCHAR,
  status VARCHAR,
  is_vip BOOLEAN,
  loyalty_points INTEGER,
  credit_limit DECIMAL,
  current_balance DECIMAL,
  last_visit TIMESTAMP WITH TIME ZONE,
  total_visits BIGINT,
  total_spent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.phone,
    bc.name,
    bc.email,
    bc.status,
    bc.is_vip,
    bc.loyalty_points,
    bc.credit_limit,
    bc.current_balance,
    bc.last_visit,
    COUNT(bcv.id) as total_visits,
    COALESCE(SUM(bcv.total_spent), 0) as total_spent
  FROM bar_customers bc
  LEFT JOIN bar_customer_visits bcv ON bc.id = bcv.customer_id
  WHERE bc.phone = customer_phone
  GROUP BY bc.id, bc.phone, bc.name, bc.email, bc.status, bc.is_vip, 
           bc.loyalty_points, bc.credit_limit, bc.current_balance, bc.last_visit;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar clientes por nome (busca parcial)
CREATE OR REPLACE FUNCTION search_bar_customers_by_name(search_name VARCHAR)
RETURNS TABLE (
  id UUID,
  phone VARCHAR,
  name VARCHAR,
  email VARCHAR,
  status VARCHAR,
  is_vip BOOLEAN,
  last_visit TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.phone,
    bc.name,
    bc.email,
    bc.status,
    bc.is_vip,
    bc.last_visit
  FROM bar_customers bc
  WHERE bc.name ILIKE '%' || search_name || '%'
  ORDER BY bc.last_visit DESC NULLS LAST, bc.name;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar uma nova visita
CREATE OR REPLACE FUNCTION register_bar_customer_visit(
  customer_id UUID,
  table_num VARCHAR DEFAULT NULL,
  spent DECIMAL DEFAULT 0.00,
  items JSONB DEFAULT NULL,
  payment VARCHAR DEFAULT NULL,
  visit_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  visit_id UUID;
BEGIN
  INSERT INTO bar_customer_visits (
    customer_id, table_number, total_spent, items_ordered, payment_method, notes
  ) VALUES (
    customer_id, table_num, spent, items, payment, visit_notes
  ) RETURNING id INTO visit_id;
  
  -- Atualizar pontos de fidelidade (1 ponto por R$ 10 gastos)
  UPDATE bar_customers 
  SET loyalty_points = loyalty_points + FLOOR(spent / 10)
  WHERE id = customer_id;
  
  RETURN visit_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter funcionários do bar ativos
CREATE OR REPLACE FUNCTION get_active_bar_employees()
RETURNS TABLE (
  id UUID,
  employee_id UUID,
  employee_name VARCHAR,
  employee_email VARCHAR,
  bar_role VARCHAR,
  shift_preference VARCHAR,
  specialties TEXT[],
  commission_rate DECIMAL,
  start_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    be.id,
    be.employee_id,
    p.full_name as employee_name,
    p.email as employee_email,
    be.bar_role,
    be.shift_preference,
    be.specialties,
    be.commission_rate,
    be.start_date
  FROM bar_employees be
  JOIN employees e ON be.employee_id = e.id
  JOIN profiles p ON e.profile_id = p.id
  WHERE be.is_active = TRUE
  ORDER BY be.bar_role, p.full_name;
END;
$$ LANGUAGE plpgsql;

-- Políticas de Row Level Security (RLS)
ALTER TABLE bar_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_customer_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bar_employees ENABLE ROW LEVEL SECURITY;

-- Política para bar_customers: usuários autenticados podem ver e gerenciar
CREATE POLICY "Authenticated users can manage bar customers" ON bar_customers
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para bar_customer_visits: usuários autenticados podem ver e gerenciar
CREATE POLICY "Authenticated users can manage bar customer visits" ON bar_customer_visits
  FOR ALL USING (auth.role() = 'authenticated');

-- Política para bar_employees: usuários autenticados podem ver e gerenciar
CREATE POLICY "Authenticated users can manage bar employees" ON bar_employees
  FOR ALL USING (auth.role() = 'authenticated');

-- Inserir alguns funcionários do bar de exemplo (baseado nos funcionários existentes)
INSERT INTO bar_employees (employee_id, bar_role, shift_preference, specialties, commission_rate)
SELECT 
  e.id,
  CASE 
    WHEN e.core_area = 'food_beverage' THEN 'cozinheiro'
    WHEN p.position_id IS NOT NULL THEN 'atendente'
    ELSE 'garcom'
  END as bar_role,
  'qualquer' as shift_preference,
  CASE 
    WHEN e.core_area = 'food_beverage' THEN ARRAY['pratos quentes', 'bebidas']
    ELSE ARRAY['atendimento', 'vendas']
  END as specialties,
  2.5 as commission_rate
FROM employees e
JOIN profiles p ON e.profile_id = p.id
WHERE e.core_area IN ('food_beverage', 'administrative') 
  AND e.is_active = TRUE
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE bar_customers IS 'Clientes específicos do bar identificados por telefone';
COMMENT ON TABLE bar_customer_visits IS 'Histórico de visitas dos clientes do bar';
COMMENT ON TABLE bar_employees IS 'Funcionários específicos do bar com suas funções';

COMMENT ON COLUMN bar_customers.phone IS 'Número de telefone - identificação principal do cliente';
COMMENT ON COLUMN bar_customers.loyalty_points IS 'Pontos de fidelidade (1 ponto = R$ 10 gastos)';
COMMENT ON COLUMN bar_customers.is_vip IS 'Cliente VIP com benefícios especiais';
COMMENT ON COLUMN bar_employees.bar_role IS 'Função específica no bar';
COMMENT ON COLUMN bar_employees.commission_rate IS 'Taxa de comissão em porcentagem';