"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Package, Eye, Trash2, Users, Building2, Printer, Edit, User, LogOut } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { LoginScreen } from "@/components/login-screen"
import { UserManagement } from "@/components/user-management"

interface Customer {
  id: number
  razao_social: string
  endereco: string | null
  cnpj: string | null
  email: string
  telefone: string | null
  created_at: string
  updated_at: string
}

interface Product {
  id: number
  referencia: string
  preco: number
  foto_url: string | null
  created_at: string
  updated_at: string
}

interface OrderItem {
  id: number
  order_id: number
  product_id: number
  size_number: number
  quantity: number
  unit_price: number
  created_at: string
  product?: Product
}

interface Order {
  id: number
  customer_id: number
  status: "pending" | "processing" | "completed" | "cancelled"
  total: number
  notes: string | null
  created_at: string
  updated_at: string
  user_id: number | null
  customer?: Customer
  order_items?: OrderItem[]
  user?: {
    id: number
    username: string
    name: string
  }
}

type ActiveTab = "novo-pedido" | "clientes" | "pedidos" | "produtos" | "usuarios"

function ShadyPedidosApp() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>("pedidos")
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false)
  const [isViewCustomerDialogOpen, setIsViewCustomerDialogOpen] = useState(false)
  const [isViewProductDialogOpen, setIsViewProductDialogOpen] = useState(false)
  const [isCreateCustomerDialogOpen, setIsCreateCustomerDialogOpen] = useState(false)
  const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Form states for new customer
  const [newCustomerRazaoSocial, setNewCustomerRazaoSocial] = useState("")
  const [newCustomerEndereco, setNewCustomerEndereco] = useState("")
  const [newCustomerCnpj, setNewCustomerCnpj] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [newCustomerTelefone, setNewCustomerTelefone] = useState("")

  // Form states for new product
  const [newProductReferencia, setNewProductReferencia] = useState("")
  const [newProductPreco, setNewProductPreco] = useState(0)
  const [newProductFoto, setNewProductFoto] = useState<File | null>(null)
  const [newProductFotoPreview, setNewProductFotoPreview] = useState<string | null>(null)

  // New state variables for order creation
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [sizeQuantities, setSizeQuantities] = useState<Record<number, number>>({})
  const [orderItems, setOrderItems] = useState<
    Array<{
      productId: number
      productName: string
      unitPrice: number
      sizes: Array<{ size: number; quantity: number }>
      totalQuantity: number
    }>
  >([])
  const [notes, setNotes] = useState("Previsão de entrega xx/xx/xxxx\nCondição de pagamento xx-xx-xx")

  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editOrderItems, setEditOrderItems] = useState<
    Array<{
      id?: number
      productId: number
      productName: string
      unitPrice: number
      sizes: Array<{ size: number; quantity: number }>
      totalQuantity: number
    }>
  >([])
  const [editSelectedProductId, setEditSelectedProductId] = useState("")
  const [editSizeQuantities, setEditSizeQuantities] = useState<Record<number, number>>({})
  const [editNotes, setEditNotes] = useState("")

  // Load customers from database
  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setCustomers(data || [])
    } catch (error) {
      console.error("Error loading customers:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      })
    }
  }

  // Load products from database
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      })
    }
  }

  // Load orders from database
  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
        *,
        customer:customers(*),
        order_items(
          *,
          product:products(*)
        ),
        user:users(id, username, name)
      `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Create new customer
  const createCustomer = async () => {
    if (!newCustomerRazaoSocial || !newCustomerEmail) {
      toast({
        title: "Erro",
        description: "Razão Social e Email são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            razao_social: newCustomerRazaoSocial,
            endereco: newCustomerEndereco || null,
            cnpj: newCustomerCnpj || null,
            email: newCustomerEmail,
            telefone: newCustomerTelefone || null,
          },
        ])
        .select()

      if (error) throw error

      // Reset form
      setNewCustomerRazaoSocial("")
      setNewCustomerEndereco("")
      setNewCustomerCnpj("")
      setNewCustomerEmail("")
      setNewCustomerTelefone("")
      setIsCreateCustomerDialogOpen(false)

      // Reload customers
      await loadCustomers()

      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error creating customer:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar cliente",
        variant: "destructive",
      })
    }
  }

  // Delete customer
  const deleteCustomer = async (customerId: number) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", customerId)

      if (error) throw error

      // Reload data
      await loadCustomers()
      await loadOrders()

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      })
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir cliente",
        variant: "destructive",
      })
    }
  }

  // Create new product
  const createProduct = async () => {
    if (!newProductReferencia || newProductPreco <= 0) {
      toast({
        title: "Erro",
        description: "Referência e preço são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const fotoUrl = newProductFotoPreview || null

      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            referencia: newProductReferencia,
            preco: newProductPreco,
            foto_url: fotoUrl,
          },
        ])
        .select()

      if (error) throw error

      // Reset form
      setNewProductReferencia("")
      setNewProductPreco(0)
      setNewProductFoto(null)
      setNewProductFotoPreview(null)
      setIsCreateProductDialogOpen(false)

      // Reload products
      await loadProducts()

      toast({
        title: "Sucesso",
        description: "Produto cadastrado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar produto",
        variant: "destructive",
      })
    }
  }

  // Delete product
  const deleteProduct = async (productId: number) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error

      // Reload products
      await loadProducts()

      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso!",
      })
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir produto",
        variant: "destructive",
      })
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: Order["status"]) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error

      // Reload orders
      await loadOrders()

      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado!",
      })
    } catch (error: any) {
      console.error("Error updating order status:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status",
        variant: "destructive",
      })
    }
  }

  // Delete order
  const deleteOrder = async (orderId: number) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId)

      if (error) throw error

      // Reload orders
      await loadOrders()

      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso!",
      })
    } catch (error: any) {
      console.error("Error deleting order:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir pedido",
        variant: "destructive",
      })
    }
  }

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewProductFoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewProductFotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadCustomers()
      loadProducts()
      loadOrders()
      // Inicializar observações com texto padrão
      setNotes("Previsão de entrega xx/xx/xxxx\nCondição de pagamento xx-xx-xx")
    }
  }, [user])

  // Handle size quantity changes
  const handleSizeQuantityChange = (size: number, quantity: number) => {
    setSizeQuantities((prev) => ({
      ...prev,
      [size]: quantity,
    }))
  }

  // Add product with sizes to order
  const addProductToOrder = () => {
    const selectedProduct = products.find((p) => p.id === Number(selectedProductId))
    if (!selectedProduct) return

    const sizes = Object.entries(sizeQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([size, quantity]) => ({ size: Number(size), quantity }))

    if (sizes.length === 0) return

    const totalQuantity = sizes.reduce((sum, item) => sum + item.quantity, 0)

    const newOrderItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.referencia,
      unitPrice: selectedProduct.preco,
      sizes,
      totalQuantity,
    }

    setOrderItems((prev) => [...prev, newOrderItem])

    // Reset selections
    setSelectedProductId("")
    setSizeQuantities({})

    toast({
      title: "Produto adicionado",
      description: `${selectedProduct.referencia} adicionado ao pedido`,
    })
  }

  // Remove order item
  const removeOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Calculate order total
  const calculateOrderTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalQuantity * item.unitPrice, 0)
  }

  // Create order from selection
  const createOrderFromSelection = async () => {
    const selectedCustomer = customers.find((c) => c.id === Number(selectedCustomerId))
    if (!selectedCustomer || orderItems.length === 0) return

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            customer_id: selectedCustomer.id,
            status: "pending",
            total: calculateOrderTotal(),
            notes: notes || null,
            user_id: user?.id,
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItemsToInsert = orderItems.flatMap((item) =>
        item.sizes.map((sizeItem) => ({
          order_id: orderData.id,
          product_id: item.productId,
          size_number: sizeItem.size,
          quantity: sizeItem.quantity,
          unit_price: item.unitPrice,
        })),
      )

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsToInsert)

      if (itemsError) throw itemsError

      // Reset form
      setSelectedCustomerId("")
      setSelectedProductId("")
      setSizeQuantities({})
      setOrderItems([])
      setNotes("Previsão de entrega xx/xx/xxxx\nCondição de pagamento xx-xx-xx")

      // Reload orders
      await loadOrders()

      // Switch to orders tab
      setActiveTab("pedidos")

      toast({
        title: "Sucesso",
        description: "Pedido criado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error creating order:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar pedido",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "processing":
        return "Processando"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const getCustomerOrders = (customerId: number) => {
    return orders.filter((order) => order.customer_id === customerId)
  }

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return digits.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return digits.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  // Adicionar a função de impressão após as outras funções utilitárias (após formatPhone)

  const printOrder = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Agrupar itens por produto para mostrar tamanhos juntos
    const groupedItems =
      order.order_items?.reduce(
        (acc, item) => {
          const productId = item.product_id
          if (!acc[productId]) {
            acc[productId] = {
              product: item.product,
              sizes: [],
              totalQuantity: 0,
              totalValue: 0,
            }
          }
          acc[productId].sizes.push({
            size: item.size_number,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })
          acc[productId].totalQuantity += item.quantity
          acc[productId].totalValue += item.quantity * item.unit_price
          return acc
        },
        {} as Record<number, any>,
      ) || {}

    const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Pedido #${order.id} - ShadyPedidos</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        color: #333;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #333;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .company-name {
        font-size: 28px;
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 5px;
      }
      .order-title {
        font-size: 20px;
        margin-top: 10px;
      }
      .section {
        margin-bottom: 25px;
      }
      .section-title {
        font-size: 16px;
        font-weight: bold;
        background-color: #f3f4f6;
        padding: 8px 12px;
        border-left: 4px solid #2563eb;
        margin-bottom: 15px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
      }
      .info-item {
        display: flex;
        flex-direction: column;
      }
      .info-label {
        font-weight: bold;
        color: #666;
        font-size: 12px;
        text-transform: uppercase;
        margin-bottom: 3px;
      }
      .info-value {
        font-size: 14px;
      }
      .product-item {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        display: flex;
        gap: 15px;
      }
      .product-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #d1d5db;
      }
      .product-details {
        flex: 1;
      }
      .product-name {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 8px;
      }
      .sizes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 8px;
        margin: 10px 0;
      }
      .size-item {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 6px;
        text-align: center;
        font-size: 12px;
      }
      .size-number {
        font-weight: bold;
        display: block;
      }
      .size-qty {
        color: #666;
      }
      .product-total {
        text-align: right;
        font-weight: bold;
        color: #059669;
        font-size: 14px;
      }
      .total-section {
        border-top: 2px solid #333;
        padding-top: 15px;
        text-align: right;
      }
      .total-amount {
        font-size: 24px;
        font-weight: bold;
        color: #059669;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
      }
      .status-pending { background-color: #fef3c7; color: #92400e; }
      .status-processing { background-color: #dbeafe; color: #1e40af; }
      .status-completed { background-color: #d1fae5; color: #065f46; }
      .status-cancelled { background-color: #fee2e2; color: #991b1b; }
      .notes-section {
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 15px;
      }
      .created-by {
        font-style: italic;
        color: #666;
        text-align: right;
        margin-top: 20px;
        font-size: 12px;
      }
      @media print {
        body { margin: 0; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="company-name">ShadyPedidos</div>
      <div class="order-title">Pedido #${order.id}</div>
      <div style="margin-top: 10px; color: #666;">
        ${new Date(order.created_at).toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Dados do Cliente</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Razão Social</div>
          <div class="info-value">${order.customer?.razao_social || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${order.customer?.email || "N/A"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">CNPJ</div>
          <div class="info-value">${order.customer?.cnpj || "Não informado"}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Telefone</div>
          <div class="info-value">${order.customer?.telefone || "Não informado"}</div>
        </div>
      </div>
      ${
        order.customer?.endereco
          ? `
        <div class="info-item">
          <div class="info-label">Endereço</div>
          <div class="info-value">${order.customer.endereco}</div>
        </div>
      `
          : ""
      }
    </div>

    <div class="section">
      <div class="section-title">Produtos do Pedido</div>
      ${Object.values(groupedItems)
        .map(
          (group: any) => `
        <div class="product-item">
          ${
            group.product?.foto_url
              ? `
            <img src="${group.product.foto_url}" alt="${group.product.referencia}" class="product-image" />
          `
              : `
            <div class="product-image" style="background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">
              Sem foto
            </div>
          `
          }
          <div class="product-details">
            <div class="product-name">${group.product?.referencia || "Produto não encontrado"}</div>
            <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
              Preço unitário: R$ ${group.sizes[0]?.unitPrice?.toFixed(2) || "0.00"}
            </div>
            <div class="sizes-grid">
              ${group.sizes
                .map(
                  (size: any) => `
                <div class="size-item">
                  <span class="size-number">${size.size}</span>
                  <span class="size-qty">${size.quantity}x</span>
                </div>
              `,
                )
                .join("")}
            </div>
            <div class="product-total">
              Total: R$ ${group.totalValue.toFixed(2)} (${group.totalQuantity} ${group.totalQuantity === 1 ? "item" : "itens"})
            </div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>

    <div class="section">
      <div class="section-title">Informações do Pedido</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">
            <span class="status-badge status-${order.status}">
              ${getStatusText(order.status)}
            </span>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">Data de Criação</div>
          <div class="info-value">${new Date(order.created_at).toLocaleDateString("pt-BR")}</div>
        </div>
      </div>
    </div>

    ${
      order.notes
        ? `
      <div class="section">
        <div class="section-title">Observações</div>
        <div class="notes-section">
          ${order.notes}
        </div>
      </div>
    `
        : ""
    }

    <div class="total-section">
      <div style="font-size: 18px; margin-bottom: 5px;">Total do Pedido:</div>
      <div class="total-amount">R$ ${order.total.toFixed(2)}</div>
    </div>

    <div class="created-by">
      Pedido criado por: ${order.user?.name || "Usuário não identificado"}
    </div>

    <script>
      window.onload = function() {
        window.print();
        window.onafterprint = function() {
          window.close();
        };
      };
    </script>
  </body>
  </html>
