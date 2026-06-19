import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-gray-800">¡Pago confirmado!</h1>
        <p className="text-gray-500">
          Tu pago fue procesado exitosamente. Ya podés acceder al curso desde tu área de estudiante.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/student" className="btn-primary py-3 px-6">
            Ir a mi área →
          </Link>
          <Link href="/" className="btn-outline py-3 px-6">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
