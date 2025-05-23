import Image from "next/image"

export default function Home() {
  return (
    <div className="bg-gray-100 h-screen">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="Shady Pedidos Logo" width={32} height={32} />
            <h1 className="text-2xl font-bold text-gray-900">ShadyPedidos</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* Your content */}
          <div className="px-4 py-6 sm:px-0">
            <div className="h-96 rounded-lg border-4 border-dashed border-gray-200"></div>
          </div>
          {/* /End replace */}
        </div>
      </main>
    </div>
  )
}
