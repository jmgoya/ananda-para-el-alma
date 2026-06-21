import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('manual_payment_methods')
    .select('*')
    .order('"order"', { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('manual_payment_methods')
    .insert({
      name: body.name,
      instructions: body.instructions ?? '',
      enabled: body.enabled ?? true,
      order: body.order ?? 0,
    })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
