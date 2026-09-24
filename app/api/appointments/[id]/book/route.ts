import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { googleCalendarLink, formatTime } from '@/lib/utils'
import { Resend } from 'resend'
import { NextRequest } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.SMTP_FROM ?? 'noreply@anandaparaelalma.com'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/appointments/[id]/book'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const client_name = (body.client_name ?? '').trim()
  const client_email = (body.client_email ?? '').trim().toLowerCase()
  const client_phone = (body.client_phone ?? '').trim()
  const notes = (body.notes ?? '').trim() || null

  if (!client_name || !client_email || !client_phone) {
    return Response.json({ error: 'Nombre, email y teléfono son requeridos' }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  // Update condicionado a que siga disponible, para evitar reservas dobles
  const { data: appointment, error } = await supabaseAdmin
    .from('appointments')
    .update({
      status: 'booked',
      client_name,
      client_email,
      client_phone,
      notes,
      user_id: session?.user?.id ?? null,
      booked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'available')
    .select()
    .single()

  if (error || !appointment) {
    return Response.json({ error: 'Ese turno ya no está disponible. Elegí otro horario.' }, { status: 409 })
  }

  const dateLabel = new Date(`${appointment.date}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const startLabel = formatTime(appointment.start_time)
  const endLabel = formatTime(appointment.end_time)

  const calendarUrl = googleCalendarLink({
    title: 'Turno - Ananda para el Alma',
    description: `Turno de atención con Ananda para el Alma.${notes ? `\n\nNotas: ${notes}` : ''}`,
    date: appointment.date,
    startTime: appointment.start_time,
    endTime: appointment.end_time,
  })

  try {
    await resend.emails.send({
      from: FROM,
      to: client_email,
      subject: `Turno confirmado: ${dateLabel} a las ${startLabel}hs`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#1f2937">
          <h1 style="font-size:24px;font-weight:700;color:#7c3aed;margin-bottom:8px">Ananda para el Alma</h1>
          <p style="color:#6b7280;margin-bottom:32px">Turno confirmado</p>
          <p>Hola ${client_name},</p>
          <p>Tu turno quedó reservado para:</p>
          <div style="background:#f5f3ff;border-radius:8px;padding:16px 20px;margin:20px 0">
            <p style="margin:0;font-weight:600;text-transform:capitalize">${dateLabel}</p>
            <p style="margin:4px 0 0">${startLabel} a ${endLabel} hs</p>
          </div>
          <div style="text-align:center;margin:32px 0">
            <a href="${calendarUrl}"
               style="background:#7c3aed;color:white;padding:14px 28px;border-radius:8px;font-weight:600;text-decoration:none;display:inline-block">
              Agendar en Google Calendar
            </a>
          </div>
          <p style="font-size:14px;color:#6b7280">Si necesitás cancelar o reprogramar, respondé este email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0">
          <p style="font-size:12px;color:#9ca3af">— Ananda para el Alma</p>
        </div>
      `,
    })
  } catch {
    // No revertimos la reserva si el email falla; el admin la verá igual en la agenda
  }

  return Response.json(appointment)
}
