import Link from 'next/link'

export default function CheckoutPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">⏳</div>
        <h1 className="text-3xl font-bold text-gray-800">Solicitud enviada</h1>
        <p className="text-gray-500">
          Tu solicitud de acceso fue enviada correctamente. Natalia la revisará pronto y te dará acceso al curso.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-sm text-amber-800 font-medium">¿Qué pasa ahora?</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            <li>• Natalia recibe tu solicitud</li>
            <li>• Verifica el pago (efectivo o transferencia)</li>
            <li>• Aprueba tu acceso al curso</li>
            <li>• Podés acceder desde tu área de estudiante</li>
          </ul>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/student" className="btn-primary py-3 px-6">
            Mi área
          </Link>
          <Link href="/" className="btn-outline py-3 px-6">
            Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
