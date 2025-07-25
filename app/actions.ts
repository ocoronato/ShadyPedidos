"use server"

import { supabase } from "@/lib/supabase"

export async function exportDatabaseStructureSql() {
  try {
    // Definições das tabelas. Adapte conforme a estrutura exata do seu banco.
    const tableDefinitions = `
-- Script de Estrutura para PostgreSQL (Padrão Supabase)
-- NOTA: A codificação UTF-8 é definida no nível do banco de dados em PostgreSQL.
-- Projetos Supabase usam UTF-8 por padrão, que é compatível com 'utf8_general_ci' do MySQL.
-- A sintaxe 'CHARSET' e 'COLLATE' não é usada aqui.

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  endereco TEXT,
  cnpj VARCHAR(20) UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  referencia VARCHAR(100) NOT NULL UNIQUE,
  preco DECIMAL(10, 2) NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  size_number INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  product_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices (opcional, mas bom para performance)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_customers_cnpj ON customers(cnpj);
CREATE INDEX IF NOT EXISTS idx_products_referencia ON products(referencia);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `

    return { success: true, data: tableDefinitions, filename: "shady_pedidos_schema.sql" }
  } catch (error: any) {
    console.error("Erro ao gerar SQL da estrutura do banco:", error)
    return { success: false, message: "Erro ao gerar SQL: " + error.message }
  }
}

export async function exportDatabaseDataJson() {
  try {
    const tables = ["users", "customers", "products", "orders", "order_items"]
    const allData: Record<string, any[]> = {}
    let success = true
    let errorMessage = ""

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*")
      if (error) {
        console.error(`Erro ao buscar dados da tabela ${table}:`, error)
        success = false
        errorMessage += `Erro na tabela ${table}: ${error.message}. `
        // Continuar tentando exportar outras tabelas
      } else {
        allData[table] = data || []
      }
    }

    if (!success) {
      // Se houve erro em alguma tabela, mas outras foram bem sucedidas,
      // ainda retorna os dados parciais com uma mensagem de erro.
      if (Object.keys(allData).length > 0) {
        return {
          success: false,
          data: JSON.stringify(allData, null, 2),
          filename: "shady_pedidos_data_partial.json",
          message: `Exportação parcial devido a erros: ${errorMessage}`,
        }
      }
      return { success: false, message: `Falha ao exportar dados: ${errorMessage}` }
    }

    return { success: true, data: JSON.stringify(allData, null, 2), filename: "shady_pedidos_data.json" }
  } catch (error: any) {
    console.error("Erro ao exportar dados do banco em JSON:", error)
    return { success: false, message: "Erro ao exportar dados em JSON: " + error.message }
  }
}
