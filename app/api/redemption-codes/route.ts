import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  // Listar todos los códigos con stats de meditaciones vinculadas y usos (admin only)
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('redemption_codes')
    .select('*, redemption_code_meditations(meditation_id), redemption_code_uses(id)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const codes = (data ?? []).map((c: any) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    active: c.active,
    created_at: c.created_at,
    updated_at: c.updated_at,
    meditation_count: c.redemption_code_meditations?.length ?? 0,
    use_count: c.redemption_code_uses?.length ?? 0,
  }))

  return Response.json(codes)
}

export async function POST(request: NextRequest) {
  // Crear código nuevo + vincular meditaciones elegidas (admin only)
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { code, description, meditation_ids } = body

  if (!code || typeof code !== 'string') {
    return Response.json({ error: 'El código es requerido' }, { status: 400 })
  }

  const { data: newCode, error } = await supabaseAdmin
    .from('redemption_codes')
    .insert({ code: code.trim().toUpperCase(), description })
    .select()
    .single()

  if (error) {
    const msg = error.message.includes('unique') ? 'Ya existe un código con ese nombre' : error.message
    return Response.json({ error: msg }, { status: 400 })
  }

  if (Array.isArray(meditation_ids) && meditation_ids.length > 0) {
    const links = meditation_ids.map((mid: string) => ({ code_id: newCode.id, meditation_id: mid }))
    await supabaseAdmin.from('redemption_code_meditations').insert(links)
  }

  return Response.json(newCode, { status: 201 })
}
