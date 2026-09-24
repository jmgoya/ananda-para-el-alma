import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { getPaymentConfig } from './db'
import { supabaseAdmin } from './supabase'

export async function getMercadoPagoClient() {
  const config = await getPaymentConfig()
  if (!config?.online_payments_enabled || !config?.mercadopago_access_token) {
    throw new Error('MercadoPago no está configurado o los pagos online están desactivados')
  }
  return new MercadoPagoConfig({ accessToken: config.mercadopago_access_token })
}

export async function createPreference(params: {
  courseId: string
  courseTitle: string
  coursePrice: number
  userId: string
  userEmail: string
}) {
  const client = await getMercadoPagoClient()
  const preference = new Preference(client)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.courseId,
          title: params.courseTitle,
          unit_price: params.coursePrice,
          quantity: 1,
          currency_id: 'ARS',
        },
      ],
      payer: { email: params.userEmail },
      back_urls: {
        success: `${siteUrl}/checkout/success`,
        failure: `${siteUrl}/checkout/failure`,
        pending: `${siteUrl}/checkout/pending`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
      external_reference: `${params.userId}:${params.courseId}`,
    },
  })

  return result
}

export async function getPayment(paymentId: string) {
  const client = await getMercadoPagoClient()
  const payment = new Payment(client)
  return payment.get({ id: paymentId })
}

// MercadoPago's webhook notification can arrive slightly before the payment
// is actually queryable via the API, returning a transient 404. Retry a few
// times with a short delay before giving up.
export async function getPaymentWithRetry(paymentId: string, attempts = 3, delayMs = 1200) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await getPayment(paymentId)
    } catch (err) {
      const status = (err as { status?: number })?.status
      const isLastAttempt = i === attempts - 1
      if (status !== 404 || isLastAttempt) throw err
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('unreachable')
}

// Shared by the async webhook and the checkout success page: MercadoPago
// redirects the browser back with the payment id in the URL, so we can
// confirm the payment right away instead of relying solely on the webhook
// notification (which depends on the notification_url/dashboard webhook
// config actually reaching this app).
export async function syncPaymentStatus(paymentId: string) {
  const payment = await getPaymentWithRetry(paymentId)

  const [userId, courseId] = (payment.external_reference ?? '').split(':')
  if (!userId || !courseId) return null

  await supabaseAdmin
    .from('transactions')
    .update({
      mercadopago_payment_id: paymentId,
      status: payment.status ?? 'unknown',
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (payment.status === 'approved') {
    await supabaseAdmin.from('course_access').upsert(
      {
        user_id: userId,
        course_id: courseId,
        status: 'approved',
        payment_method: 'online',
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    )
  } else if (payment.status === 'rejected') {
    await supabaseAdmin
      .from('course_access')
      .update({ status: 'denied' })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'pending')
  }

  return { userId, courseId, status: payment.status ?? 'unknown' }
}
