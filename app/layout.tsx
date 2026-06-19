import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/Layout/SessionProvider'
import Navbar from '@/components/Layout/Navbar'
import Footer from '@/components/Layout/Footer'
import ThemeProvider from '@/components/Layout/ThemeProvider'
import { getSiteConfig } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Ananda para el Alma',
  description: 'Tu espacio de espiritualidad y bienestar',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getSiteConfig().catch(() => null)

  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ThemeProvider config={siteConfig} />
          <Navbar siteName={siteConfig?.site_name} />
          <main className="flex-1">{children}</main>
          <Footer siteName={siteConfig?.site_name} email={siteConfig?.contact_email} />
        </AuthProvider>
      </body>
    </html>
  )
}
