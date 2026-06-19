import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: Request, ctx: RouteContext<'/api/course-access/[id]'>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const body = await request.json()

  const updateData: Record<string, unknown> = { status: body.status }
  if (body.admin_note) updateData.admin_note = body.admin_note
  if (body.status === 'approved') updateData.approved_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('course_access')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
