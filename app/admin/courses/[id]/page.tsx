'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
import AudioUpload from '@/components/AudioUpload'
import DocumentUpload from '@/components/DocumentUpload'

interface Material {
  id: string
  title: string
  type: string
  video_url?: string
  document_url?: string
  spotify_url?: string
  audio_url?: string
  order?: number
}

interface Module {
  id: string
  title: string
  order?: number
  materials?: Material[]
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  currency: string
  cover_url?: string
  status: string
  modules?: Module[]
}

interface NewMaterialForm {
  title: string
  type: string
  video_url: string
  document_url: string
  spotify_url: string
  audio_url: string
}

const emptyMaterial: NewMaterialForm = { title: '', type: 'video', video_url: '', document_url: '', spotify_url: '', audio_url: '' }

const materialTypeIcon: Record<string, string> = {
  video: '📹',
  document: '📄',
  spotify: '🎵',
  audio: '🎧',
}

export default function AdminCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [form, setForm] = useState({ title: '', description: '', price: '', cover_url: '', status: 'draft' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [newModule, setNewModule] = useState('')
  const [newMaterial, setNewMaterial] = useState<Record<string, NewMaterialForm>>({})

  useEffect(() => {
    fetch(`/api/courses/${id}`).then((r) => r.json()).then((data) => {
      setCourse(data)
      setForm({ title: data.title, description: data.description ?? '', price: String(data.price), cover_url: data.cover_url ?? '', status: data.status })
    })
  }, [id])

  function getMat(moduleId: string): NewMaterialForm {
    return newMaterial[moduleId] ?? emptyMaterial
  }

  function updateMat(moduleId: string, update: Partial<NewMaterialForm>) {
    setNewMaterial(prev => ({ ...prev, [moduleId]: { ...getMat(moduleId), ...update } }))
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    })
    setSaving(false)
    setMessage(res.ok ? '✓ Guardado' : '✗ Error')
    setTimeout(() => setMessage(''), 3000)
  }

  async function addModule() {
    if (!newModule.trim()) return
    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: id, title: newModule, order: (course?.modules?.length ?? 0) + 1 }),
    })
    if (res.ok) {
      setNewModule('')
      const updated = await fetch(`/api/courses/${id}`).then((r) => r.json())
      setCourse(updated)
    }
  }

  async function addMaterial(moduleId: string) {
    const mat = getMat(moduleId)
    if (!mat.title) return
    const module = course?.modules?.find((m) => m.id === moduleId)

    // Only send relevant URL field for the type
    const payload: Record<string, unknown> = {
      module_id: moduleId,
      title: mat.title,
      type: mat.type,
      order: (module?.materials?.length ?? 0) + 1,
    }
    if (mat.type === 'video') payload.video_url = mat.video_url
    if (mat.type === 'document') payload.document_url = mat.document_url
    if (mat.type === 'spotify') payload.spotify_url = mat.spotify_url
    if (mat.type === 'audio') payload.audio_url = mat.audio_url

    await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    updateMat(moduleId, emptyMaterial)
    const updated = await fetch(`/api/courses/${id}`).then((r) => r.json())
    setCourse(updated)
  }

  async function deleteModule(moduleId: string) {
    if (!confirm('¿Eliminar módulo?')) return
    await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' })
    const updated = await fetch(`/api/courses/${id}`).then((r) => r.json())
    setCourse(updated)
  }

  async function deleteMaterial(matId: string) {
    if (!confirm('¿Eliminar material?')) return
    await fetch(`/api/materials/${matId}`, { method: 'DELETE' })
    const updated = await fetch(`/api/courses/${id}`).then((r) => r.json())
    setCourse(updated)
  }

  if (!course) return <div className="text-gray-400 text-center py-12">Cargando...</div>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
        <h1 className="text-2xl font-bold text-gray-800">Editar curso</h1>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Course form */}
      <form onSubmit={saveCourse} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Datos del curso</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (ARS)</label>
            <input type="number" min="0" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>
        <ImageUpload
          label="Portada del curso"
          value={form.cover_url}
          onChange={(url) => setForm({ ...form, cover_url: url })}
        />
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Modules */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Módulos</h2>

        {(course.modules ?? [])
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((mod) => {
            const mat = getMat(mod.id)
            return (
              <div key={mod.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <span className="font-medium text-gray-700">📚 {mod.title}</span>
                  <button onClick={() => deleteModule(mod.id)} className="text-sm text-red-500 hover:text-red-700">Eliminar módulo</button>
                </div>

                {/* Materials */}
                <div className="p-4 space-y-2">
                  {(mod.materials ?? [])
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">{materialTypeIcon[m.type] ?? '📄'} {m.title}</span>
                      <button onClick={() => deleteMaterial(m.id)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                    </div>
                  ))}

                  {/* Add material form */}
                  <div className="pt-2 space-y-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Agregar material</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input-field text-sm"
                        placeholder="Título del material"
                        value={mat.title}
                        onChange={(e) => updateMat(mod.id, { title: e.target.value })}
                      />
                      <select
                        className="input-field text-sm"
                        value={mat.type}
                        onChange={(e) => updateMat(mod.id, { type: e.target.value })}
                      >
                        <option value="video">📹 Video (YouTube)</option>
                        <option value="document">📄 Documento</option>
                        <option value="spotify">🎵 Spotify</option>
                        <option value="audio">🎧 Audio MP3</option>
                      </select>
                    </div>

                    {mat.type === 'video' && (
                      <input
                        className="input-field text-sm"
                        placeholder="URL de YouTube"
                        value={mat.video_url}
                        onChange={(e) => updateMat(mod.id, { video_url: e.target.value })}
                      />
                    )}
                    {mat.type === 'document' && (
                      <DocumentUpload
                        value={mat.document_url}
                        onChange={(url) => updateMat(mod.id, { document_url: url })}
                      />
                    )}
                    {mat.type === 'spotify' && (
                      <input
                        className="input-field text-sm"
                        placeholder="https://open.spotify.com/track/..."
                        value={mat.spotify_url}
                        onChange={(e) => updateMat(mod.id, { spotify_url: e.target.value })}
                      />
                    )}
                    {mat.type === 'audio' && (
                      <AudioUpload
                        value={mat.audio_url}
                        onChange={(url) => updateMat(mod.id, { audio_url: url })}
                      />
                    )}

                    <button onClick={() => addMaterial(mod.id)} className="text-sm btn-primary py-1.5 px-3">Agregar material</button>
                  </div>
                </div>
              </div>
            )
          })}

        {/* Add module */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <input
            className="input-field flex-1"
            placeholder="Nombre del nuevo módulo"
            value={newModule}
            onChange={(e) => setNewModule(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addModule() } }}
          />
          <button onClick={addModule} className="btn-primary whitespace-nowrap">+ Módulo</button>
        </div>
      </div>
    </div>
  )
}
