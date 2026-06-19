import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/redemption-codes/[id]'>) {
  // Obtener código con sus meditaciones vinculadas (admin only)
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { data, error } = await supabaseAdmin
    .from('redemption_codes')
    .select('*, redemption_code_meditations(meditation_id)')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/redemption-codes/[id]'>) {
  // Editar código existente: descripción, meditaciones vinculadas, activo/inactivo (admin only)
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()
  const { description, active, meditation_ids } = body

  const { error: updateError } = await supabaseAdmin
    .from('redemption_codes')
    .update({ description, active, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  if (meditation_ids !== undefined) {
    await supabaseAdmin.from('redemption_code_meditations').delete().eq('code_id', id)
    if (Array.isArray(meditation_ids) && meditation_ids.length > 0) {
      const links = meditation_ids.map((mid: string) => ({ code_id: id, meditation_id: mid }))
      await supabaseAdmin.from('redemption_code_meditations').insert(links)
    }
  }

  return Response.json({ success: true })
}
