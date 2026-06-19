import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('payment_config')
    .select('online_payments_enabled, payment_instructions')
    .single()

  if (error) return Response.json({ online_payments_enabled: false, payment_instructions: '' })
  return Response.json(data)
}
