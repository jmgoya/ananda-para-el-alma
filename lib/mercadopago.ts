import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { getPaymentConfig } from './db'

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
