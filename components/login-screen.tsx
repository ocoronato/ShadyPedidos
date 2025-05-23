import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const LoginScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Image src="/logo.svg" alt="Shady Pedidos Logo" width={40} height={40} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Shady Pedidos</h1>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="seuemail@exemplo.com" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input type="password" id="password" />
            </div>
            <Button className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginScreen
