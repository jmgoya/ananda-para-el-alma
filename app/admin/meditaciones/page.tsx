'use client'

import { useState, useEffect } from 'react'

interface Meditation {
  id: string
  title: string
  description: string
  duration_minutes: number
  video_url: string
  type: string
  visibility: string
  order: number
}

const defaultForm = {
  title: '',
  description: '',
  duration_minutes: '',
  video_url: '',
  type: 'free',
  visibility: 'public',
  order: '',
}

export default function AdminMeditacionesPage() {
  const [items, setItems] = useState<Meditation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/meditaciones')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  function startEdit(item: Meditation) {
    setEditId(item.id)
    setForm({
      title: item.title,
      description: item.description ?? '',
      duration_minutes: String(item.duration_minutes ?? ''),
      video_url: item.video_url ?? '',
      type: item.type,
      visibility: item.visibility,
      order: String(item.order ?? ''),
    })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null, order: form.order ? Number(form.order) : null }

    if (editId) {
      await fetch(`/api/meditaciones/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/meditaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(defaultForm)
    load()
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar esta meditación?')) return
    await fetch(`/api/meditaciones/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meditaciones</h1>
          <p className="text-gray-500 mt-1">Gestión de meditaciones guiadas</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }} className="btn-primary">+ Nueva meditación</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">{editId ? 'Editar meditación' : 'Nueva meditación'}</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                <input type="number" min="1" className="input-field" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="free">Gratuita</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
                <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="public">Pública</option>
                  <option value="registered">Registrados</option>
                  <option value="course_restricted">Solo curso</option>
                  <option value="code_restricted">Bonus libro (código)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de YouTube</label>
              <input className="input-field" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input type="number" min="1" className="input-field w-24" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="p-12 text-center text-gray-400"><p className="text-4xl mb-3">🧘</p><p>No hay meditaciones todavía</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Meditación</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Visibilidad</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{item.title}</p>
                      {item.duration_minutes && <p className="text-xs text-gray-400">{item.duration_minutes} min</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${item.type === 'free' ? 'badge-green' : 'badge-purple'}`}>
                        {item.type === 'free' ? 'Gratis' : 'Premium'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{item.visibility}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => startEdit(item)} className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Editar</button>
                        <button onClick={() => deleteItem(item.id)} className="text-sm text-red-500 hover:text-red-700">Eliminar</button>
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
