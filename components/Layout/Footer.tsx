import Link from 'next/link'

export default function Footer({ siteName, email }: { siteName?: string; email?: string }) {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
        <p className="text-white font-semibold text-lg">{siteName ?? 'Ananda para el Alma'}</p>
        <p className="text-sm">Tarot · Chamanismo · Meditación · Constelaciones Familiares</p>
        {email && (
          <p className="text-sm">
            <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a>
          </p>
        )}
        <p className="text-xs text-gray-500 pt-4">
          © {new Date().getFullYear()} {siteName ?? 'Ananda para el Alma'}. Todos los derechos reservados.
        </p>
        <p className="text-xs text-gray-600 pt-1">
          <Link href="/canjear" className="hover:text-gray-400 transition-colors">
            ¿Tenés un código de tu libro?
          </Link>
        </p>
      </div>
    </footer>
  )
}
