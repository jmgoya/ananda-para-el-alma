'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Meditation {
  id: string
  title: string
  description: string
  duration_minutes: number | null
}

export default function RedeemForm() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unlockedMeditations, setUnlockedMeditations] = useState<Meditation[] | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUnlockedMeditations(null)

    const res = await fetch('/api/redemption-codes/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Ocurrió un error, intentá de nuevo')
      return
    }

    setUnlockedMeditations(data.meditations ?? [])
    setCode('')
  }

  if (unlockedMeditations !== null) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <p className="text-green-800 font-semibold text-lg mb-1">¡Código canjeado con éxito!</p>
          <p className="text-green-700 text-sm">Ya tenés acceso a las siguientes meditaciones:</p>
        </div>

        {unlockedMeditations.length > 0 ? (
          <div className="space-y-3">
            {unlockedMeditations.map((m) => (
              <Link
                key={m.id}
                href={`/meditaciones/${m.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div>
                  <p className="font-medium text-gray-800">{m.title}</p>
                  {m.duration_minutes && (
                    <p className="text-xs text-gray-400 mt-0.5">⏱ {m.duration_minutes} minutos</p>
                  )}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Ver →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Este código no tiene meditaciones vinculadas todavía.</p>
        )}

        <button
          onClick={() => setUnlockedMeditations(null)}
          className="text-sm text-gray-400 hover:text-gray-600 mt-2"
        >
          Canjear otro código
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Código del libro</label>
        <input
          type="text"
          required
          className="input-field text-lg tracking-widest uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          autoComplete="off"
          autoFocus
        />
        <p className="text-xs text-gray-400 mt-1">Encontrá el código impreso en tu libro. No distingue mayúsculas/minúsculas.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full btn-primary justify-center py-3 disabled:opacity-60"
      >
        {loading ? 'Verificando...' : 'Canjear código'}
      </button>
    </form>
  )
}
