'use client'

import { useState, useEffect } from 'react'

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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pendingAccesses, setPendingAccesses] = useState<CourseAccess[]>([])
  const [onlineAccesses, setOnlineAccesses] = useState<CourseAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [usersRes, accessRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/course-access'),
    ])

    if (usersRes.ok) setUsers(await usersRes.json())

    if (accessRes.ok) {
      const accesses: CourseAccess[] = await accessRes.json()
      setPendingAccesses(accesses.filter((a) => a.payment_method === 'manual' && a.status === 'pending'))
      setOnlineAccesses(accesses.filter((a) => a.payment_method === 'online').slice(0, 10))
    }

    setLoading(false)
  }

  async function processAccess(id: string, status: 'approved') {
    setProcessing(id)
    await fetch(`/api/course-access/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_note: adminNotes[id] }),
    })
    setProcessing(null)
    load()
  }

  async function rejectAccess(id: string) {
    setProcessing(id)
    await fetch(`/api/course-access/${id}`, { method: 'DELETE' })
    setProcessing(null)
    load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Usuarios y pagos</h1>
        <p className="text-gray-500 mt-1">Gestión de usuarios y aprobación de pagos manuales</p>
      </div>

      {/* Pending Manual Payments */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Solicitudes pendientes de pago manual
          {pendingAccesses.length > 0 && (
            <span className="ml-2 badge badge-yellow">{pendingAccesses.length}</span>
          )}
        </h2>

        {loading ? (
          <p className="text-gray-400">Cargando...</p>
        ) : pendingAccesses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">✓</p>
            <p>No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAccesses.map((access) => (
              <div key={access.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-400">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {access.users?.name ?? access.users?.email ?? access.user_id}
                    </p>
                    <p className="text-sm text-gray-500">Curso: {access.courses?.title}</p>
                    {access.manual_payment_methods?.name && (
                      <p className="text-sm text-gray-500">
                        Método: <span className="font-medium text-gray-700">{access.manual_payment_methods.name}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-400">
                      Solicitado: {new Date(access.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {access.payment_note && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Nota del usuario:</p>
                        <p className="text-sm text-gray-700">{access.payment_note}</p>
                      </div>
                    )}
                  </div>
                  <span className="badge badge-yellow">Pendiente</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nota del admin (opcional)</label>
                    <input
                      className="input-field"
                      placeholder="Confirmación de pago, instrucciones, etc."
                      value={adminNotes[access.id] ?? ''}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [access.id]: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => processAccess(access.id, 'approved')}
                      disabled={processing === access.id}
                      className="btn-primary py-2 text-sm disabled:opacity-60"
                    >
                      {processing === access.id ? 'Procesando...' : '✓ Aprobar acceso'}
                    </button>
                    <button
                      onClick={() => rejectAccess(access.id)}
                      disabled={processing === access.id}
                      className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-60"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Online Payments */}
      {onlineAccesses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Pagos online recientes</h2>
          <p className="text-sm text-gray-500 mb-3">
            Normalmente se aprueban solos vía el webhook de MercadoPago. Si alguno queda en &quot;Pendiente&quot;
            por mucho tiempo (el webhook no llegó o falló), podés aprobarlo manualmente acá. &quot;Rechazar&quot;
            elimina la solicitud pendiente (para pagos que nunca se completaron).
          </p>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Curso</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {onlineAccesses.map((access) => (
                  <tr key={access.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-700">{access.users?.email ?? access.user_id}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{access.courses?.title}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${access.status === 'approved' ? 'badge-green' : access.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                        {access.status === 'approved' ? 'Aprobado' : access.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      {new Date(access.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-4">
                      {access.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => processAccess(access.id, 'approved')}
                            disabled={processing === access.id}
                            className="btn-primary py-1 px-3 text-xs disabled:opacity-60"
                          >
                            {processing === access.id ? '...' : '✓ Aprobar'}
                          </button>
                          <button
                            onClick={() => rejectAccess(access.id)}
                            disabled={processing === access.id}
                            className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-60"
                          >
                            ✗ Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Users list */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Todos los usuarios ({users.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay usuarios registrados</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
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
          )}
        </div>
      </section>
    </div>
  )
}
