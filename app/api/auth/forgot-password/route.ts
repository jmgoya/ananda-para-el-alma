import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.SMTP_FROM ?? 'noreply@anandaparaelalma.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://anandaparaelalma.com'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const email = (body.email ?? '').trim().toLowerCase()

  if (!email) {
    return Response.json({ error: 'El email es requerido' }, { status: 400 })
  }

  // Buscar usuario — si no existe respondemos igual para no filtrar info
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('email', email)
    .single()

  if (user) {
    // Generar token seguro con expiración de 1 hora
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await supabaseAdmin.from('password_reset_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    })

    const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Recuperá tu contraseña - Ananda para el Alma',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#1f2937">
          <h1 style="font-size:24px;font-weight:700;color:#7c3aed;margin-bottom:8px">Ananda para el Alma</h1>
          <p style="color:#6b7280;margin-bottom:32px">Restablecé tu contraseña</p>
          <p>Hola${user.name ? ` ${user.name}` : ''},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón para continuar:</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
               style="background:#7c3aed;color:white;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none;display:inline-block">
              Restablecer contraseña
            </a>
          </div>
          <p style="font-size:14px;color:#6b7280">Este enlace expira en 1 hora. Si no solicitaste esto, podés ignorar este email.</p>
          <p style="font-size:14px;color:#9ca3af;margin-top:24px">Si el botón no funciona, copiá y pegá esta URL en tu navegador:<br>
            <a href="${resetUrl}" style="color:#7c3aed;word-break:break-all">${resetUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
          <p style="font-size:12px;color:#9ca3af">— Ananda para el Alma</p>
        </div>
      `,
    })
  }

  // Siempre responder con el mismo mensaje (no revelar si el email existe)
  return Response.json({ success: true })
}
