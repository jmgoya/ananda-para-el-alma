'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

interface Course {
  id: string
  title: string
  description: string
  price: number
  currency: string
  cover_url?: string
}

interface PaymentConfig {
  online_payments_enabled: boolean
}

interface ManualPaymentMethod {
  id: string
  name: string
  instructions: string
  enabled: boolean
  order: number
}

export default function CheckoutPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  const [course, setCourse] = useState<Course | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [manualMethods, setManualMethods] = useState<ManualPaymentMethod[]>([])
  const [step, setStep] = useState<'choose' | 'manual'>('choose')
  const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethod | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/checkout/${courseId}`)
    }
  }, [status, courseId, router])

  useEffect(() => {
    async function load() {
      const [courseRes, configRes, methodsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch('/api/payment-config/public'),
        fetch('/api/manual-payment-methods'),
      ])
      if (courseRes.ok) setCourse(await courseRes.json())
      if (configRes.ok) setPaymentConfig(await configRes.json())
      if (methodsRes.ok) {
        const methods: ManualPaymentMethod[] = await methodsRes.json()
        setManualMethods(methods.filter(m => m.enabled))
      }
    }
    load()
  }, [courseId])

  async function handleOnlinePayment() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear pago')
      window.location.href = data.init_point
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago')
      setLoading(false)
    }
  }

  function selectManualMethod(method: ManualPaymentMethod) {
    setSelectedMethod(method)
    setStep('manual')
  }

  async function handleManualPayment() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/course-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          payment_method: 'manual',
          payment_note: paymentNote,
          manual_payment_method_id: selectedMethod?.id ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar solicitud')
      router.push('/checkout/pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar solicitud')
      setLoading(false)
    }
  }

  const hasAnyPaymentMethod = paymentConfig?.online_payments_enabled || manualMethods.length > 0

  if (status === 'loading' || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Course summary */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {course.cover_url && (
            <div className="h-40 overflow-hidden">
              <Image src={course.cover_url} alt={course.title} width={500} height={160} className="object-cover w-full h-full" />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-800">{course.title}</h1>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
            <p className="text-2xl font-bold mt-4" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(Number(course.price), course.currency)}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {step === 'choose' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 text-center">Elegí cómo querés pagar</h2>

            {!hasAnyPaymentMethod && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
                <p className="font-medium">No hay métodos de pago disponibles actualmente</p>
                <p className="text-sm mt-1">Contactá con Natalia para coordinar el acceso</p>
              </div>
            )}

            {paymentConfig?.online_payments_enabled && (
              <button
                onClick={handleOnlinePayment}
                disabled={loading}
                className="w-full bg-white rounded-xl shadow-sm border-2 hover:border-blue-400 transition-colors p-6 text-left group disabled:opacity-60"
                style={{ borderColor: 'transparent' }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💳</div>
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-blue-600">Pagar online con MercadoPago</p>
                    <p className="text-sm text-gray-500 mt-1">Tarjeta de crédito, débito o saldo en cuenta</p>
                    <p className="text-xs text-gray-400 mt-1">Acceso inmediato al pagar</p>
                  </div>
                </div>
              </button>
            )}

            {manualMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => selectManualMethod(method)}
                className="w-full bg-white rounded-xl shadow-sm border-2 hover:border-green-400 transition-colors p-6 text-left group"
                style={{ borderColor: 'transparent' }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💵</div>
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-green-600">Pagar en {method.name}</p>
                    <p className="text-sm text-gray-500 mt-1">Coordinás el pago directamente con Natalia</p>
                    <p className="text-xs text-gray-400 mt-1">Acceso disponible tras la confirmación</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 'manual' && selectedMethod && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <button onClick={() => setStep('choose')} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              ← Volver
            </button>
            <h2 className="text-lg font-semibold text-gray-700">Pago en {selectedMethod.name}</h2>

            {selectedMethod.instructions && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-1">Instrucciones de pago:</p>
                <p className="text-sm text-green-700 whitespace-pre-wrap">{selectedMethod.instructions}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nota para Natalia (opcional)
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Ej: Ya realicé la transferencia, adjunto comprobante..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>

            <button
              onClick={handleManualPayment}
              disabled={loading}
              className="w-full btn-primary justify-center py-3 disabled:opacity-60"
            >
              {loading ? 'Enviando solicitud...' : 'Confirmar solicitud de acceso'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Recibirás acceso una vez que Natalia confirme el pago
            </p>
          </div>
        )}

        <p className="text-center text-sm text-gray-400">
          Logueado como {session?.user?.email}
        </p>
      </div>
    </div>
  )
}
