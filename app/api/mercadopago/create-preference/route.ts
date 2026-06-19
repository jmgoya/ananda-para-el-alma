import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { createPreference } from '@/lib/mercadopago'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id } = await request.json()

  // Validate course exists and is published
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('id, title, price, status')
    .eq('id', course_id)
    .eq('status', 'published')
    .single()

  if (courseError || !course) {
    return Response.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  // Check if user already has approved access
  const { data: existing } = await supabaseAdmin
    .from('course_access')
    .select('status')
    .eq('user_id', session.user.id)
    .eq('course_id', course_id)
    .eq('status', 'approved')
    .single()

  if (existing) {
    return Response.json({ error: 'Ya tenés acceso a este curso' }, { status: 400 })
  }

  try {
    const preference = await createPreference({
      courseId: course.id,
      courseTitle: course.title,
      coursePrice: Number(course.price),
      userId: session.user.id,
      userEmail: session.user.email!,
    })

    // Register a pending online transaction
    await supabaseAdmin.from('course_access').upsert({
      user_id: session.user.id,
      course_id: course_id,
      status: 'pending',
      payment_method: 'online',
    })

    await supabaseAdmin.from('transactions').insert({
      user_id: session.user.id,
      course_id: course_id,
      amount: course.price,
      currency: 'ARS',
      mercadopago_preference_id: preference.id,
      status: 'pending',
    })

    return Response.json({ init_point: preference.init_point })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear preferencia'
    return Response.json({ error: message }, { status: 500 })
  }
}
