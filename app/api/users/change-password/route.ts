import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Validar autenticación
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return Response.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }
  if (newPassword !== confirmPassword) {
    return Response.json({ error: 'La nueva contraseña y la confirmación no coinciden' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return Response.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  // Verificar contraseña actual contra el hash guardado
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, password_hash')
    .eq('id', session.user.id)
    .single()

  if (error || !user?.password_hash) {
    return Response.json({ error: 'No se pudo verificar el usuario' }, { status: 500 })
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) {
    return Response.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
  }

  // Hashear y actualizar la nueva contraseña
  const password_hash = await bcrypt.hash(newPassword, 12)
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
  return Response.json({ success: true })
}
