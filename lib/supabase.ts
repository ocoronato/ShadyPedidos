import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: number
          razao_social: string
          endereco: string | null
          cnpj: string | null
          email: string
          telefone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          razao_social: string
          endereco?: string | null
          cnpj?: string | null
          email: string
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          razao_social?: string
          endereco?: string | null
          cnpj?: string | null
          email?: string
          telefone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          referencia: string
          preco: number
          foto_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          referencia: string
          preco: number
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          referencia?: string
          preco?: number
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          customer_id: number
          status: string
          total: number
          notes: string | null
          created_at: string
          updated_at: string
          user_id: number | null
        }
        Insert: {
          id?: number
          customer_id: number
          status?: string
          total: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          user_id?: number | null
        }
        Update: {
          id?: number
          customer_id?: number
          status?: string
          total?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          user_id?: number | null
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          size_number: number
          quantity: number
          unit_price: number
          created_at: string
          product_notes: string | null
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          size_number: number
          quantity: number
          unit_price: number
          created_at?: string
          product_notes?: string | null
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          size_number?: number
          quantity?: number
          unit_price?: number
          created_at?: string
          product_notes?: string | null
        }
      }
      users: {
        Row: {
          id: number
          username: string
          password: string
          name: string
          email: string | null
          role: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          password: string
          name: string
          email?: string | null
          role?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          name?: string
          email?: string | null
          role?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
