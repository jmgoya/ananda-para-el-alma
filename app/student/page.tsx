import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  const { data: accesses } = await supabaseAdmin
    .from('course_access')
    .select('*, courses(*)')
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false })

  const approved = (accesses ?? []).filter((a) => a.status === 'approved')
  const pending = (accesses ?? []).filter((a) => a.status === 'pending')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hola, {session?.user?.name ?? session?.user?.email} 👋</h1>
        <p className="text-gray-500 mt-1">Bienvenida a tu espacio de aprendizaje</p>
      </div>

      {/* Approved Courses */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Mis cursos</h2>
        {approved.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
            <p className="text-4xl mb-3">📚</p>
            <p>Todavía no tenés cursos. <Link href="/courses" className="underline" style={{ color: 'var(--color-primary)' }}>Ver catálogo</Link></p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approved.map((access) => {
              const course = access.courses
              return (
                <Link key={access.id} href={`/student/courses/${course.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  {course.cover_url ? (
                    <div className="h-36 overflow-hidden">
                      <Image src={course.cover_url} alt={course.title} width={400} height={144} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="h-36 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                      <span className="text-white text-3xl">✨</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800">{course.title}</h3>
                    <p className="text-sm text-green-600 mt-1">✓ Acceso activo</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Pending */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Solicitudes pendientes</h2>
          <div className="space-y-3">
            {pending.map((access) => (
              <div key={access.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">{access.courses?.title}</p>
                  <p className="text-sm text-amber-700">
                    {access.payment_method === 'manual' ? 'Pago manual — esperando confirmación' : 'Pago online — procesando'}
                  </p>
                </div>
                <span className="badge badge-yellow">En revisión</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="pt-4">
        <Link href="/courses" className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
          Ver más cursos →
        </Link>
      </div>
    </div>
  )
}
