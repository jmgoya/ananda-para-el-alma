'use client'

import { useEffect } from 'react'

interface SiteConfig {
  color_primary?: string
  color_secondary?: string
  color_accent?: string
}

export default function ThemeProvider({ config }: { config: SiteConfig | null }) {
  useEffect(() => {
    if (!config) return
    const root = document.documentElement
    if (config.color_primary) root.style.setProperty('--color-primary', config.color_primary)
    if (config.color_secondary) root.style.setProperty('--color-secondary', config.color_secondary)
    if (config.color_accent) root.style.setProperty('--color-accent', config.color_accent)
  }, [config])

  return null
}
