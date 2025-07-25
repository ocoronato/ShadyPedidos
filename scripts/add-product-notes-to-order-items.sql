-- Adicionar coluna de observações específicas por produto nos itens do pedido
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_notes TEXT;

-- Comentário para documentar a mudança
COMMENT ON COLUMN order_items.product_notes IS 'Observações específicas para este produto no pedido';
