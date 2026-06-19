import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RedeemForm from './RedeemForm'

export default async function CanjearPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login?callbackUrl=/canjear')

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">📖</div>
            <h1 className="text-2xl font-bold text-gray-800">Canjear código del libro</h1>
            <p className="text-gray-500 text-sm mt-1">
              Ingresá el código que encontrás impreso en tu libro para desbloquear las meditaciones bonus.
            </p>
          </div>

          <RedeemForm />

          <div className="border-t border-gray-100 pt-4 text-center">
            <Link href="/meditaciones" className="text-sm text-gray-400 hover:text-gray-600">
              ← Volver a meditaciones
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
