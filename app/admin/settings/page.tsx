'use client'

import { useState, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface SiteConfig {
  site_name: string
  tagline: string
  contact_email: string
  color_primary: string
  color_secondary: string
  color_accent: string
  logo_url: string
  professor_photo_url: string
}

interface PaymentConfig {
  online_payments_enabled: boolean
  mercadopago_access_token: string
  mercadopago_public_key: string
}

interface ManualPaymentMethod {
  id: string
  name: string
  instructions: string
  enabled: boolean
  order: number
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<'general' | 'payments'>('general')
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    site_name: '',
    tagline: '',
    contact_email: '',
    color_primary: '#7c3aed',
    color_secondary: '#a78bfa',
    color_accent: '#f59e0b',
    logo_url: '',
    professor_photo_url: '',
  })
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    online_payments_enabled: false,
    mercadopago_access_token: '',
    mercadopago_public_key: '',
  })
  const [manualMethods, setManualMethods] = useState<ManualPaymentMethod[]>([])
  const [savingMethodId, setSavingMethodId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMethodForm, setNewMethodForm] = useState({ name: '', instructions: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [showPublicKey, setShowPublicKey] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/site-config').then((r) => r.json()),
      fetch('/api/payment-config').then((r) => r.json()),
      fetch('/api/manual-payment-methods').then((r) => r.json()),
    ]).then(([site, payment, methods]) => {
      if (site && !site.error) setSiteConfig(site)
      if (payment && !payment.error) setPaymentConfig({
        online_payments_enabled: payment.online_payments_enabled,
        mercadopago_access_token: payment.mercadopago_access_token ?? '',
        mercadopago_public_key: payment.mercadopago_public_key ?? '',
      })
      if (Array.isArray(methods)) setManualMethods(methods)
    })
  }, [])

  function showMsg(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  async function saveSiteConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteConfig),
    })
    setSaving(false)
    showMsg(res.ok ? '✓ Configuración guardada' : '✗ Error al guardar')
  }

  async function savePaymentConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/payment-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentConfig),
    })
    setSaving(false)
    showMsg(res.ok ? '✓ Configuración de pagos guardada' : '✗ Error al guardar')
  }

  function updateMethod(id: string, field: keyof ManualPaymentMethod, value: string | boolean) {
    setManualMethods(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  async function saveMethod(id: string) {
    const method = manualMethods.find(m => m.id === id)
    if (!method) return
    setSavingMethodId(id)
    const res = await fetch(`/api/manual-payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: method.name, instructions: method.instructions, enabled: method.enabled, order: method.order }),
    })
    setSavingMethodId(null)
    if (!res.ok) showMsg('✗ Error al guardar el método')
    else showMsg('✓ Método guardado')
  }

  async function deleteMethod(id: string) {
    if (!confirm('¿Eliminar este método de pago?')) return
    const res = await fetch(`/api/manual-payment-methods/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? 'Error al eliminar')
      return
    }
    setManualMethods(prev => prev.filter(m => m.id !== id))
  }

  async function addMethod(e: React.FormEvent) {
    e.preventDefault()
    if (!newMethodForm.name.trim()) return
    const res = await fetch('/api/manual-payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMethodForm.name,
        instructions: newMethodForm.instructions,
        enabled: true,
        order: manualMethods.length + 1,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setManualMethods(prev => [...prev, data])
      setNewMethodForm({ name: '', instructions: '' })
      setShowAddForm(false)
    } else {
      showMsg('✗ Error al agregar el método')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-gray-500 mt-1">Personalizá tu sitio y configurá los pagos</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('general')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'general' ? 'border-current text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={tab === 'general' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
        >
          General
        </button>
        <button
          onClick={() => setTab('payments')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'payments' ? 'border-current text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={tab === 'payments' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
        >
          Pagos
        </button>
      </div>

      {/* General Tab */}
      {tab === 'general' && (
        <form onSubmit={saveSiteConfig} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del sitio</label>
            <input className="input-field" value={siteConfig.site_name} onChange={(e) => setSiteConfig({ ...siteConfig, site_name: e.target.value })} placeholder="Ananda para el Alma" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
            <input className="input-field" value={siteConfig.tagline} onChange={(e) => setSiteConfig({ ...siteConfig, tagline: e.target.value })} placeholder="Tu espacio de espiritualidad y bienestar" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
            <input type="email" className="input-field" value={siteConfig.contact_email} onChange={(e) => setSiteConfig({ ...siteConfig, contact_email: e.target.value })} placeholder="natalia@anandaparaelalma.com" />
          </div>

          <ImageUpload
            label="Foto de la profesora"
            value={siteConfig.professor_photo_url}
            onChange={(url) => setSiteConfig({ ...siteConfig, professor_photo_url: url })}
          />

          <ImageUpload
            label="Logo"
            value={siteConfig.logo_url}
            onChange={(url) => setSiteConfig({ ...siteConfig, logo_url: url })}
          />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded border cursor-pointer" value={siteConfig.color_primary} onChange={(e) => setSiteConfig({ ...siteConfig, color_primary: e.target.value })} />
                <input className="input-field flex-1 font-mono text-sm" value={siteConfig.color_primary} onChange={(e) => setSiteConfig({ ...siteConfig, color_primary: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color secundario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded border cursor-pointer" value={siteConfig.color_secondary} onChange={(e) => setSiteConfig({ ...siteConfig, color_secondary: e.target.value })} />
                <input className="input-field flex-1 font-mono text-sm" value={siteConfig.color_secondary} onChange={(e) => setSiteConfig({ ...siteConfig, color_secondary: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color acento</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded border cursor-pointer" value={siteConfig.color_accent} onChange={(e) => setSiteConfig({ ...siteConfig, color_accent: e.target.value })} />
                <input className="input-field flex-1 font-mono text-sm" value={siteConfig.color_accent} onChange={(e) => setSiteConfig({ ...siteConfig, color_accent: e.target.value })} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar configuración general'}
          </button>
        </form>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="space-y-6">
          {/* MercadoPago */}
          <form onSubmit={savePaymentConfig} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-700">MercadoPago</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-medium mb-1">Credenciales de tu cuenta</p>
              <p>Las credenciales deben ser de <strong>tu cuenta de MercadoPago</strong> (la que recibirá los pagos). No se comparten ni se guardan en el código.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">Habilitar pago online con MercadoPago</p>
                <p className="text-sm text-gray-500">Permite a los usuarios pagar con tarjeta o saldo MP</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={paymentConfig.online_payments_enabled}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, online_payments_enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>

            {paymentConfig.online_payments_enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MercadoPago Access Token</label>
                  <div className="relative">
                    <input
                      type={showAccessToken ? 'text' : 'password'}
                      className="input-field font-mono"
                      style={{ paddingRight: '2.5rem' }}
                      value={paymentConfig.mercadopago_access_token}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopago_access_token: e.target.value })}
                      placeholder="APP_USR-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessToken((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showAccessToken ? 'Ocultar Access Token' : 'Mostrar Access Token'}
                    >
                      <EyeIcon open={showAccessToken} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Token de acceso de tu cuenta MercadoPago (Credentials en el panel de MP)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MercadoPago Public Key</label>
                  <div className="relative">
                    <input
                      type={showPublicKey ? 'text' : 'password'}
                      className="input-field font-mono"
                      style={{ paddingRight: '2.5rem' }}
                      value={paymentConfig.mercadopago_public_key}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopago_public_key: e.target.value })}
                      placeholder="APP_USR-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPublicKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPublicKey ? 'Ocultar Public Key' : 'Mostrar Public Key'}
                    >
                      <EyeIcon open={showPublicKey} />
                    </button>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar configuración de MercadoPago'}
            </button>
          </form>

          {/* Manual Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-700">Métodos de pago manual</h2>
                <p className="text-sm text-gray-500 mt-0.5">Efectivo, transferencia u otros. Los habilitados aparecen en el checkout.</p>
              </div>
            </div>

            {manualMethods.length === 0 && !showAddForm && (
              <div className="text-center py-6 text-gray-400">
                <p className="text-3xl mb-2">💵</p>
                <p className="text-sm">No hay métodos de pago manual configurados</p>
              </div>
            )}

            <div className="space-y-4">
              {manualMethods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      className="input-field flex-1 font-medium"
                      value={method.name}
                      onChange={(e) => updateMethod(method.id, 'name', e.target.value)}
                      placeholder="Nombre del método"
                    />
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={method.enabled}
                        onChange={(e) => updateMethod(method.id, 'enabled', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Instrucciones (alias, CBU, horarios, etc.)</label>
                    <textarea
                      className="input-field resize-none text-sm"
                      rows={3}
                      value={method.instructions ?? ''}
                      onChange={(e) => updateMethod(method.id, 'instructions', e.target.value)}
                      placeholder="Ej: Alias MP: natalia.alma / CBU: 0000000000000000000000"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => saveMethod(method.id)}
                      disabled={savingMethodId === method.id}
                      className="btn-primary text-sm py-2 disabled:opacity-60"
                    >
                      {savingMethodId === method.id ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => deleteMethod(method.id)}
                      className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddForm ? (
              <form onSubmit={addMethod} className="border border-dashed border-gray-300 rounded-xl p-5 space-y-4">
                <h3 className="font-medium text-gray-700 text-sm">Nuevo método de pago</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                  <input
                    required
                    className="input-field"
                    value={newMethodForm.name}
                    onChange={(e) => setNewMethodForm({ ...newMethodForm, name: e.target.value })}
                    placeholder="Ej: Efectivo, Transferencia, Uala..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Instrucciones</label>
                  <textarea
                    className="input-field resize-none text-sm"
                    rows={3}
                    value={newMethodForm.instructions}
                    onChange={(e) => setNewMethodForm({ ...newMethodForm, instructions: e.target.value })}
                    placeholder="Datos de pago, instrucciones, etc."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary text-sm py-2">Agregar método</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline text-sm py-2">Cancelar</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full border border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
              >
                + Agregar método de pago manual
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
