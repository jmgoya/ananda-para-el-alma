import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, newPassword } = body

  if (!token || !newPassword) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return Response.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  // Validar que el token exista, no esté usado y no haya expirado
  const { data: resetToken, error } = await supabaseAdmin
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used')
    .eq('token', token)
    .single()

  if (error || !resetToken) {
    return Response.json({ error: 'El enlace no es válido o ya fue utilizado. Solicitá uno nuevo.' }, { status: 400 })
  }
  if (resetToken.used) {
    return Response.json({ error: 'Este enlace ya fue utilizado. Solicitá uno nuevo.' }, { status: 400 })
  }
  if (new Date(resetToken.expires_at) < new Date()) {
    return Response.json({ error: 'El enlace expiró. Solicitá uno nuevo.' }, { status: 400 })
  }

  // Hashear la nueva contraseña y actualizar el usuario
  const password_hash = await bcrypt.hash(newPassword, 12)

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ password_hash, updated_at: new Date().toISOString() })
    .eq('id', resetToken.user_id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  // Marcar el token como usado
  await supabaseAdmin
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('id', resetToken.id)

  return Response.json({ success: true })
}
