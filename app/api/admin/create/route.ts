import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

// One-time route to create the initial admin user.
// Protected by a secret token.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.ADMIN_SETUP_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const body = await request.json()
  const { email, password, name } = body

  if (!email || !password) {
    return Response.json({ error: 'Email and password required' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash: hash, name: name ?? 'Admin', role: 'admin' })
    .select('id, email, role')
    .single()

  if (error) {
    if (error.code === '23505') return Response.json({ error: 'Email already registered' }, { status: 400 })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, user: data })
}
