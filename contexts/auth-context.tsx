"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: number
  username: string
  name: string
  email: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("shadyUser")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("shadyUser")
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .eq("active", true)
        .single()

      if (error || !data) {
        toast({
          title: "Erro de login",
          description: "Usuário ou senha incorretos",
          variant: "destructive",
        })
        return false
      }

      const userData: User = {
        id: data.id,
        username: data.username,
        name: data.name,
        email: data.email,
        role: data.role,
      }

      setUser(userData)
      localStorage.setItem("shadyUser", JSON.stringify(userData))

      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${data.name}!`,
      })

      return true
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Erro de login",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("shadyUser")
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema com sucesso",
    })
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
