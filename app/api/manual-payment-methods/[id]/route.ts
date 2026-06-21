import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: Request, ctx: RouteContext<'/api/manual-payment-methods/[id]'>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('manual_payment_methods')
    .update({
      name: body.name,
      instructions: body.instructions,
      enabled: body.enabled,
      order: body.order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/manual-payment-methods/[id]'>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const { count } = await supabaseAdmin
    .from('course_access')
    .select('*', { count: 'exact', head: true })
    .eq('manual_payment_method_id', id)

  if (count && count > 0) {
    return Response.json(
      { error: 'No se puede eliminar: hay solicitudes históricas vinculadas. Desactivalo en su lugar.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin.from('manual_payment_methods').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
