import { syncPaymentStatus } from '@/lib/mercadopago'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MercadoPago sends different notification types
    if (body.type !== 'payment') {
      return Response.json({ received: true })
    }

    const paymentId = String(body.data?.id)
    if (!paymentId) return Response.json({ received: true })

    await syncPaymentStatus(paymentId)
  } catch (err) {
    // Always return 200 to MercadoPago, but log so failures are diagnosable
    console.error('mercadopago webhook error:', err)
  }

  return Response.json({ received: true })
}
