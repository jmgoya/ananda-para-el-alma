import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPublication } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export default async function PublicacionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  const pub = await getPublication(slug).catch(() => null)

  if (!pub) notFound()

  // Access control
  const canAccess =
    pub.visibility === 'public' ||
    (pub.visibility === 'registered' && session?.user) ||
    session?.user?.role === 'admin'

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800">Contenido para miembros</h1>
          <p className="text-gray-500">Esta publicación requiere una cuenta registrada.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary">Crear cuenta</Link>
            <Link href="/auth/login" className="btn-outline">Ingresar</Link>
          </div>
        </div>
      </div>
    )
  }

  // Increment views
  supabaseAdmin.from('publications').update({ views: (pub.views ?? 0) + 1 }).eq('id', pub.id).then(() => {})

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/publicaciones" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6">
        ← Volver a publicaciones
      </Link>

      <article className="space-y-6">
        {pub.category && (
          <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
            {pub.category}
          </p>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{pub.title}</h1>

        <p className="text-sm text-gray-400">
          {new Date(pub.published_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {pub.image_url && (
          <div className="rounded-2xl overflow-hidden shadow-md">
            <Image src={pub.image_url} alt={pub.title} width={800} height={400} className="object-cover w-full" />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: pub.content }}
        />
      </article>
    </div>
  )
}
