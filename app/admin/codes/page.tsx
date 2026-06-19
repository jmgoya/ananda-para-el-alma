'use client'

import { useState, useEffect } from 'react'

interface RedemptionCode {
  id: string
  code: string
  description: string
  active: boolean
  meditation_count: number
  use_count: number
}

interface Meditation {
  id: string
  title: string
  visibility: string
}

const defaultForm = {
  code: '',
  description: '',
  meditation_ids: [] as string[],
  active: true,
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<RedemptionCode[]>([])
  const [meditations, setMeditations] = useState<Meditation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [codesRes, medsRes] = await Promise.all([
      fetch('/api/redemption-codes'),
      fetch('/api/meditaciones'),
    ])
    if (codesRes.ok) setCodes(await codesRes.json())
    if (medsRes.ok) setMeditations(await medsRes.json())
    setLoading(false)
  }

  async function startEdit(code: RedemptionCode) {
    const res = await fetch(`/api/redemption-codes/${code.id}`)
    if (!res.ok) return
    const data = await res.json()
    setEditId(code.id)
    setForm({
      code: data.code,
      description: data.description ?? '',
      meditation_ids: data.redemption_code_meditations?.map((r: any) => r.meditation_id) ?? [],
      active: data.active,
    })
    setShowForm(true)
    setError('')
  }

  function toggleMeditation(id: string) {
    setForm((f) => ({
      ...f,
      meditation_ids: f.meditation_ids.includes(id)
        ? f.meditation_ids.filter((m) => m !== id)
        : [...f.meditation_ids, id],
    }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (editId) {
      const res = await fetch(`/api/redemption-codes/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          active: form.active,
          meditation_ids: form.meditation_ids,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar')
        setSaving(false)
        return
      }
    } else {
      const res = await fetch('/api/redemption-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al crear')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(defaultForm)
    load()
  }

  async function toggleActive(code: RedemptionCode) {
    await fetch(`/api/redemption-codes/${code.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !code.active }),
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Códigos de canje</h1>
          <p className="text-gray-500 mt-1">Gestión de códigos para el libro físico</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); setError('') }}
          className="btn-primary"
        >
          + Nuevo código
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">{editId ? 'Editar código' : 'Nuevo código'}</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                required
                disabled={!!editId}
                className="input-field font-mono tracking-widest uppercase disabled:bg-gray-50 disabled:text-gray-400"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="LIBROANANDA2026"
              />
              {!editId && <p className="text-xs text-gray-400 mt-1">Exactamente como irá impreso en el libro. Se guarda en mayúsculas.</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (uso interno)</label>
              <input
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="ej: Libro físico edición 2026"
              />
            </div>

            {editId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Código activo</label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meditaciones que desbloquea ({form.meditation_ids.length} seleccionadas)
              </label>
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-gray-50">
                {meditations.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No hay meditaciones disponibles</p>
                ) : (
                  meditations.map((m) => (
                    <label key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.meditation_ids.includes(m.id)}
                        onChange={() => toggleMeditation(m.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-700 flex-1">{m.title}</span>
                      <span className="text-xs text-gray-400">{m.visibility}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }} className="btn-outline">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {codes.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🎫</p>
              <p>No hay códigos creados todavía</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Meditaciones</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Canjes</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {codes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-mono font-semibold text-gray-800">{c.code}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{c.meditation_count}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{c.use_count}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${c.active ? 'badge-green' : 'badge-red'}`}>
                        {c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-sm font-medium"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActive(c)}
                          className="text-sm text-gray-400 hover:text-gray-700"
                        >
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
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
