import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [
    { count: courseCount },
    { count: meditationCount },
    { count: publicationCount },
    { count: userCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('meditations').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('publications').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('course_access').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('payment_method', 'manual'),
  ])

  const stats = [
    { label: 'Cursos', value: courseCount ?? 0, href: '/admin/courses', icon: '📚', color: '#7c3aed' },
    { label: 'Meditaciones', value: meditationCount ?? 0, href: '/admin/meditaciones', icon: '🧘', color: '#059669' },
    { label: 'Publicaciones', value: publicationCount ?? 0, href: '/admin/publicaciones', icon: '📝', color: '#d97706' },
    { label: 'Usuarios', value: userCount ?? 0, href: '/admin/users', icon: '👥', color: '#3b82f6' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Panel de administración de Ananda para el Alma</p>
      </div>

      {/* Alert for pending */}
      {(pendingCount ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium text-amber-800">
                {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} de pago manual pendiente{pendingCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-amber-600">Revisá y aprobá o rechazá los accesos</p>
            </div>
          </div>
          <Link href="/admin/users" className="btn-primary text-sm py-2">Revisar</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Acciones rápidas</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/admin/courses" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-2xl mb-1">📚</p>
            <p className="text-sm font-medium text-gray-600">Nuevo curso</p>
          </Link>
          <Link href="/admin/meditaciones" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-2xl mb-1">🧘</p>
            <p className="text-sm font-medium text-gray-600">Nueva meditación</p>
          </Link>
          <Link href="/admin/publicaciones" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-2xl mb-1">📝</p>
            <p className="text-sm font-medium text-gray-600">Nueva publicación</p>
          </Link>
          <Link href="/admin/settings" className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <p className="text-2xl mb-1">⚙️</p>
            <p className="text-sm font-medium text-gray-600">Configuración</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
