import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMeditations } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function MeditacionesPage() {
  const session = await getServerSession(authOptions)
  const meditations = await getMeditations().catch(() => [])

  // Obtener el set de meditation_ids que el usuario desbloqueó via código
  const unlockedByCode = new Set<string>()
  if (session?.user) {
    const { data: uses } = await supabaseAdmin
      .from('redemption_code_uses')
      .select('code_id')
      .eq('user_id', session.user.id)

    if (uses && uses.length > 0) {
      const codeIds = uses.map((u: any) => u.code_id)
      const { data: links } = await supabaseAdmin
        .from('redemption_code_meditations')
        .select('meditation_id')
        .in('code_id', codeIds)
      for (const link of links ?? []) unlockedByCode.add((link as any).meditation_id)
    }
  }

  const visible = meditations.filter((m) => {
    if (m.visibility === 'public') return true
    if (m.visibility === 'registered' && session?.user) return true
    if (m.visibility === 'code_restricted') return true
    return false
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meditaciones</h1>
        <p className="text-gray-500 mt-2">Encontrá tu paz interior con nuestras meditaciones guiadas</p>
      </div>

      {/* Banner para código de libro */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-amber-800 text-sm">
          📖 <span className="font-medium">¿Tenés el libro de Natalia?</span> Canjeá tu código para acceder a las meditaciones bonus exclusivas.
        </p>
        <Link href="/canjear" className="text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
          Canjear código →
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🧘</p>
          <p className="text-lg">Próximamente nuevas meditaciones</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((m) => {
            const isCodeRestricted = m.visibility === 'code_restricted'
            const hasCodeAccess = isCodeRestricted && unlockedByCode.has(m.id)

            return (
              <Link
                key={m.id}
                href={`/meditaciones/${m.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">🧘</span>
                  {isCodeRestricted ? (
                    <span className={`badge ${hasCodeAccess ? 'badge-green' : 'badge-blue'}`}>
                      {hasCodeAccess ? 'Desbloqueado' : 'Bonus libro'}
                    </span>
                  ) : (
                    <span className={`badge ${m.type === 'free' ? 'badge-green' : 'badge-purple'}`}>
                      {m.type === 'free' ? 'Gratis' : 'Premium'}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-gray-800 text-lg">{m.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-3 flex-1">{m.description}</p>
                {m.duration_minutes && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <span>⏱</span>
                    <span>{m.duration_minutes} minutos</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {!session && (
        <div className="mt-12 bg-purple-50 rounded-2xl p-8 text-center">
          <p className="text-gray-600 mb-4">Registrate para acceder a más meditaciones</p>
          <Link href="/auth/register" className="btn-primary">Crear cuenta gratis</Link>
        </div>
      )}
    </div>
  )
}
