import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  // Cancelar un turno reservado (vuelve a quedar libre). Admin only.
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()

  if (body.status === 'cancelled' || body.status === 'available') {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'available',
        client_name: null,
        client_email: null,
        client_phone: null,
        notes: null,
        user_id: null,
        booked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  return Response.json({ error: 'Operación no soportada' }, { status: 400 })
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/appointments/[id]'>) {
  // Eliminar un horario (admin only)
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
