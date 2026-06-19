import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-4">
        <Link href="/student" className="font-medium text-gray-500 hover:text-gray-800">Mi Área</Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm text-gray-400">{session.user.email}</span>
      </div>
      {children}
    </div>
  )
}
