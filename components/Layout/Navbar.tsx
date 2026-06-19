'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar({ siteName, logoUrl }: { siteName?: string; logoUrl?: string }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: 'var(--color-primary)' }}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName ?? 'Logo'}
              width={140}
              height={40}
              className="object-contain h-9 w-auto"
              priority
            />
          ) : (
            siteName ?? 'Ananda para el Alma'
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/courses" className="hover:text-gray-900 transition-colors">Cursos</Link>
          <Link href="/meditaciones" className="hover:text-gray-900 transition-colors">Meditaciones</Link>
          <Link href="/publicaciones" className="hover:text-gray-900 transition-colors">Publicaciones</Link>
          {session?.user?.role === 'admin' && (
            <Link href="/admin" className="hover:text-gray-900 transition-colors" style={{ color: 'var(--color-primary)' }}>
              Admin
            </Link>
          )}
          {session ? (
            <div className="flex items-center gap-3">
              <Link href="/student" className="hover:text-gray-900">Mi Área</Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-500 hover:text-gray-700"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="btn-outline text-sm py-1.5">Ingresar</Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5">Registrarse</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
          <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
          <div className="w-5 h-0.5 bg-gray-600"></div>
        </button>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3 text-sm font-medium border-t border-gray-100 pt-3">
          <Link href="/courses" onClick={() => setOpen(false)}>Cursos</Link>
          <Link href="/meditaciones" onClick={() => setOpen(false)}>Meditaciones</Link>
          <Link href="/publicaciones" onClick={() => setOpen(false)}>Publicaciones</Link>
          {session?.user?.role === 'admin' && (
            <Link href="/admin" onClick={() => setOpen(false)}>Admin</Link>
          )}
          {session ? (
            <>
              <Link href="/student" onClick={() => setOpen(false)}>Mi Área</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left text-gray-500">Salir</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={() => setOpen(false)}>Ingresar</Link>
              <Link href="/auth/register" onClick={() => setOpen(false)}>Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
