-- Criar tabela bar_tables se não existir
CREATE TABLE IF NOT EXISTS public.bar_tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    number VARCHAR(50) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
    position_x INTEGER DEFAULT 100,
    position_y INTEGER DEFAULT 100,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bar_tables_status ON public.bar_tables(status);
CREATE INDEX IF NOT EXISTS idx_bar_tables_number ON public.bar_tables(number);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.bar_tables ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso a usuários autenticados
CREATE POLICY IF NOT EXISTS "Enable read access for authenticated users" ON public.bar_tables
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable insert access for authenticated users" ON public.bar_tables
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable update access for authenticated users" ON public.bar_tables
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable delete access for authenticated users" ON public.bar_tables
    FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir algumas mesas de exemplo
INSERT INTO public.bar_tables (number, capacity, status, position_x, position_y, notes) VALUES
    ('1', 2, 'available', 100, 100, NULL),
    ('2', 4, 'available', 200, 100, NULL),
    ('3', 2, 'available', 300, 100, NULL),
    ('4', 6, 'available', 400, 100, NULL),
    ('5', 4, 'available', 100, 200, NULL),
    ('6', 2, 'available', 200, 200, NULL),
    ('7', 8, 'available', 300, 200, NULL),
    ('8', 4, 'available', 400, 200, NULL),
    ('9', 2, 'available', 100, 300, NULL),
    ('10', 6, 'available', 200, 300, NULL),
    ('VIP-1', 4, 'available', 500, 100, 'Mesa VIP com vista'),
    ('VIP-2', 6, 'available', 500, 200, 'Mesa VIP reservada'),
    ('A1', 2, 'available', 100, 400, NULL),
    ('A2', 2, 'available', 200, 400, NULL),
    ('A3', 2, 'available', 300, 400, NULL),
    ('B1', 4, 'available', 400, 300, NULL),
    ('B2', 4, 'available', 500, 300, NULL),
    ('B3', 4, 'available', 600, 300, NULL),
    ('C1', 8, 'available', 400, 400, NULL),
    ('C2', 10, 'available', 500, 400, NULL)
ON CONFLICT (number) DO NOTHING;