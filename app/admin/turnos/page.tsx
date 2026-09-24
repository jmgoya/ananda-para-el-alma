'use client'

import { useState, useEffect } from 'react'
import { formatTime, whatsappLink } from '@/lib/utils'

interface Appointment {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'available' | 'booked' | 'cancelled'
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  notes: string | null
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const defaultGenForm = {
  date: todayISO(),
  start_time: '09:00',
  end_time: '13:00',
  duration_minutes: '60',
}

export default function AdminTurnosPage() {
  const [date, setDate] = useState(todayISO())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerator, setShowGenerator] = useState(false)
  const [genForm, setGenForm] = useState(defaultGenForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [date])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/appointments?all=true&date=${date}`)
    if (res.ok) setAppointments(await res.json())
    setLoading(false)
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...genForm, duration_minutes: Number(genForm.duration_minutes) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? 'Error al generar horarios'); return }
    setShowGenerator(false)
    setDate(genForm.date)
    setGenForm({ ...defaultGenForm, date: genForm.date })
    load()
  }

  async function deleteSlot(id: string) {
    if (!confirm('¿Eliminar este horario?')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    load()
  }

  async function cancelBooking(id: string) {
    if (!confirm('¿Cancelar este turno? Quedará libre nuevamente.')) return
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'available' }),
    })
    load()
  }

  function whatsappUrl(a: Appointment) {
    const dateLabel = new Date(`${a.date}T00:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    const message = `Hola ${a.client_name}! Te escribo de Ananda para el Alma para confirmar tu turno del ${dateLabel} a las ${formatTime(a.start_time)}hs. ¡Te espero! 🙏`
    return whatsappLink(a.client_phone ?? '', message)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Turnos</h1>
          <p className="text-gray-500 mt-1">Agenda de atención</p>
        </div>
        <button onClick={() => setShowGenerator(true)} className="btn-primary">+ Generar horarios</button>
      </div>

      {showGenerator && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Generar horarios libres</h2>
          <form onSubmit={generate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  required
                  type="date"
                  className="input-field"
                  value={genForm.date}
                  onChange={(e) => setGenForm({ ...genForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración de cada turno (min) *</label>
                <input
                  required
                  type="number"
                  min={5}
                  step={5}
                  className="input-field"
                  value={genForm.duration_minutes}
                  onChange={(e) => setGenForm({ ...genForm, duration_minutes: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde *</label>
                <input
                  required
                  type="time"
                  className="input-field"
                  value={genForm.start_time}
                  onChange={(e) => setGenForm({ ...genForm, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta *</label>
                <input
                  required
                  type="time"
                  className="input-field"
                  value={genForm.end_time}
                  onChange={(e) => setGenForm({ ...genForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Se van a crear turnos libres de {genForm.duration_minutes || '?'} minutos entre las {genForm.start_time} y las {genForm.end_time}. Los horarios ya existentes no se duplican.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Generando...' : 'Generar'}
              </button>
              <button type="button" onClick={() => { setShowGenerator(false); setError('') }} className="btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Agenda del día</label>
        <input
          type="date"
          className="input-field w-auto"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={() => setDate(todayISO())} className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
          Hoy
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p>No hay horarios cargados para este día</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Horario</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {formatTime(a.start_time)} - {formatTime(a.end_time)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${a.status === 'booked' ? 'badge-purple' : 'badge-green'}`}>
                        {a.status === 'booked' ? 'Reservado' : 'Libre'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {a.status === 'booked' ? (
                        <div>
                          <p className="font-medium text-gray-800">{a.client_name}</p>
                          <p className="text-xs text-gray-400">{a.client_email} · {a.client_phone}</p>
                          {a.notes && <p className="text-xs text-gray-400 mt-0.5">{a.notes}</p>}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        {a.status === 'booked' ? (
                          <>
                            <a
                              href={whatsappUrl(a)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-green-600 hover:text-green-700"
                            >
                              WhatsApp
                            </a>
                            <button
                              onClick={() => cancelBooking(a.id)}
                              className="text-sm text-gray-400 hover:text-gray-700"
                            >
                              Cancelar turno
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => deleteSlot(a.id)}
                            className="text-sm text-gray-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
