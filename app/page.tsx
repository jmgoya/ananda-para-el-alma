import Image from 'next/image'
import Link from 'next/link'
import { getSiteConfig, getCourses, getMeditations, getPublications } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

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
        className="relative py-16 md:py-24 px-4 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">

            {/* Text */}
            <div className="flex-1 text-center md:text-left space-y-5">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {siteConfig?.site_name ?? 'Ananda para el Alma'}
              </h1>
              <p className="text-xl md:text-2xl opacity-90">
                {siteConfig?.tagline ?? 'Tu espacio de espiritualidad y bienestar'}
              </p>
              <p className="text-base opacity-75">Tarot · Chamanismo · Meditación · Constelaciones Familiares</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <Link
                  href="/courses"
                  className="bg-white font-semibold px-7 py-3 rounded-lg hover:opacity-90 transition-opacity shadow-md"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Ver Cursos
                </Link>
                <Link
                  href="/meditaciones"
                  className="border-2 border-white text-white font-semibold px-7 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Meditaciones Gratis
                </Link>
              </div>
            </div>

            {/* Professor photo */}
            {siteConfig?.professor_photo_url ? (
              <div className="flex-shrink-0 flex justify-center">
                <div className="relative w-56 h-56 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl ring-8 ring-white/10">
                  <Image
                    src={siteConfig.professor_photo_url}
                    alt={siteConfig.site_name ?? 'Natalia Schwaderer'}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 224px, 320px"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 flex justify-center">
                <div className="w-56 h-56 md:w-80 md:h-80 rounded-full bg-white/10 border-4 border-white/30 flex items-center justify-center shadow-2xl">
                  <span className="text-7xl md:text-8xl">🌸</span>
                </div>
              </div>
            )}
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
                    <div className="h-44 overflow-hidden relative">
                      <Image src={course.cover_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
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
                    <div className="h-48 overflow-hidden relative">
                      <Image src={pub.image_url} alt={pub.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
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
