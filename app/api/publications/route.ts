import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import { slugify } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const visibility = searchParams.get('visibility')

  let query = supabaseAdmin
    .from('publications')
    .select('*')
    .order('published_at', { ascending: false })
  if (visibility) query = query.eq('visibility', visibility)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const slug = body.slug || slugify(body.title)
  const { data, error } = await supabaseAdmin
    .from('publications')
    .insert({ ...body, slug, created_by: session.user.id })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
