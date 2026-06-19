'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Recuperar contraseña</h1>
            <p className="text-gray-500 text-sm mt-1">
              Ingresá tu email y te enviamos instrucciones para restablecer tu contraseña.
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-green-800 font-medium">¡Listo!</p>
                <p className="text-green-700 text-sm mt-1">
                  Si el email existe en nuestra base de datos, te enviamos las instrucciones para recuperar tu contraseña.
                </p>
              </div>
              <p className="text-center text-sm text-gray-500">
                ¿Revisaste tu casilla de spam?
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary justify-center py-3 disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>
            </form>
          )}

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
