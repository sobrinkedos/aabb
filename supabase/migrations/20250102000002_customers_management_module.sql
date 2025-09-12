/*
  # Módulo de Gestão de Clientes
  Esta migração expande o sistema atual de membros para um sistema completo de gestão de clientes,
  incluindo sócios e não-sócios, com informações detalhadas, endereços e dependentes.

  ## Descrição da Query: Esta operação é segura e estrutural. Ela expande a funcionalidade existente
  sem modificar ou deletar dados existentes. Cria novas tabelas e relacionamentos.

  ## Metadados:
  - Categoria-Schema: "Estrutural"
  - Nível-Impacto: "Médio"
  - Requer-Backup: false
  - Reversível: true

  ## Detalhes da Estrutura:
  - Tabelas Criadas: customers, customer_addresses, customer_dependents, customer_membership_history
  - Triggers Criados: updated_at para todas as tabelas
  - Políticas RLS: Habilitadas em todas as novas tabelas

  ## Implicações de Segurança:
  - Status RLS: Habilitado
  - Mudanças de Política: Sim, novas políticas são criadas para todas as tabelas
  - Requisitos de Auth: Políticas referenciam auth.uid() e campo role customizado

  ## Impacto de Performance:
  - Índices: Chaves primárias e estrangeiras são indexadas automaticamente
  - Índices Customizados: Criados para campos de busca frequente
  - Impacto Estimado: Baixo a médio
*/

-- =============================================
-- 1. TABELA DE CLIENTES (EXPANDIDA)
-- =============================================

