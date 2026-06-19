import Image from 'next/image'
import Link from 'next/link'
import { getSiteConfig, getCourses, getMeditations, getPublications } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

export default async function HomePage() {
  const [siteConfig, courses, meditations, publications] = await Promise.all([
    getSiteConfig().catch(() => null),
    getCourses(true).catch(() => []),
    getMeditations('public').catch(() => []),
    getPublications('public').catch(() => []),
  ])

  const featuredCourses = (courses ?? []).slice(0, 4)
  const featuredMeditations = (meditations ?? []).slice(0, 3)
  const recentPublications = (publications ?? []).slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section
        className="relative py-20 px-4 text-white text-center"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {siteConfig?.professor_photo_url && (
            <div className="flex justify-center">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <Image
                  src={siteConfig.professor_photo_url}
                  alt="Natalia Schwaderer"
                  width={192}
                  height={192}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold">
            {siteConfig?.site_name ?? 'Ananda para el Alma'}
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            {siteConfig?.tagline ?? 'Tu espacio de espiritualidad y bienestar'}
          </p>
          <p className="text-base opacity-80 max-w-2xl mx-auto">Tarot · Chamanismo · Meditación · Constelaciones Familiares</p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/courses" className="bg-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity" style={{ color: 'var(--color-primary)' }}>
              Ver Cursos
            </Link>
            <Link href="/meditaciones" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Meditaciones Gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Cursos</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  {course.cover_url ? (
                    <div className="h-44 overflow-hidden">
                      <Image src={course.cover_url} alt={course.title} width={400} height={176} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                      <span className="text-white text-4xl">✨</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{course.description}</p>
                    <p className="font-bold" style={{ color: 'var(--color-primary)' }}>
                      {formatPrice(Number(course.price), course.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/courses" className="btn-primary">Ver todos los cursos</Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Meditations */}
      {featuredMeditations.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Meditaciones Gratuitas</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {featuredMeditations.map((m) => (
                <Link key={m.id} href={`/meditaciones/${m.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧘</span>
                    <span className="badge badge-green">Gratis</span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{m.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{m.description}</p>
                  {m.duration_minutes && <p className="text-xs text-gray-400">{m.duration_minutes} min</p>}
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/meditaciones" className="btn-outline">Ver todas las meditaciones</Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Publications */}
      {recentPublications.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Últimas Publicaciones</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {recentPublications.map((pub) => (
                <Link key={pub.id} href={`/publicaciones/${pub.slug}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {pub.image_url && (
                    <div className="h-48 overflow-hidden">
                      <Image src={pub.image_url} alt={pub.title} width={400} height={192} className="object-cover w-full h-full" />
                    </div>
                  )}
                  <div className="p-4">
                    {pub.category && <p className="text-xs text-gray-400 mb-1">{pub.category}</p>}
                    <h3 className="font-semibold text-gray-800 mb-2">{pub.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{pub.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/publicaciones" className="btn-outline">Ver todas las publicaciones</Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 text-center" style={{ background: 'var(--color-accent)' }}>
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white">¿Lista para comenzar tu camino?</h2>
          <p className="text-white opacity-90">Registrate gratis y explorá todo el contenido disponible.</p>
          <Link href="/auth/register" className="inline-block bg-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity" style={{ color: 'var(--color-accent)' }}>
            Registrarme ahora
          </Link>
        </div>
      </section>
    </div>
  )
}
