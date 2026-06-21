import Link from 'next/link'
import Image from 'next/image'
import { getCourses } from '@/lib/db'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const courses = await getCourses(true).catch(() => [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Cursos</h1>
        <p className="text-gray-500 mt-2">Aprendé a tu ritmo con nuestros cursos de espiritualidad</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">✨</p>
          <p className="text-lg">Próximamente nuevos cursos</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {course.cover_url ? (
                <div className="h-52 overflow-hidden">
                  <Image src={course.cover_url} alt={course.title} width={500} height={208} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                  <span className="text-white text-5xl">✨</span>
                </div>
              )}
              <div className="p-5">
                <h2 className="font-semibold text-gray-800 text-lg mb-2">{course.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                    {formatPrice(Number(course.price), course.currency)}
                  </span>
                  <span className="text-sm text-gray-400">Ver curso →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
