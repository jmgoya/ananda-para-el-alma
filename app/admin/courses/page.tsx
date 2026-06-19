'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'

interface Course {
  id: string
  title: string
  description: string
  price: number
  currency: string
  status: string
  cover_url?: string
  created_at: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', price: '', cover_url: '', status: 'draft' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    setLoading(true)
    const res = await fetch('/api/courses?all=true')
    if (res.ok) setCourses(await res.json())
    setLoading(false)
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setShowForm(false)
    setForm({ title: '', description: '', price: '', cover_url: '', status: 'draft' })
    loadCourses()
  }

  async function deleteCourse(id: string) {
    if (!confirm('¿Eliminar este curso?')) return
    await fetch(`/api/courses/${id}`, { method: 'DELETE' })
    loadCourses()
  }

  async function toggleStatus(course: Course) {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/courses/${course.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    loadCourses()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>
          <p className="text-gray-500 mt-1">Gestión de cursos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Nuevo curso</button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Crear nuevo curso</h2>
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
          <form onSubmit={createCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre del curso" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del curso..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio (ARS) *</label>
                <input required type="number" min="0" step="0.01" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5000" />
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
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? 'Guardando...' : 'Crear curso'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p>No hay cursos todavía</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Curso</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">{course.title}</p>
                    <p className="text-sm text-gray-400 line-clamp-1">{course.description}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{formatPrice(Number(course.price), course.currency)}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleStatus(course)} className={`badge ${course.status === 'published' ? 'badge-green' : 'badge-yellow'} cursor-pointer hover:opacity-80`}>
                      {course.status === 'published' ? 'Publicado' : 'Borrador'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/courses/${course.id}`} className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                        Editar
                      </Link>
                      <button onClick={() => deleteCourse(course.id)} className="text-sm text-red-500 hover:text-red-700">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
