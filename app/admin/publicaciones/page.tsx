'use client'

import { useState, useEffect } from 'react'

interface Publication {
  id: string
  title: string
  content: string
  image_url?: string
  excerpt?: string
  visibility: string
  category?: string
  slug: string
  published_at: string
  views: number
}

const defaultForm = {
  title: '',
  content: '',
  image_url: '',
  excerpt: '',
  visibility: 'public',
  category: '',
  slug: '',
}

export default function AdminPublicacionesPage() {
  const [items, setItems] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/publications?visibility=all')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  function startEdit(item: Publication) {
    setEditId(item.id)
    setForm({
      title: item.title,
      content: item.content,
      image_url: item.image_url ?? '',
      excerpt: item.excerpt ?? '',
      visibility: item.visibility,
      category: item.category ?? '',
      slug: item.slug,
    })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editId) {
      await fetch(`/api/publications/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/publications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(defaultForm)
    load()
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar esta publicación?')) return
    await fetch(`/api/publications/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Publicaciones</h1>
          <p className="text-gray-500 mt-1">Gestión de publicaciones</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }} className="btn-primary">+ Nueva publicación</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">{editId ? 'Editar publicación' : 'Nueva publicación'}</h2>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extracto</label>
              <input className="input-field" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Breve descripción para el listado" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
              <textarea
                required
                className="input-field resize-none"
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Contenido de la publicación (HTML permitido)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Tarot, Chamanismo..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
                <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="public">Pública</option>
                  <option value="registered">Solo registrados</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL imagen</label>
                <input className="input-field" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                <input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mi-publicacion (auto si vacío)" />
              </div>
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
            <div className="p-12 text-center text-gray-400"><p className="text-4xl mb-3">📝</p><p>No hay publicaciones todavía</p></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Publicación</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Visibilidad</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Vistas</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{item.title}</p>
                      {item.category && <p className="text-xs text-gray-400">{item.category}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${item.visibility === 'public' ? 'badge-green' : 'badge-yellow'}`}>
                        {item.visibility === 'public' ? 'Pública' : 'Registrados'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{item.views}</td>
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
