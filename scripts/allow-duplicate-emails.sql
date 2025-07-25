-- Verificar se existe uma restrição de unicidade no email e removê-la
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Procurar por restrições de unicidade na coluna email da tabela customers
    SELECT conname INTO constraint_name
    FROM pg_constraint
    JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
    JOIN pg_attribute ON pg_attribute.attrelid = pg_class.oid AND pg_attribute.attnum = ANY(pg_constraint.conkey)
    WHERE pg_class.relname = 'customers'
    AND pg_attribute.attname = 'email'
    AND pg_constraint.contype = 'u';
    
    -- Se encontrar uma restrição, removê-la
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE customers DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Restrição de unicidade % removida da coluna email', constraint_name;
    ELSE
        RAISE NOTICE 'Nenhuma restrição de unicidade encontrada na coluna email';
    END IF;
END $$;

-- Verificar se existe um índice único no email e removê-lo
DO $$
DECLARE
    index_name text;
BEGIN
    -- Procurar por índices únicos na coluna email da tabela customers
    SELECT indexname INTO index_name
    FROM pg_indexes
    WHERE tablename = 'customers'
    AND indexdef LIKE '%email%'
    AND indexdef LIKE '%unique%';
    
    -- Se encontrar um índice único, removê-lo
    IF index_name IS NOT NULL THEN
        EXECUTE 'DROP INDEX ' || index_name;
        RAISE NOTICE 'Índice único % removido da coluna email', index_name;
    ELSE
        RAISE NOTICE 'Nenhum índice único encontrado na coluna email';
    END IF;
END $$;

-- Adicionar um comentário para documentar a mudança
COMMENT ON COLUMN customers.email IS 'Email do cliente (não precisa ser único)';