`

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  // Iniciar edição de pedido
  const startEditOrder = (order: Order) => {
    setEditingOrder(order)
    setEditNotes(order.notes || "")

    // Converter order_items para o formato de edição
    const groupedItems =
      order.order_items?.reduce(
        (acc, item) => {
          const productId = item.product_id
          if (!acc[productId]) {
            acc[productId] = {
              productId,
              productName: item.product?.referencia || "Produto não encontrado",
              unitPrice: item.unit_price,
              sizes: [],
              totalQuantity: 0,
            }
          }
          acc[productId].sizes.push({
            size: item.size_number,
            quantity: item.quantity,
          })
          acc[productId].totalQuantity += item.quantity
          return acc
        },
        {} as Record<number, any>,
      ) || {}

    setEditOrderItems(Object.values(groupedItems))
    setIsEditOrderDialogOpen(true)
  }

  // Adicionar produto na edição
  const addProductToEditOrder = () => {
    const selectedProduct = products.find((p) => p.id === Number(editSelectedProductId))
    if (!selectedProduct) return

    const sizes = Object.entries(editSizeQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([size, quantity]) => ({ size: Number(size), quantity }))

    if (sizes.length === 0) return

    const totalQuantity = sizes.reduce((sum, item) => sum + item.quantity, 0)

    const newOrderItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.referencia,
      unitPrice: selectedProduct.preco,
      sizes,
      totalQuantity,
    }

    setEditOrderItems((prev) => [...prev, newOrderItem])
    setEditSelectedProductId("")
    setEditSizeQuantities({})

    toast({
      title: "Produto adicionado",
      description: `${selectedProduct.referencia} adicionado ao pedido`,
    })
  }

  // Remover item da edição
  const removeEditOrderItem = (index: number) => {
    setEditOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Calcular total da edição
  const calculateEditOrderTotal = () => {
    return editOrderItems.reduce((total, item) => total + item.totalQuantity * item.unitPrice, 0)
  }

  // Salvar edição do pedido
  const saveEditOrder = async () => {
    if (!editingOrder || editOrderItems.length === 0) return

    try {
      // Atualizar pedido
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          total: calculateEditOrderTotal(),
          notes: editNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingOrder.id)

      if (orderError) throw orderError

      // Deletar itens antigos
      const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", editingOrder.id)

      if (deleteError) throw deleteError

      // Inserir novos itens
      const orderItemsToInsert = editOrderItems.flatMap((item) =>
        item.sizes.map((sizeItem) => ({
          order_id: editingOrder.id,
          product_id: item.productId,
          size_number: sizeItem.size,
          quantity: sizeItem.quantity,
          unit_price: item.unitPrice,
        })),
      )

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsToInsert)

      if (itemsError) throw itemsError

      // Reset form
      setEditingOrder(null)
      setEditOrderItems([])
      setEditNotes("")
      setEditSelectedProductId("")
      setEditSizeQuantities({})
      setIsEditOrderDialogOpen(false)

      // Reload orders
      await loadOrders()

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!",
      })
    } catch (error: any) {
      console.error("Error updating order:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pedido",
        variant: "destructive",
      })
    }
  }

  // Handle edit size quantity changes
  const handleEditSizeQuantityChange = (size: number, quantity: number) => {
    setEditSizeQuantities((prev) => ({
      ...prev,
      [size]: quantity,
    }))
  }

  if (!user) {
    return <LoginScreen />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black shadow-sm border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-white" />
              <h1 className="text-2xl font-bold text-white italic">SHADY</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden md:flex items-center space-x-1 text-sm">
                <User className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-300">{user.name}</span>
                <Badge variant="outline" className="ml-2 text-white border-zinc-600">
                  {user.role === "admin" ? "Admin" : "Usuário"}
                </Badge>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="Sair"
                className="text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Sair</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-auto mt-2">
            <TabsList className="grid w-full grid-cols-5 bg-zinc-900">
              <TabsTrigger value="novo-pedido" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo Pedido</span>
              </TabsTrigger>
              <TabsTrigger value="clientes" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="produtos" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Produtos</span>
              </TabsTrigger>
              <TabsTrigger value="pedidos" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Pedidos</span>
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Usuários</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)}>
          {/* Novo Pedido Tab */}
          <TabsContent value="novo-pedido" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Novo Pedido</CardTitle>
                  <CardDescription>Selecione o cliente e os produtos com tamanhos e quantidades.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer and Product Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="customerSelect">Cliente *</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.razao_social} - {customer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {customers.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Nenhum cliente cadastrado.{" "}
                          <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("clientes")}>
                            Cadastrar cliente
                          </Button>
                        </p>
                      )}
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="productSelect">Produto *</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.referencia} - R$ {product.preco.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {products.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Nenhum produto cadastrado.{" "}
                          <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("produtos")}>
                            Cadastrar produto
                          </Button>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Size Selection */}
                  {selectedProductId && (
                    <div className="space-y-4">
                      <Separator /> <h3 className="text-lg font-medium">Selecionar Tamanhos e Quantidades</h3>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {Array.from({ length: 9 }, (_, i) => i + 33).map((size) => (
                          <div key={size} className="space-y-2">
                            <Label htmlFor={`size-${size}`} className="text-center block">
                              Tamanho {size}
                            </Label>
                            <Input
                              id={`size-${size}`}
                              type="number"
                              min="0"
                              value={sizeQuantities[size] || 0}
                              onChange={(e) => handleSizeQuantityChange(size, Number(e.target.value))}
                              className="text-center"
                            />
                          </div>
                        ))}
                      </div>
                      {Object.values(sizeQuantities).some((qty) => qty > 0) && (
                        <div className="mt-4">
                          <Button onClick={addProductToOrder} className="w-full">
                            Adicionar ao Pedido
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Items */}
                  {orderItems.length > 0 && (
                    <div className="space-y-4">
                      <Separator />
                      <h3 className="text-lg font-medium">Itens do Pedido</h3>
                      <div className="space-y-3">
                        {orderItems.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{item.productName}</h4>
                                <p className="text-sm text-gray-600">Preço unitário: R$ {item.unitPrice.toFixed(2)}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removeOrderItem(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                              {item.sizes.map((sizeItem) => (
                                <div key={sizeItem.size} className="text-center p-2 bg-white rounded">
                                  <div className="font-medium">Tam {sizeItem.size}</div>
                                  <div className="text-gray-600">Qtd: {sizeItem.quantity}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-right">
                              <span className="font-bold">
                                Total: R$ {(item.totalQuantity * item.unitPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="text-right font-bold text-xl">
                          Total Geral: R$ {calculateOrderTotal().toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={createOrderFromSelection}
                    disabled={!selectedCustomerId || orderItems.length === 0}
                    className="w-full"
                  >
                    Criar Pedido
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Clientes ({customers.length})</h2>
              <Button onClick={() => setIsCreateCustomerDialogOpen(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Cadastrar Cliente
              </Button>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-500 mb-4">Comece cadastrando seu primeiro cliente.</p>
                <Button onClick={() => setIsCreateCustomerDialogOpen(true)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Cliente
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {customers.map((customer) => (
                  <Card key={customer.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <Building2 className="h-5 w-5" />
                            <span>{customer.razao_social}</span>
                            <Badge variant="outline">ID: {customer.id}</Badge>
                          </CardTitle>
                          <CardDescription>
                            {customer.email} • Cliente desde {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setIsViewCustomerDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCustomer(customer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">CNPJ</p>
                          <p className="font-medium">{customer.cnpj || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Telefone</p>
                          <p className="font-medium">{customer.telefone || "Não informado"}</p>
                        </div>
                      </div>
                      {customer.endereco && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Endereço</p>
                          <p className="font-medium">{customer.endereco}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Produtos Tab */}
          <TabsContent value="produtos" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Produtos ({products.length})</h2>
              <Button onClick={() => setIsCreateProductDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Produto
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mb-4">Comece cadastrando seu primeiro produto.</p>
                <Button onClick={() => setIsCreateProductDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Produto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {product.referencia}
                            <Badge variant="outline">ID: {product.id}</Badge>
                          </CardTitle>
                          <CardDescription>
                            Cadastrado em {new Date(product.created_at).toLocaleDateString("pt-BR")}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product)
                              setIsViewProductDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {product.foto_url && (
                        <div className="mb-4">
                          <img
                            src={product.foto_url || "/placeholder.svg"}
                            alt={product.referencia}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">R$ {product.preco.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pedidos Tab */}
          <TabsContent value="pedidos" className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-500 mb-4">Comece criando seu primeiro pedido.</p>
                <Button onClick={() => setActiveTab("novo-pedido")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Pedido
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Pedidos ({orders.length})</h2>
                </div>

                <div className="grid gap-6">
                  {orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <span>Pedido #{order.id}</span>
                              <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                            </CardTitle>
                            <CardDescription>
                              {order.customer?.razao_social} • {new Date(order.created_at).toLocaleDateString("pt-BR")}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditOrder(order)}
                              title="Editar Pedido"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printOrder(order)}
                              title="Imprimir Pedido"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsViewOrderDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteOrder(order.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-600">
                              {order.order_items?.length || 0}{" "}
                              {(order.order_items?.length || 0) === 1 ? "item" : "itens"}
                            </p>
                            <p className="font-bold text-lg">R$ {order.total.toFixed(2)}</p>
                          </div>
                          <Select
                            value={order.status}
                            onValueChange={(value: Order["status"]) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="processing">Processando</SelectItem>
                              <SelectItem value="completed">Concluído</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Usuários Tab */}
          <TabsContent value="usuarios" className="space-y-6">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateCustomerDialogOpen} onOpenChange={setIsCreateCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            <DialogDescription>Preencha os dados da empresa para cadastrar um novo cliente.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  value={newCustomerRazaoSocial}
                  onChange={(e) => setNewCustomerRazaoSocial(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={newCustomerCnpj}
                  onChange={(e) => setNewCustomerCnpj(formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={newCustomerEndereco}
                onChange={(e) => setNewCustomerEndereco(e.target.value)}
                placeholder="Endereço completo da empresa"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={newCustomerTelefone}
                  onChange={(e) => setNewCustomerTelefone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateCustomerDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createCustomer} disabled={!newCustomerRazaoSocial || !newCustomerEmail}>
                Cadastrar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={isCreateProductDialogOpen} onOpenChange={setIsCreateProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            <DialogDescription>Preencha os dados do produto para cadastrá-lo no sistema.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="foto">Foto do Produto</Label>
              <div className="mt-2">
                <input
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {newProductFotoPreview && (
                <div className="mt-4">
                  <img
                    src={newProductFotoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referencia">Referência do Produto *</Label>
                <Input
                  id="referencia"
                  value={newProductReferencia}
                  onChange={(e) => setNewProductReferencia(e.target.value)}
                  placeholder="REF-001"
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço *</Label>
                <Input
                  id="preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProductPreco}
                  onChange={(e) => setNewProductPreco(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateProductDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createProduct} disabled={!newProductReferencia || newProductPreco <= 0}>
                Cadastrar Produto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido #{selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Criado em {new Date(selectedOrder.created_at).toLocaleDateString("pt-BR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium mb-2">Dados do Cliente</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p>
                      <strong>Razão Social:</strong> {selectedOrder.customer?.razao_social}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.customer?.email}
                    </p>
                    {selectedOrder.customer?.telefone && (
                      <p>
                        <strong>Telefone:</strong> {selectedOrder.customer.telefone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-medium mb-2">Itens do Pedido</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">
                            {item.product?.referencia} - Tamanho {item.size_number}
                          </span>
                          <span className="text-gray-500 ml-2">
                            {item.quantity}x R$ {item.unit_price.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-medium">R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="text-right font-bold text-lg pt-2 border-t">
                      Total: R$ {selectedOrder.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-medium mb-2">Observações</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <h3 className="font-medium mb-2">Status</h3>
                  <Badge className={getStatusColor(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={isViewCustomerDialogOpen} onOpenChange={setIsViewCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCustomer.razao_social}</DialogTitle>
                <DialogDescription>
                  Cliente desde {new Date(selectedCustomer.created_at).toLocaleDateString("pt-BR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-medium mb-2">Informações da Empresa</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>ID:</strong> {selectedCustomer.id}
                    </p>
                    <p>
                      <strong>Razão Social:</strong> {selectedCustomer.razao_social}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedCustomer.email}
                    </p>
                    {selectedCustomer.cnpj && (
                      <p>
                        <strong>CNPJ:</strong> {selectedCustomer.cnpj}
                      </p>
                    )}
                    {selectedCustomer.telefone && (
                      <p>
                        <strong>Telefone:</strong> {selectedCustomer.telefone}
                      </p>
                    )}
                    {selectedCustomer.endereco && (
                      <p>
                        <strong>Endereço:</strong> {selectedCustomer.endereco}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <h3 className="font-medium mb-2">Pedidos Recentes</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhum pedido encontrado</p>
                    ) : (
                      getCustomerOrders(selectedCustomer.id)
                        .slice(0, 5)
                        .map((order) => (
                          <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium">Pedido #{order.id}</span>
                              <span className="text-gray-500 ml-2">
                                {new Date(order.created_at).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                              <span className="font-medium">R$ {order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewProductDialogOpen} onOpenChange={setIsViewProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.referencia}</DialogTitle>
                <DialogDescription>
                  Cadastrado em {new Date(selectedProduct.created_at).toLocaleDateString("pt-BR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedProduct.foto_url && (
                  <div className="text-center">
                    <img
                      src={selectedProduct.foto_url || "/placeholder.svg"}
                      alt={selectedProduct.referencia}
                      className="w-64 h-64 object-cover rounded-lg mx-auto border"
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Informações do Produto</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <strong>ID:</strong> {selectedProduct.id}
                    </p>
                    <p>
                      <strong>Referência:</strong> {selectedProduct.referencia}
                    </p>
                    <p>
                      <strong>Preço:</strong> R$ {selectedProduct.preco.toFixed(2)}
                    </p>
                    <p>
                      <strong>Cadastrado em:</strong> {new Date(selectedProduct.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOrderDialogOpen} onOpenChange={setIsEditOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Editar Pedido #{editingOrder.id}</DialogTitle>
                <DialogDescription>
                  Cliente: {editingOrder.customer?.razao_social} • Criado em{" "}
                  {new Date(editingOrder.created_at).toLocaleDateString("pt-BR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Product Selection for Adding */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Adicionar Produto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editProductSelect">Produto</Label>
                      <Select value={editSelectedProductId} onValueChange={setEditSelectedProductId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.referencia} - R$ {product.preco.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Size Selection for Adding */}
                  {editSelectedProductId && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Selecionar Tamanhos e Quantidades</h4>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                        {Array.from({ length: 9 }, (_, i) => i + 33).map((size) => (
                          <div key={size} className="space-y-2">
                            <Label htmlFor={`edit-size-${size}`} className="text-center block">
                              Tamanho {size}
                            </Label>
                            <Input
                              id={`edit-size-${size}`}
                              type="number"
                              min="0"
                              value={editSizeQuantities[size] || 0}
                              onChange={(e) => handleEditSizeQuantityChange(size, Number(e.target.value))}
                              className="text-center"
                            />
                          </div>
                        ))}
                      </div>

                      {Object.values(editSizeQuantities).some((qty) => qty > 0) && (
                        <Button onClick={addProductToEditOrder} className="w-full">
                          Adicionar ao Pedido
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Current Order Items */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Itens do Pedido</h3>
                  {editOrderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum item no pedido</p>
                  ) : (
                    <div className="space-y-3">
                      {editOrderItems.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{item.productName}</h4>
                              <p className="text-sm text-gray-600">Preço unitário: R$ {item.unitPrice.toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeEditOrderItem(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                            {item.sizes.map((sizeItem) => (
                              <div key={sizeItem.size} className="text-center p-2 bg-white rounded">
                                <div className="font-medium">Tam {sizeItem.size}</div>
                                <div className="text-gray-600">Qtd: {sizeItem.quantity}</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-right">
                            <span className="font-bold">
                              Total: R$ {(item.totalQuantity * item.unitPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="text-right font-bold text-xl">
                        Total Geral: R$ {calculateEditOrderTotal().toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Notes */}
                <div>
                  <Label htmlFor="editNotes">Observações</Label>
                  <Textarea
                    id="editNotes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditOrderDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveEditOrder} disabled={editOrderItems.length === 0}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ShadyPedidos() {
  return (
    <AuthProvider>
      <ShadyPedidosApp />
    </AuthProvider>
  )
}
