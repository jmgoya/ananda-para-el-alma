import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCourse, getUserCourseAccess } from '@/lib/db'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { notFound } from 'next/navigation'
import CourseAccessButton from '@/components/CourseAccessButton'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [session, course] = await Promise.all([
    getServerSession(authOptions),
    getCourse(id).catch(() => null),
  ])

  if (!course || course.status !== 'published') notFound()

  let access = null
  if (session?.user) {
    access = await getUserCourseAccess(session.user.id, id).catch(() => null)
  }

  const isApproved = access?.status === 'approved'
  const isPending = access?.status === 'pending'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Cover */}
      {course.cover_url ? (
        <div className="rounded-2xl overflow-hidden mb-8 h-72">
          <Image src={course.cover_url} alt={course.title} width={800} height={288} className="object-cover w-full h-full" />
        </div>
      ) : (
        <div className="rounded-2xl h-72 flex items-center justify-center mb-8" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <span className="text-white text-7xl">✨</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">{course.title}</h1>
          <p className="text-gray-600 leading-relaxed">{course.description}</p>

          {/* Modules preview */}
          {course.modules?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contenido del curso</h2>
              <div className="space-y-3">
                {course.modules
                  .sort((a: { order: number }, b: { order: number }) => (a.order ?? 0) - (b.order ?? 0))
                  .map((module: { id: string; title: string; materials?: { id: string }[] }) => (
                  <div key={module.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📚</span>
                      <h3 className="font-medium text-gray-700">{module.title}</h3>
                      {!isApproved && (
                        <span className="ml-auto text-gray-300 text-sm">🔒</span>
                      )}
                    </div>
                    {isApproved && (module.materials?.length ?? 0) > 0 && (
                      <p className="text-sm text-gray-400 mt-1 ml-6">{module.materials?.length} material(es)</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
            <p className="text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(Number(course.price), course.currency)}
            </p>

            <CourseAccessButton
              courseId={id}
              price={Number(course.price)}
              isLoggedIn={!!session}
              isApproved={isApproved}
              isPending={isPending}
            />

            <ul className="mt-6 space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2"><span>📱</span> Acceso desde cualquier dispositivo</li>
              <li className="flex items-center gap-2"><span>♾️</span> Acceso ilimitado</li>
              <li className="flex items-center gap-2"><span>💬</span> Dos opciones de pago</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
