import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  const { data, error } = await supabaseAdmin.from('site_config').select('*').single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { data: existing } = await supabaseAdmin.from('site_config').select('id').single()

  const updateData = { ...body, updated_at: new Date().toISOString() }

  let result
  if (existing?.id) {
    result = await supabaseAdmin
      .from('site_config')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabaseAdmin.from('site_config').insert(updateData).select().single()
  }

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 })
  return Response.json(result.data)
}