CREATE TABLE public.customers (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações Básicas
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  cpf TEXT UNIQUE,
  rg TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_informar')),
  
  -- Informações de Contato
  avatar_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Status e Tipo de Cliente
  customer_type TEXT NOT NULL DEFAULT 'guest' CHECK (customer_type IN ('member', 'guest')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  
  -- Informações de Sócio (quando aplicável)
  membership_number TEXT UNIQUE,
  membership_type TEXT CHECK (membership_type IN ('individual', 'family', 'vip', 'corporate')),
  join_date TIMESTAMPTZ,
  membership_status TEXT CHECK (membership_status IN ('active', 'inactive', 'suspended', 'pending_approval', 'cancelled')),
  
  -- Informações Financeiras
  credit_limit NUMERIC(10, 2) DEFAULT 0,
  current_balance NUMERIC(10, 2) DEFAULT 0,
  
  -- Preferências
  preferred_payment_method TEXT CHECK (preferred_payment_method IN ('cash', 'card', 'pix', 'account')),
  marketing_consent BOOLEAN DEFAULT false,
  
  -- Observações
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.customers IS 'Tabela unificada para gestão de clientes (sócios e não-sócios)';
COMMENT ON COLUMN public.customers.customer_type IS 'Tipo de cliente: member (sócio) ou guest (não-sócio)';
COMMENT ON COLUMN public.customers.membership_number IS 'Número único de sócio (apenas para members)';
COMMENT ON COLUMN public.customers.credit_limit IS 'Limite de crédito para compras a prazo';
COMMENT ON COLUMN public.customers.current_balance IS 'Saldo atual da conta do cliente';

-- =============================================
-- 2. TABELA DE ENDEREÇOS
-- =============================================

CREATE TABLE public.customer_addresses (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Tipo de Endereço
  address_type TEXT NOT NULL DEFAULT 'residential' CHECK (address_type IN ('residential', 'commercial', 'billing', 'shipping')),
  is_primary BOOLEAN DEFAULT false,
  
  -- Informações do Endereço
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'Brasil',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.customer_addresses IS 'Endereços dos clientes (residencial, comercial, cobrança, etc.)';
COMMENT ON COLUMN public.customer_addresses.is_primary IS 'Indica se é o endereço principal do cliente';

-- =============================================
-- 3. TABELA DE DEPENDENTES (PARA SÓCIOS)
-- =============================================

CREATE TABLE public.customer_dependents (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Informações do Dependente
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_informar')),
  
  -- Relacionamento
  relationship TEXT NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Permissões
  can_make_purchases BOOLEAN DEFAULT false,
  credit_limit NUMERIC(10, 2) DEFAULT 0,
  
  -- Observações
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.customer_dependents IS 'Dependentes dos sócios (cônjuges, filhos, etc.)';
COMMENT ON COLUMN public.customer_dependents.relationship IS 'Tipo de relacionamento com o sócio titular';
COMMENT ON COLUMN public.customer_dependents.can_make_purchases IS 'Se o dependente pode fazer compras';

-- =============================================
-- 4. HISTÓRICO DE ASSOCIAÇÃO
-- =============================================

CREATE TABLE public.customer_membership_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Informações da Mudança
  action TEXT NOT NULL CHECK (action IN ('joined', 'upgraded', 'downgraded', 'suspended', 'reactivated', 'cancelled')),
  previous_membership_type TEXT,
  new_membership_type TEXT,
  previous_status TEXT,
  new_status TEXT,
  
  -- Detalhes
  reason TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.customer_membership_history IS 'Histórico de mudanças na associação dos sócios';
COMMENT ON COLUMN public.customer_membership_history.action IS 'Tipo de ação realizada na associação';
COMMENT ON COLUMN public.customer_membership_history.processed_by IS 'Funcionário que processou a mudança';

-- =============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para customers
CREATE INDEX idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_membership_number ON public.customers(membership_number) WHERE membership_number IS NOT NULL;
CREATE INDEX idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_cpf ON public.customers(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_customers_phone ON public.customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_name_search ON public.customers USING gin(to_tsvector('portuguese', name));

-- Índices para endereços
CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_primary ON public.customer_addresses(customer_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_customer_addresses_type ON public.customer_addresses(address_type);

-- Índices para dependentes
CREATE INDEX idx_customer_dependents_customer_id ON public.customer_dependents(customer_id);
CREATE INDEX idx_customer_dependents_status ON public.customer_dependents(status);
CREATE INDEX idx_customer_dependents_cpf ON public.customer_dependents(cpf) WHERE cpf IS NOT NULL;

-- Índices para histórico
CREATE INDEX idx_customer_membership_history_customer_id ON public.customer_membership_history(customer_id);
CREATE INDEX idx_customer_membership_history_action ON public.customer_membership_history(action);
CREATE INDEX idx_customer_membership_history_date ON public.customer_membership_history(created_at);

-- =============================================
-- 6. TRIGGERS PARA UPDATED_AT
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_dependents_updated_at
  BEFORE UPDATE ON public.customer_dependents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. TRIGGER PARA HISTÓRICO DE ASSOCIAÇÃO
-- =============================================

CREATE OR REPLACE FUNCTION public.track_membership_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra mudanças se for um sócio (member)
  IF NEW.customer_type = 'member' AND (
    OLD.membership_type IS DISTINCT FROM NEW.membership_type OR
    OLD.membership_status IS DISTINCT FROM NEW.membership_status
  ) THEN
    INSERT INTO public.customer_membership_history (
      customer_id,
      action,
      previous_membership_type,
      new_membership_type,
      previous_status,
      new_status,
      reason
    ) VALUES (
      NEW.id,
      CASE 
        WHEN OLD.membership_status IS DISTINCT FROM NEW.membership_status THEN
          CASE NEW.membership_status
            WHEN 'active' THEN 'reactivated'
            WHEN 'suspended' THEN 'suspended'
            WHEN 'cancelled' THEN 'cancelled'
            ELSE 'upgraded'
          END
        WHEN OLD.membership_type IS DISTINCT FROM NEW.membership_type THEN
          CASE 
            WHEN OLD.membership_type IS NULL THEN 'joined'
            ELSE 'upgraded'
          END
        ELSE 'upgraded'
      END,
      OLD.membership_type,
      NEW.membership_type,
      OLD.membership_status,
      NEW.membership_status,
      'Alteração automática via sistema'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_customer_membership_changes
  AFTER UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.track_membership_changes();

-- =============================================
-- 8. FUNÇÕES AUXILIARES
-- =============================================

-- Função para buscar clientes por termo
CREATE OR REPLACE FUNCTION public.search_customers(
  search_term TEXT,
  customer_type_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  customer_type TEXT,
  membership_number TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.customer_type,
    c.membership_number,
    c.status,
    c.created_at
  FROM public.customers c
  WHERE 
    (search_term IS NULL OR (
      c.name ILIKE '%' || search_term || '%' OR
      c.email ILIKE '%' || search_term || '%' OR
      c.phone ILIKE '%' || search_term || '%' OR
      c.cpf ILIKE '%' || search_term || '%' OR
      c.membership_number ILIKE '%' || search_term || '%'
    ))
    AND (customer_type_filter IS NULL OR c.customer_type = customer_type_filter)
    AND (status_filter IS NULL OR c.status = status_filter)
  ORDER BY 
    CASE WHEN c.name ILIKE search_term || '%' THEN 1 ELSE 2 END,
    c.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter cliente com endereços e dependentes
CREATE OR REPLACE FUNCTION public.get_customer_complete_info(customer_uuid UUID)
RETURNS JSON AS $$
DECLARE
  customer_info JSON;
  addresses_info JSON;
  dependents_info JSON;
BEGIN
  -- Buscar informações do cliente
  SELECT to_json(c.*) INTO customer_info
  FROM public.customers c
  WHERE c.id = customer_uuid;
  
  -- Buscar endereços
  SELECT json_agg(a.*) INTO addresses_info
  FROM public.customer_addresses a
  WHERE a.customer_id = customer_uuid;
  
  -- Buscar dependentes
  SELECT json_agg(d.*) INTO dependents_info
  FROM public.customer_dependents d
  WHERE d.customer_id = customer_uuid AND d.status = 'active';
  
  -- Retornar JSON combinado
  RETURN json_build_object(
    'customer', customer_info,
    'addresses', COALESCE(addresses_info, '[]'::json),
    'dependents', COALESCE(dependents_info, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_membership_history ENABLE ROW LEVEL SECURITY;

-- Políticas para CUSTOMERS
-- Admins têm acesso total
CREATE POLICY "Admins have full access to customers" 
  ON public.customers FOR ALL 
  USING (public.get_my_role() = 'admin') 
  WITH CHECK (public.get_my_role() = 'admin');

-- Funcionários podem visualizar e criar clientes
CREATE POLICY "Employees can view and create customers" 
  ON public.customers FOR SELECT 
  USING (public.get_my_role() IN ('admin', 'employee', 'manager'));

CREATE POLICY "Employees can create customers" 
  ON public.customers FOR INSERT 
  WITH CHECK (public.get_my_role() IN ('admin', 'employee', 'manager'));

CREATE POLICY "Employees can update customers" 
  ON public.customers FOR UPDATE 
  USING (public.get_my_role() IN ('admin', 'employee', 'manager')) 
  WITH CHECK (public.get_my_role() IN ('admin', 'employee', 'manager'));

-- Clientes podem ver apenas seus próprios dados (se tiverem conta no sistema)
CREATE POLICY "Customers can view their own data" 
  ON public.customers FOR SELECT 
  USING (auth.uid()::text = id::text);

-- Políticas para CUSTOMER_ADDRESSES
CREATE POLICY "Admins have full access to addresses" 
  ON public.customer_addresses FOR ALL 
  USING (public.get_my_role() = 'admin') 
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Employees can manage addresses" 
  ON public.customer_addresses FOR ALL 
  USING (public.get_my_role() IN ('admin', 'employee', 'manager')) 
  WITH CHECK (public.get_my_role() IN ('admin', 'employee', 'manager'));

-- Políticas para CUSTOMER_DEPENDENTS
CREATE POLICY "Admins have full access to dependents" 
  ON public.customer_dependents FOR ALL 
  USING (public.get_my_role() = 'admin') 
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Employees can manage dependents" 
  ON public.customer_dependents FOR ALL 
  USING (public.get_my_role() IN ('admin', 'employee', 'manager')) 
  WITH CHECK (public.get_my_role() IN ('admin', 'employee', 'manager'));

-- Políticas para CUSTOMER_MEMBERSHIP_HISTORY
CREATE POLICY "Admins and managers can view membership history" 
  ON public.customer_membership_history FOR SELECT 
  USING (public.get_my_role() IN ('admin', 'manager'));

CREATE POLICY "System can insert membership history" 
  ON public.customer_membership_history FOR INSERT 
  WITH CHECK (true); -- Permite inserções automáticas via triggers

-- =============================================
-- 10. DADOS INICIAIS (OPCIONAL)
-- =============================================

-- Migrar dados existentes da tabela members (se necessário)
-- Esta seção pode ser descomentada se quiser migrar dados existentes
/*
INSERT INTO public.customers (
  name, email, phone, customer_type, membership_type, 
  status, join_date, created_at
)
SELECT 
  name, email, phone, 'member', membership_type,
  status, join_date, created_at
FROM public.members
WHERE NOT EXISTS (
  SELECT 1 FROM public.customers c WHERE c.email = members.email
);
*/

-- =============================================
-- 11. COMENTÁRIOS FINAIS
-- =============================================

-- Esta migração cria um sistema completo de gestão de clientes que:
-- 1. Unifica sócios e não-sócios em uma única tabela
-- 2. Permite múltiplos endereços por cliente
-- 3. Suporta dependentes para sócios
-- 4. Mantém histórico de mudanças na associação
-- 5. Implementa busca eficiente por texto
-- 6. Garante segurança através de RLS
-- 7. Otimiza performance com índices apropriados