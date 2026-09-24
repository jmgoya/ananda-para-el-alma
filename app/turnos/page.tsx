'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatTime, googleCalendarLink } from '@/lib/utils'

interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
}

function groupByDate(slots: Slot[]) {
  const groups: Record<string, Slot[]> = {}
  for (const slot of slots) {
    if (!groups[slot.date]) groups[slot.date] = []
    groups[slot.date].push(slot)
  }
  return Object.entries(groups)
}

export default function TurnosPage() {
  const { data: session } = useSession()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Slot | null>(null)
  const [form, setForm] = useState({ client_name: '', client_email: '', client_phone: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState<Slot | null>(null)

  useEffect(() => {
    fetch('/api/appointments')
      .then((res) => res.json())
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [])

  // Mientras el usuario no edite el campo, se usa el nombre/email de su sesión como valor por defecto
  const clientName = form.client_name || session?.user?.name || ''
  const clientEmail = form.client_email || session?.user?.email || ''

  function selectSlot(slot: Slot) {
    setSelected(slot)
    setError('')
  }

  async function book(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    setError('')

    const res = await fetch(`/api/appointments/${selected.id}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, client_name: clientName, client_email: clientEmail }),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al reservar el turno')
      setSlots((prev) => prev.filter((s) => s.id !== selected.id))
      setSelected(null)
      return
    }

    setConfirmed(selected)
    setSelected(null)
    setSlots((prev) => prev.filter((s) => s.id !== selected.id))
  }

  if (confirmed) {
    const dateLabel = new Date(`${confirmed.date}T00:00:00`).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const calendarUrl = googleCalendarLink({
      title: 'Turno - Ananda para el Alma',
      description: 'Turno de atención con Ananda para el Alma.',
      date: confirmed.date,
      startTime: confirmed.start_time,
      endTime: confirmed.end_time,
    })

    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Turno confirmado!</h1>
        <p className="text-gray-500 mb-1 capitalize">{dateLabel}</p>
        <p className="text-gray-500 mb-6">{formatTime(confirmed.start_time)} a {formatTime(confirmed.end_time)} hs</p>
        <p className="text-sm text-gray-400 mb-6">Te enviamos un email con los detalles.</p>
        <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">
          Agendar en Google Calendar
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Turnos</h1>
        <p className="text-gray-500 mt-2">Elegí un horario disponible para tu sesión</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      ) : slots.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-lg">No hay turnos disponibles por el momento</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByDate(slots).map(([date, daySlots]) => (
            <div key={date} className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 capitalize mb-3">
                {new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => selectSlot(slot)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                    style={
                      selected?.id === slot.id
                        ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                        : { borderColor: '#e5e7eb', color: '#374151' }
                    }
                  >
                    {formatTime(slot.start_time)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="font-semibold text-gray-700 mb-1">Confirmar turno</h2>
          <p className="text-sm text-gray-500 mb-4 capitalize">
            {new Date(`${selected.date}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}{formatTime(selected.start_time)} a {formatTime(selected.end_time)} hs
          </p>
          <form onSubmit={book} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                required
                className="input-field"
                value={clientName}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required
                  type="email"
                  className="input-field"
                  value={clientEmail}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                <input
                  required
                  type="tel"
                  placeholder="+54 9 11 ..."
                  className="input-field"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Reservando...' : 'Confirmar turno'}
              </button>
              <button type="button" onClick={() => setSelected(null)} className="btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
