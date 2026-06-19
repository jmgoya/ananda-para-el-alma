import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Validate the user is authenticated
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return Response.json({ error: 'Debés iniciar sesión para canjear un código' }, { status: 401 })
  }

  const body = await request.json()
  if (!body.code || typeof body.code !== 'string') {
    return Response.json({ error: 'El código es requerido' }, { status: 400 })
  }

  // Buscar el código en la DB (case-insensitive, sin espacios)
  const normalizedCode = body.code.trim().toUpperCase()
  const { data: redemptionCode, error: codeError } = await supabaseAdmin
    .from('redemption_codes')
    .select('id, code, active')
    .ilike('code', normalizedCode)
    .single()

  // Validar que el código exista y esté activo
  if (codeError || !redemptionCode || !redemptionCode.active) {
    return Response.json({ error: 'Este código no es válido' }, { status: 404 })
  }

  // Validar que el usuario no lo haya canjeado antes
  const { data: existingUse } = await supabaseAdmin
    .from('redemption_code_uses')
    .select('id')
    .eq('code_id', redemptionCode.id)
    .eq('user_id', session.user.id)
    .single()

  if (existingUse) {
    return Response.json({ error: 'Ya canjeaste este código anteriormente' }, { status: 409 })
  }

  // Registrar el canje en redemption_code_uses
  const { error: insertError } = await supabaseAdmin
    .from('redemption_code_uses')
    .insert({ code_id: redemptionCode.id, user_id: session.user.id })

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  // Retornar la lista de meditaciones desbloqueadas
  const { data: links } = await supabaseAdmin
    .from('redemption_code_meditations')
    .select('meditation_id, meditations(id, title, description, duration_minutes)')
    .eq('code_id', redemptionCode.id)

  const meditations = links?.map((r: any) => r.meditations).filter(Boolean) ?? []

  return Response.json({ success: true, meditations })
}
