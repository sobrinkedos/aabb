-- Verificar se a tabela bar_tables existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'bar_tables'
);

-- Se existir, mostrar a estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bar_tables'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros
SELECT COUNT(*) as total_tables FROM bar_tables;

-- Mostrar alguns registros se existirem
SELECT * FROM bar_tables LIMIT 5;