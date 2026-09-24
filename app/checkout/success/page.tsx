import Link from 'next/link'
import { syncPaymentStatus } from '@/lib/mercadopago'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string; collection_id?: string }>
}) {
  // MercadoPago redirects here with the payment id as a query param. Confirm
  // it right away instead of relying solely on the async webhook, whose
  // delivery depends on external config (notification_url reachability,
  // MercadoPago dashboard webhook settings, matching access token, etc.).
  const { payment_id, collection_id } = await searchParams
  const paymentId = payment_id ?? collection_id

  let result: Awaited<ReturnType<typeof syncPaymentStatus>> = null
  if (paymentId) {
    result = await syncPaymentStatus(paymentId).catch((err) => {
      console.error('checkout success reconciliation error:', err)
      return null
    })
  }

  const stillPending = result?.status && result.status !== 'approved' && result.status !== 'rejected'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl">{stillPending ? '⏳' : '🎉'}</div>
        <h1 className="text-3xl font-bold text-gray-800">
          {stillPending ? 'Estamos confirmando tu pago' : '¡Pago confirmado!'}
        </h1>
        <p className="text-gray-500">
          {stillPending
            ? 'MercadoPago todavía está procesando el pago. En unos minutos vas a ver el curso habilitado en tu área de estudiante.'
            : 'Tu pago fue procesado exitosamente. Ya podés acceder al curso desde tu área de estudiante.'}
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
