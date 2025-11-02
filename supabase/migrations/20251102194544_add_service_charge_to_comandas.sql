-- Adiciona campos para controlar os 10% do garçom nas comandas
ALTER TABLE comandas
ADD COLUMN IF NOT EXISTS service_charge BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_charge_amount DECIMAL(10, 2);

-- Adiciona comentários para documentação
COMMENT ON COLUMN comandas.service_charge IS 'Indica se os 10% do garçom foram incluídos';
COMMENT ON COLUMN comandas.service_charge_amount IS 'Valor total com os 10% do garçom incluídos';
