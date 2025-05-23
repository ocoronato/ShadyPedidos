# ShadyPedidos

Sistema de gerenciamento de pedidos para empresas de calçados, com controle de clientes, produtos, usuários e pedidos.

![ShadyPedidos Logo](https://placeholder.svg?height=200&width=400&query=ShadyPedidos)

## 📋 Sobre o Projeto

ShadyPedidos é um sistema web completo para gerenciamento de pedidos de calçados, desenvolvido para facilitar o controle de estoque, clientes e vendas. O sistema permite o cadastro de produtos com diferentes tamanhos, gerenciamento de clientes, criação e acompanhamento de pedidos, além de controle de usuários com diferentes níveis de acesso.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React.js, Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Sistema próprio com controle de usuários
- **Hospedagem**: Vercel (recomendado)

## ✨ Funcionalidades Principais

### Gestão de Clientes
- Cadastro completo de clientes com informações de contato
- Visualização de histórico de pedidos por cliente
- Busca e filtragem de clientes

### Gestão de Produtos
- Cadastro de produtos com referência, preço e foto
- Suporte para upload de imagens de produtos
- Visualização detalhada de produtos

### Gestão de Pedidos
- Criação de pedidos com seleção de cliente e produtos
- Seleção de tamanhos (33-41) e quantidades para cada produto
- Cálculo automático de totais
- Impressão de pedidos em formato profissional
- Rastreamento do usuário que criou o pedido
- Edição e atualização de pedidos existentes
- Diferentes status de pedido (Pendente, Processando, Concluído, Cancelado)

### Gestão de Usuários
- Sistema de login seguro
- Diferentes níveis de acesso (Administrador, Usuário)
- Gerenciamento de usuários (criar, editar, ativar/desativar)

## 📦 Requisitos do Sistema

- Node.js 18.x ou superior
- Conta no Supabase (gratuita ou paga)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🔧 Instalação e Configuração

### 1. Clone o repositório
\`\`\`bash
git clone https://github.com/seu-usuario/shady-pedidos.git
cd shady-pedidos
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
# ou
yarn install
\`\`\`

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
\`\`\`

### 4. Configure o banco de dados
Execute os scripts SQL fornecidos no Supabase SQL Editor para criar as tabelas necessárias:

\`\`\`sql
-- Criar tabela de clientes
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  endereco TEXT,
  cnpj VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de produtos
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  referencia VARCHAR(255) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de usuários
CREATE TABLE users (
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

-- Criar tabela de pedidos
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  user_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de itens de pedido
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  size_number INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir usuário administrador padrão
INSERT INTO users (username, password, name, email, role) 
VALUES ('felipe', '1305', 'Felipe', 'felipe@shadypedidos.com', 'admin')
ON CONFLICT (username) DO NOTHING;
\`\`\`

### 5. Inicie o servidor de desenvolvimento
\`\`\`bash
npm run dev
# ou
yarn dev
\`\`\`

### 6. Acesse o sistema
Abra seu navegador e acesse `http://localhost:3000`

## 🔐 Credenciais Padrão

O sistema vem com um usuário administrador padrão:

- **Usuário**: felipe
- **Senha**: 1305

Recomendamos alterar a senha após o primeiro acesso.

## 📊 Estrutura do Banco de Dados

### Tabela `customers`
Armazena informações dos clientes.

### Tabela `products`
Armazena informações dos produtos, incluindo referência, preço e URL da foto.

### Tabela `users`
Armazena informações dos usuários do sistema, incluindo credenciais e nível de acesso.

### Tabela `orders`
Armazena informações dos pedidos, incluindo cliente, status, total e observações.

### Tabela `order_items`
Armazena os itens de cada pedido, incluindo produto, tamanho, quantidade e preço unitário.

## 📱 Como Usar

### Login
1. Acesse o sistema usando as credenciais fornecidas
2. A tela de login será exibida automaticamente

### Cadastro de Clientes
1. Acesse a aba "Clientes"
2. Clique em "Cadastrar Cliente"
3. Preencha os dados do cliente e salve

### Cadastro de Produtos
1. Acesse a aba "Produtos"
2. Clique em "Cadastrar Produto"
3. Preencha os dados do produto, incluindo referência e preço
4. Opcionalmente, faça upload de uma foto do produto

### Criação de Pedidos
1. Acesse a aba "Novo Pedido"
2. Selecione um cliente
3. Selecione um produto
4. Escolha os tamanhos e quantidades
5. Adicione o produto ao pedido
6. Repita os passos 3-5 para adicionar mais produtos
7. Adicione observações se necessário
8. Clique em "Criar Pedido"

### Gerenciamento de Pedidos
1. Acesse a aba "Pedidos"
2. Visualize todos os pedidos cadastrados
3. Use os botões de ação para:
   - Editar pedido
   - Imprimir pedido
   - Visualizar detalhes
   - Excluir pedido
4. Altere o status do pedido conforme necessário

### Gerenciamento de Usuários
1. Acesse a aba "Usuários"
2. Visualize todos os usuários cadastrados
3. Clique em "Cadastrar Usuário" para adicionar novos usuários
4. Use os botões de ação para editar ou excluir usuários existentes
