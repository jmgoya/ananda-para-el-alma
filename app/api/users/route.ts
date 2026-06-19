import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, name } = body

  if (!email || !password) {
    return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ email: email.toLowerCase(), password_hash: hash, name, role: 'user' })
    .select('id, email, name, role')
    .single()

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'El email ya está registrado' }, { status: 400 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}
