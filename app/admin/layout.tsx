import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/courses', label: 'Cursos', icon: '📚' },
  { href: '/admin/meditaciones', label: 'Meditaciones', icon: '🧘' },
  { href: '/admin/publicaciones', label: 'Publicaciones', icon: '📝' },
  { href: '/admin/users', label: 'Usuarios', icon: '👥' },
  { href: '/admin/codes', label: 'Códigos canje', icon: '🎫' },
  { href: '/admin/settings', label: 'Configuración', icon: '⚙️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') redirect('/auth/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-screen bg-white shadow-sm border-r border-gray-100 fixed left-0 top-0 pt-16 z-40">
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Panel Admin</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5 truncate">{session.user.email}</p>
          </div>
          <nav className="p-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors mb-0.5"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-4 pt-3">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-600">
                <span>←</span> Ver sitio
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 ml-56 p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
