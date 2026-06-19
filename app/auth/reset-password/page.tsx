'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-600">El enlace no es válido. Solicitá uno nuevo.</p>
        <Link href="/auth/forgot-password" className="btn-primary">Solicitar enlace</Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: form.newPassword }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Ocurrió un error')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-green-800 font-medium">¡Contraseña actualizada!</p>
          <p className="text-green-700 text-sm mt-1">
            Ya podés iniciar sesión con tu nueva contraseña. Redirigiendo...
          </p>
        </div>
        <Link href="/auth/login" className="btn-primary">Ir al inicio de sesión</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={8}
          autoFocus
          className="input-field"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
        <input
          type="password"
          required
          className="input-field"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          {error.includes('expiró') && (
            <span> <Link href="/auth/forgot-password" className="underline font-medium">Solicitá uno nuevo</Link>.</span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary justify-center py-3 disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Nueva contraseña</h1>
            <p className="text-gray-500 text-sm mt-1">Elegí una contraseña segura de al menos 8 caracteres.</p>
          </div>
          <Suspense fallback={<p className="text-center text-gray-400">Cargando...</p>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="text-center border-t border-gray-100 pt-4">
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
