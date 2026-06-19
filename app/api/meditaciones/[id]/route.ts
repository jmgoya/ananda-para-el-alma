import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: Request, ctx: RouteContext<'/api/meditaciones/[id]'>) {
  const { id } = await ctx.params
  const { data, error } = await supabaseAdmin.from('meditations').select('*').eq('id', id).single()
  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PUT(request: Request, ctx: RouteContext<'/api/meditaciones/[id]'>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json()
  const { data, error } = await supabaseAdmin
    .from('meditations')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/meditaciones/[id]'>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const { error } = await supabaseAdmin.from('meditations').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
