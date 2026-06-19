import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin.from('payment_config').select('*').single()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Never expose the full access token to frontend — mask it
  const safe = {
    ...data,
    mercadopago_access_token: data.mercadopago_access_token
      ? '••••••••' + data.mercadopago_access_token.slice(-4)
      : null,
    mercadopago_public_key: data.mercadopago_public_key
      ? '••••••••' + data.mercadopago_public_key.slice(-4)
      : null,
  }

  return Response.json(safe)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const updateData: Record<string, unknown> = {
    online_payments_enabled: body.online_payments_enabled,
    payment_instructions: body.payment_instructions,
    updated_at: new Date().toISOString(),
  }

  // Only update tokens if new values provided (not masked placeholders)
  if (body.mercadopago_access_token && !body.mercadopago_access_token.startsWith('••••')) {
    updateData.mercadopago_access_token = body.mercadopago_access_token
  }
  if (body.mercadopago_public_key && !body.mercadopago_public_key.startsWith('••••')) {
    updateData.mercadopago_public_key = body.mercadopago_public_key
  }

  const { data: existing } = await supabaseAdmin.from('payment_config').select('id').single()

  let result
  if (existing?.id) {
    result = await supabaseAdmin
      .from('payment_config')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin.from('payment_config').insert(updateData).select().single()
  }

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 })
  return Response.json({ success: true })
}
