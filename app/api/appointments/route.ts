import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function toTimeString(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === 'true'
  const date = searchParams.get('date')

  if (all) {
    // Vista de agenda del administrador: incluye turnos reservados y datos del cliente
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (date) {
      query = query.eq('date', date)
    } else {
      const today = new Date().toISOString().slice(0, 10)
      query = query.gte('date', today)
    }

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data)
  }

  // Vista pública: solo turnos libres a futuro, sin datos de clientes
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('id, date, start_time, end_time, status')
    .eq('status', 'available')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  // Crear horarios libres (uno o varios generados en bloque). Admin only.
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { date, start_time, end_time, duration_minutes } = body

  if (!date || !start_time || !end_time) {
    return Response.json({ error: 'Fecha, hora de inicio y hora de fin son requeridas' }, { status: 400 })
  }

  const startMin = toMinutes(start_time)
  const endMin = toMinutes(end_time)
  if (endMin <= startMin) {
    return Response.json({ error: 'La hora de fin debe ser posterior a la de inicio' }, { status: 400 })
  }

  const slots: { date: string; start_time: string; end_time: string; created_by: string }[] = []
  const step = Number(duration_minutes) > 0 ? Number(duration_minutes) : endMin - startMin

  for (let t = startMin; t + step <= endMin; t += step) {
    slots.push({
      date,
      start_time: toTimeString(t),
      end_time: toTimeString(t + step),
      created_by: session.user.id,
    })
  }

  if (slots.length === 0) {
    return Response.json({ error: 'No se generó ningún horario con esos valores' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .upsert(slots, { onConflict: 'date,start_time', ignoreDuplicates: true })
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
