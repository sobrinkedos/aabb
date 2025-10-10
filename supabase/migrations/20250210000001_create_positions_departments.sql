-- Criar tabela de departamentos se não existir
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de cargos se não existir
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir departamentos padrão se não existirem
INSERT INTO departments (id, name, description, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Geral', 'Departamento geral', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir cargos padrão se não existirem
INSERT INTO positions (id, name, description, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Funcionário', 'Cargo geral', true),
  ('00000000-0000-0000-0000-000000000002', 'Gerente', 'Gerente', true),
  ('00000000-0000-0000-0000-000000000003', 'Atendente', 'Atendente', true),
  ('00000000-0000-0000-0000-000000000004', 'Cozinheiro', 'Cozinheiro', true),
  ('00000000-0000-0000-0000-000000000005', 'Garçom', 'Garçom', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para departments
DROP POLICY IF EXISTS "Permitir leitura de departments" ON departments;
CREATE POLICY "Permitir leitura de departments"
  ON departments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insert de departments para autenticados" ON departments;
CREATE POLICY "Permitir insert de departments para autenticados"
  ON departments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir update de departments para autenticados" ON departments;
CREATE POLICY "Permitir update de departments para autenticados"
  ON departments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Políticas RLS para positions
DROP POLICY IF EXISTS "Permitir leitura de positions" ON positions;
CREATE POLICY "Permitir leitura de positions"
  ON positions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insert de positions para autenticados" ON positions;
CREATE POLICY "Permitir insert de positions para autenticados"
  ON positions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Permitir update de positions para autenticados" ON positions;
CREATE POLICY "Permitir update de positions para autenticados"
  ON positions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_positions_is_active ON positions(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
