import { supabaseAdmin } from '@/lib/supabase'
import { getPayment } from '@/lib/mercadopago'
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

    // Validate payment by querying MercadoPago API
    const payment = await getPayment(paymentId)

    // Parse external_reference: "userId:courseId"
    const [userId, courseId] = (payment.external_reference ?? '').split(':')
    if (!userId || !courseId) return Response.json({ received: true })

    // Update transaction record
    await supabaseAdmin
      .from('transactions')
      .update({
        mercadopago_payment_id: paymentId,
        status: payment.status ?? 'unknown',
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)

    if (payment.status === 'approved') {
      // Grant course access
      const { data: existing } = await supabaseAdmin
        .from('course_access')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

      if (existing?.id) {
        await supabaseAdmin
          .from('course_access')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabaseAdmin.from('course_access').insert({
          user_id: userId,
          course_id: courseId,
          status: 'approved',
          payment_method: 'online',
          approved_at: new Date().toISOString(),
        })
      }
    } else if (payment.status === 'rejected') {
      await supabaseAdmin
        .from('course_access')
        .update({ status: 'denied' })
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('status', 'pending')
    }
  } catch (err) {
    // Always return 200 to MercadoPago, but log so failures are diagnosable
    console.error('mercadopago webhook error:', err)
  }

  return Response.json({ received: true })
}
