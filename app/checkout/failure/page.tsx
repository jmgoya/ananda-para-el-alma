import Link from 'next/link'

export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">😔</div>
        <h1 className="text-3xl font-bold text-gray-800">El pago no se pudo procesar</h1>
        <p className="text-gray-500">
          Hubo un problema al procesar tu pago. Podés reintentar o elegir otra opción de pago.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/courses" className="btn-primary py-3 px-6">
            Volver a los cursos
          </Link>
          <Link href="/" className="btn-outline py-3 px-6">
            Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
