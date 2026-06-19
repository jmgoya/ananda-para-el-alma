import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  const userId = searchParams.get('userId')

  let query = supabaseAdmin
    .from('course_access')
    .select('*, courses(id, title, price, cover_url), users(id, email, name)')

  if (session.user.role === 'admin') {
    if (userId) query = query.eq('user_id', userId)
    if (courseId) query = query.eq('course_id', courseId)
  } else {
    query = query.eq('user_id', session.user.id)
    if (courseId) query = query.eq('course_id', courseId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { course_id, payment_method, payment_note } = body

  // Check for existing approved access
  const { data: existing } = await supabaseAdmin
    .from('course_access')
    .select('id, status')
    .eq('user_id', session.user.id)
    .eq('course_id', course_id)
    .eq('status', 'approved')
    .single()

  if (existing) {
    return Response.json({ error: 'Ya tenés acceso a este curso' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('course_access')
    .insert({
      user_id: session.user.id,
      course_id,
      status: 'pending',
      payment_method: payment_method ?? 'manual',
      payment_note,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
