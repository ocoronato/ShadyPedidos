"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Eye, EyeOff } from "lucide-react"

export function LoginScreen() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setIsLoggingIn(true)
    await login(username, password)
    setIsLoggingIn(false)
  }

  return (
    <div className="min-h-screen bg-zinc-800 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl h-[600px] bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left Side - Login Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="text-3xl font-semibold text-white mb-8">Login</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm text-zinc-400">
                  Usuario
                </Label>
                <Input
                  id="username"
                  placeholder="usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-zinc-400">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Logando..." : "Logar"}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side - Space Background */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {/* Animated space background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
            {/* Stars */}
            <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full opacity-40"></div>
            <div className="absolute top-32 left-1/3 w-0.5 h-0.5 bg-white rounded-full opacity-80"></div>
            <div className="absolute bottom-32 left-16 w-1 h-1 bg-white rounded-full opacity-50"></div>
            <div className="absolute bottom-20 right-1/3 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
            <div className="absolute top-1/2 right-10 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
            <div className="absolute top-16 left-1/2 w-1 h-1 bg-white rounded-full opacity-30"></div>
            <div className="absolute bottom-40 right-16 w-0.5 h-0.5 bg-white rounded-full opacity-90"></div>

            {/* Floating spheres */}
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-80 animate-pulse"></div>
            <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-gradient-to-br from-zinc-600 to-zinc-800 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-gradient-to-br from-zinc-500 to-zinc-700 rounded-full opacity-40"></div>

            {/* Vertical lines */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-zinc-600 to-transparent opacity-30"></div>
            <div className="absolute top-0 right-1/3 w-px h-2/3 bg-gradient-to-b from-transparent via-zinc-500 to-transparent opacity-20"></div>
          </div>

          {/* SHADY Logo */}
          <div className="absolute bottom-8 right-8 flex items-center space-x-2">
            <Package className="h-6 w-6 text-white" />
            <span className="text-white font-bold italic text-lg">SHADY</span>
          </div>
        </div>
      </div>

      {/* Instagram link */}
      <a
        href="https://instagram.com/dev.shady"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 text-zinc-500 text-sm hover:text-zinc-400 transition-colors cursor-pointer"
      >
        instagram:@dev.shady
      </a>
    </div>
  )
}
