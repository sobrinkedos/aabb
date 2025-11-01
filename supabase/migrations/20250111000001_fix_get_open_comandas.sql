-- Corrigir função get_open_comandas para incluir status e comandas pending_payment
CREATE OR REPLACE FUNCTION get_open_comandas()
RETURNS TABLE (
  id UUID,
  table_number VARCHAR,
  customer_name VARCHAR,
  employee_name TEXT,
  status VARCHAR,
  total DECIMAL,
  people_count INTEGER,
  opened_at TIMESTAMPTZ,
  items_count BIGINT,
  pending_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    bt.number as table_number,
    COALESCE(bc.name, c.customer_name) as customer_name,
    p.name as employee_name,
    c.status,
    c.total,
    c.people_count,
    c.opened_at,
    COUNT(ci.id) as items_count,
    COUNT(ci.id) FILTER (WHERE ci.status IN ('pending', 'preparing')) as pending_items
  FROM comandas c
  LEFT JOIN bar_tables bt ON c.table_id = bt.id
  LEFT JOIN bar_customers bc ON c.customer_id = bc.id
  LEFT JOIN profiles p ON c.employee_id = p.id
  LEFT JOIN comanda_items ci ON c.id = ci.comanda_id
  WHERE c.status IN ('open', 'pending_payment')
  GROUP BY c.id, bt.number, bc.name, c.customer_name, p.name, c.status, c.total, c.people_count, c.opened_at
  ORDER BY c.opened_at;
END;
$$ LANGUAGE plpgsql;
