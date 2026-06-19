import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPublications } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'

export default async function PublicacionesPage() {
  const session = await getServerSession(authOptions)
  const all = await getPublications().catch(() => [])

  const visible = all.filter((p) => {
    if (p.visibility === 'public') return true
    if (p.visibility === 'registered' && session?.user) return true
    return false
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Publicaciones</h1>
        <p className="text-gray-500 mt-2">Reflexiones, enseñanzas y mensajes del alma</p>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-lg">Próximamente nuevas publicaciones</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((pub) => (
            <Link key={pub.id} href={`/publicaciones/${pub.slug}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {pub.image_url ? (
                <div className="h-56 overflow-hidden">
                  <Image
                    src={pub.image_url}
                    alt={pub.title}
                    width={500}
                    height={224}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-secondary), var(--color-accent))' }}>
                  <span className="text-white text-4xl">🌿</span>
                </div>
              )}
              <div className="p-5">
                {pub.category && <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{pub.category}</p>}
                <h2 className="font-semibold text-gray-800 text-lg mb-2">{pub.title}</h2>
                {pub.excerpt && <p className="text-sm text-gray-500 line-clamp-3">{pub.excerpt}</p>}
                <p className="text-xs text-gray-300 mt-3">
                  {new Date(pub.published_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!session && (
        <div className="mt-12 bg-purple-50 rounded-2xl p-8 text-center">
          <p className="text-gray-600 mb-4">Registrate para acceder a contenido exclusivo</p>
          <Link href="/auth/register" className="btn-primary">Crear cuenta gratis</Link>
        </div>
      )}
    </div>
  )
}
