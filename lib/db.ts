import { supabaseAdmin } from './supabase'

export async function getSiteConfig() {
  const { data } = await supabaseAdmin.from('site_config').select('*').single()
  return data
}

export async function getPaymentConfig() {
  const { data } = await supabaseAdmin.from('payment_config').select('*').single()
  return data
}

export async function getCourses(publishedOnly = true) {
  let query = supabaseAdmin.from('courses').select('*').order('created_at', { ascending: false })
  if (publishedOnly) query = query.eq('status', 'published')
  const { data } = await query
  return data ?? []
}

export async function getCourse(id: string) {
  const { data } = await supabaseAdmin
    .from('courses')
    .select('*, modules(*, materials(*))')
    .eq('id', id)
    .single()
  return data
}

export async function getUserCourseAccess(userId: string, courseId: string) {
  const { data } = await supabaseAdmin
    .from('course_access')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function getMeditations(visibility?: string) {
  let query = supabaseAdmin.from('meditations').select('*').order('"order"', { ascending: true })
  if (visibility) query = query.eq('visibility', visibility)
  const { data } = await query
  return data ?? []
}

export async function getPublications(visibility?: string) {
  let query = supabaseAdmin
    .from('publications')
    .select('*')
    .order('published_at', { ascending: false })
  if (visibility) query = query.eq('visibility', visibility)
  const { data } = await query
  return data ?? []
}

export async function getPublication(slug: string) {
  const { data } = await supabaseAdmin.from('publications').select('*').eq('slug', slug).single()
  return data
}
