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
  payment_instructions: string
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
    payment_instructions: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/site-config').then((r) => r.json()),
      fetch('/api/payment-config').then((r) => r.json()),
    ]).then(([site, payment]) => {
      if (site && !site.error) setSiteConfig(site)
      if (payment && !payment.error) setPaymentConfig(payment)
    })
  }, [])

  async function saveSiteConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/site-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteConfig),
    })
    setSaving(false)
    setMessage(res.ok ? '✓ Configuración guardada' : '✗ Error al guardar')
    setTimeout(() => setMessage(''), 3000)
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
    setMessage(res.ok ? '✓ Configuración de pagos guardada' : '✗ Error al guardar')
    setTimeout(() => setMessage(''), 3000)
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
        <form onSubmit={savePaymentConfig} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Configuración de pagos</p>
            <p>Las credenciales de MercadoPago deben ser de <strong>tu cuenta de MercadoPago</strong> (la que recibirá los pagos). No se comparten con nadie ni se guardan en el código.</p>
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
                <input
                  type="password"
                  className="input-field font-mono"
                  value={paymentConfig.mercadopago_access_token}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopago_access_token: e.target.value })}
                  placeholder="APP_USR-..."
                />
                <p className="text-xs text-gray-400 mt-1">Token de acceso de tu cuenta MercadoPago (obtenelo en Credentials en el panel de MP)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MercadoPago Public Key</label>
                <input
                  type="password"
                  className="input-field font-mono"
                  value={paymentConfig.mercadopago_public_key}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, mercadopago_public_key: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de pago manual</label>
            <textarea
              className="input-field resize-none"
              rows={5}
              value={paymentConfig.payment_instructions}
              onChange={(e) => setPaymentConfig({ ...paymentConfig, payment_instructions: e.target.value })}
              placeholder={'Ejemplo:\nAliás: natalia.alma\nCBU: 1234567890123456789012\n\nTransferís el importe del curso y me avisás por WhatsApp.'}
            />
            <p className="text-xs text-gray-400 mt-1">Este texto lo verán los usuarios al elegir pago manual</p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar configuración de pagos'}
          </button>
        </form>
      )}
    </div>
  )
}
