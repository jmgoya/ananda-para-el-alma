'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CourseAccessButton({
  courseId,
  price,
  isLoggedIn,
  isApproved,
  isPending,
}: {
  courseId: string
  price: number
  isLoggedIn: boolean
  isApproved: boolean
  isPending: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFree = Number(price) === 0

  async function enrollFree() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/course-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al inscribirte')
      router.push(`/student/courses/${courseId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inscribirte')
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/auth/login?callbackUrl=/courses/${courseId}`} className="btn-primary w-full justify-center py-3 text-center block">
        {isFree ? 'Inscribirme gratis' : 'Comprar curso'}
      </Link>
    )
  }

  if (isApproved) {
    return (
      <Link href={`/student/courses/${courseId}`} className="btn-primary w-full justify-center py-3 text-center block">
        Acceder al curso →
      </Link>
    )
  }

  if (isPending) {
    return (
      <div className="text-center">
        <span className="badge badge-yellow text-sm px-4 py-2">Tu solicitud está en revisión</span>
        <p className="text-xs text-gray-400 mt-2">Natalia la revisará pronto y recibirás confirmación</p>
      </div>
    )
  }

  if (isFree) {
    return (
      <div>
        <button onClick={enrollFree} disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
          {loading ? 'Inscribiendo...' : 'Inscribirme gratis'}
        </button>
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </div>
    )
  }

  return (
    <Link href={`/checkout/${courseId}`} className="btn-primary w-full justify-center py-3 text-center block">
      Solicitar / Comprar
    </Link>
  )
}
