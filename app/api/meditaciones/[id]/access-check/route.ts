import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: Request, ctx: RouteContext<'/api/meditaciones/[id]/access-check'>) {
  // Verificar si el usuario actual tiene acceso a una meditación considerando los 4 tipos de visibility
  const { id } = await ctx.params
  const session = await getServerSession(authOptions)

  const { data: m } = await supabaseAdmin.from('meditations').select('visibility').eq('id', id).single()
  if (!m) return Response.json({ hasAccess: false })

  if (m.visibility === 'public') return Response.json({ hasAccess: true })
  if (session?.user?.role === 'admin') return Response.json({ hasAccess: true })
  if (m.visibility === 'registered') return Response.json({ hasAccess: !!session?.user })

  if (m.visibility === 'code_restricted') {
    if (!session?.user) return Response.json({ hasAccess: false })

    const { data: codeLinks } = await supabaseAdmin
      .from('redemption_code_meditations')
      .select('code_id')
      .eq('meditation_id', id)

    const codeIds = (codeLinks ?? []).map((cl: any) => cl.code_id)
    if (codeIds.length === 0) return Response.json({ hasAccess: false })

    const { data: use } = await supabaseAdmin
      .from('redemption_code_uses')
      .select('id')
      .eq('user_id', session.user.id)
      .in('code_id', codeIds)
      .limit(1)
      .single()

    return Response.json({ hasAccess: !!use })
  }

  return Response.json({ hasAccess: false })
}
