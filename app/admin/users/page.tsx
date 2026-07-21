'use client'

import { useState, useEffect, useMemo } from 'react'

interface CourseAccess {
  id: string
  status: string
  payment_method: string
  payment_note?: string
  admin_note?: string
  created_at: string
  approved_at?: string
  courses?: { title: string; price: number }
  users?: { email: string; name?: string }
  manual_payment_methods?: { name: string }
  user_id: string
  course_id: string
}

interface User {
  id: string
  email: string
  name?: string
  role: string
  created_at: string
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'denied'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  denied: 'Rechazado',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-yellow',
  approved: 'badge-green',
  denied: 'badge-red',
}

function methodLabel(access: CourseAccess) {
  if (access.payment_method === 'online') return 'MercadoPago'
  if (access.payment_method === 'free') return 'Gratis'
  return access.manual_payment_methods?.name ?? 'Manual'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [accesses, setAccesses] = useState<CourseAccess[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [usersRes, accessRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/course-access'),
    ])

    if (usersRes.ok) setUsers(await usersRes.json())
    if (accessRes.ok) setAccesses(await accessRes.json())

    setLoading(false)
  }

  async function setStatus(id: string, status: 'approved' | 'denied') {
    setProcessing(id)
    await fetch(`/api/course-access/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setProcessing(null)
    load()
  }

  async function deleteAccess(id: string) {
    setProcessing(id)
    await fetch(`/api/course-access/${id}`, { method: 'DELETE' })
    setProcessing(null)
    load()
  }

  const counts = useMemo(() => ({
    all: accesses.length,
    pending: accesses.filter((a) => a.status === 'pending').length,
    approved: accesses.filter((a) => a.status === 'approved').length,
    denied: accesses.filter((a) => a.status === 'denied').length,
  }), [accesses])

  const filtered = statusFilter === 'all' ? accesses : accesses.filter((a) => a.status === statusFilter)

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobados' },
    { key: 'denied', label: 'Rechazados' },
    { key: 'all', label: 'Todos' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Usuarios y pagos</h1>
        <p className="text-gray-500 mt-1">Gestión de accesos a cursos y usuarios</p>
      </div>

      {/* Course accesses */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className="ml-2 opacity-70">{counts[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-gray-400 p-8 text-center">Cargando...</p>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">✓</p>
              <p>No hay accesos en este estado</p>
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Curso</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((access) => (
                    <tr key={access.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {access.users?.name ?? access.users?.email ?? access.user_id}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{access.courses?.title}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{methodLabel(access)}</td>
                      <td className="px-5 py-4">
                        <span className={`badge ${STATUS_BADGE[access.status] ?? 'badge-blue'}`}>
                          {STATUS_LABEL[access.status] ?? access.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {new Date(access.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {access.status !== 'approved' && (
                            <button
                              onClick={() => setStatus(access.id, 'approved')}
                              disabled={processing === access.id}
                              className="btn-primary py-1 px-3 text-xs disabled:opacity-60"
                            >
                              ✓ Aprobar
                            </button>
                          )}
                          {access.status === 'pending' && (
                            <button
                              onClick={() => deleteAccess(access.id)}
                              disabled={processing === access.id}
                              className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-60"
                            >
                              ✗ Rechazar
                            </button>
                          )}
                          {access.status === 'approved' && (
                            <button
                              onClick={() => setStatus(access.id, 'denied')}
                              disabled={processing === access.id}
                              className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-60"
                            >
                              ⛔ Revocar acceso
                            </button>
                          )}
                          {access.status === 'denied' && (
                            <button
                              onClick={() => deleteAccess(access.id)}
                              disabled={processing === access.id}
                              className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-100 disabled:opacity-60"
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
            </div>
          )}
        </div>
      </section>

      {/* Users list */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Todos los usuarios ({users.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay usuarios registrados</div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{user.name ?? 'Sin nombre'}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${user.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
