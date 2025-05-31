"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Trash2, UserPlus, Edit, User } from "lucide-react"

interface UserData {
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

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const { toast } = useToast()

  // Form states for new user
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState("user")
  const [newActive, setNewActive] = useState(true)

  // Form states for edit user
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRole, setEditRole] = useState("")
  const [editActive, setEditActive] = useState(true)

  // Load users from database
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Create new user
  const createUser = async () => {
    if (!newUsername || !newPassword || !newName) {
      toast({
        title: "Erro",
        description: "Usuário, senha e nome são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            username: newUsername,
            password: newPassword,
            name: newName,
            email: newEmail || null,
            role: newRole,
            active: newActive,
          },
        ])
        .select()

      if (error) throw error

      // Reset form
      setNewUsername("")
      setNewPassword("")
      setNewName("")
      setNewEmail("")
      setNewRole("user")
      setNewActive(true)
      setIsCreateUserDialogOpen(false)

      // Reload users
      await loadUsers()

      toast({
        title: "Sucesso",
        description: "Usuário cadastrado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar usuário",
        variant: "destructive",
      })
    }
  }

  // Delete user
  const deleteUser = async (userId: number) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error

      // Reload users
      await loadUsers()

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      })
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      })
    }
  }

  // Start editing user
  const startEditUser = (user: UserData) => {
    setSelectedUser(user)
    setEditUsername(user.username)
    setEditPassword("") // Don't show the current password
    setEditName(user.name)
    setEditEmail(user.email || "")
    setEditRole(user.role)
    setEditActive(user.active)
    setIsEditUserDialogOpen(true)
  }

  // Update user
  const updateUser = async () => {
    if (!selectedUser || !editUsername || !editName) {
      toast({
        title: "Erro",
        description: "Usuário e nome são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const updates: any = {
        username: editUsername,
        name: editName,
        email: editEmail || null,
        role: editRole,
        active: editActive,
        updated_at: new Date().toISOString(),
      }

      // Only update password if a new one is provided
      if (editPassword) {
        updates.password = editPassword
      }

      const { error } = await supabase.from("users").update(updates).eq("id", selectedUser.id)

      if (error) throw error

      // Reset form
      setSelectedUser(null)
      setEditUsername("")
      setEditPassword("")
      setEditName("")
      setEditEmail("")
      setEditRole("")
      setEditActive(true)
      setIsEditUserDialogOpen(false)

      // Reload users
      await loadUsers()

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      })
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-12 w-12 text-zinc-400 mx-auto mb-4 animate-pulse" />
          <p className="text-zinc-400">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Usuários ({users.length})</h2>
        <Button className="bg-zinc-700 hover:bg-zinc-600" onClick={() => setIsCreateUserDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Cadastrar Usuário
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum usuário encontrado</h3>
          <p className="text-zinc-400 mb-4">Comece cadastrando seu primeiro usuário.</p>
          <Button className="bg-zinc-700 hover:bg-zinc-600" onClick={() => setIsCreateUserDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Cadastrar Primeiro Usuário
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              className={`bg-zinc-900 border-zinc-700 rounded-lg text-white ${!user.active ? "opacity-70" : undefined}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{user.name}</span>
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                        className={user.role === "admin" ? "" : "text-white border-zinc-600"}
                      >
                        {user.role === "admin" ? "Administrador" : "Usuário"}
                      </Badge>
                      {!user.active && <Badge variant="destructive">Inativo</Badge>}
                    </CardTitle>
                    <CardDescription>
                      @{user.username} • Desde {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                      size="sm"
                      onClick={() => startEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white border-gray-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-400">Email</p>
                    <p className="font-medium">{user.email || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Última atualização</p>
                    <p className="font-medium">{new Date(user.updated_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700 text-white rounded-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Preencha os dados do usuário para cadastrá-lo no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white" htmlFor="username">
                  Nome de Usuário *
                </Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="nome.sobrenome"
                />
              </div>
              <div>
                <Label className="text-white" htmlFor="password">
                  Senha *
                </Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Senha segura"
                />
              </div>
            </div>

            <div>
              <Label className="text-white" htmlFor="name">
                Nome Completo *
              </Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white" htmlFor="email">
                  Email
                </Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label className="text-white" htmlFor="role">
                  Função
                </Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white rounded-lg">
                    <SelectItem className="text-white" value="user">
                      Usuário
                    </SelectItem>
                    <SelectItem className="text-white" value="admin">
                      Administrador
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="active" checked={newActive} onCheckedChange={setNewActive} />
              <Label className="text-white" htmlFor="active">
                Usuário ativo
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                onClick={() => setIsCreateUserDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-zinc-700 hover:bg-zinc-600"
                onClick={createUser}
                disabled={!newUsername || !newPassword || !newName}
              >
                Cadastrar Usuário
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700 text-white rounded-lg">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription className="text-zinc-400">Atualize os dados do usuário no sistema.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white" htmlFor="editUsername">
                  Nome de Usuário *
                </Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                  id="editUsername"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="nome.sobrenome"
                />
              </div>
              <div>
                <Label className="text-white" htmlFor="editPassword">
                  Nova Senha (deixe em branco para manter a atual)
                </Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                  id="editPassword"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Nova senha"
                />
              </div>
            </div>

            <div>
              <Label className="text-white" htmlFor="editName">
                Nome Completo *
              </Label>
              <Input
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white" htmlFor="editEmail">
                  Email
                </Label>
                <Input
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                  id="editEmail"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label className="text-white" htmlFor="editRole">
                  Função
                </Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white rounded-lg">
                    <SelectItem className="text-white" value="user">
                      Usuário
                    </SelectItem>
                    <SelectItem className="text-white" value="admin">
                      Administrador
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="editActive" checked={editActive} onCheckedChange={setEditActive} />
              <Label className="text-white" htmlFor="editActive">
                Usuário ativo
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                onClick={() => setIsEditUserDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-zinc-700 hover:bg-zinc-600"
                onClick={updateUser}
                disabled={!editUsername || !editName}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
