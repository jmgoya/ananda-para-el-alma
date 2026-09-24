export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function formatPrice(price: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(price)
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{6,})/
  )
  return match?.[1] ?? null
}

export function extractSpotifyEmbed(url: string): string | null {
  const match = url.match(/open\.spotify\.com\/(track|episode|playlist|album|show)\/([a-zA-Z0-9]+)/)
  if (!match) return null
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}`
}

export function extractGoogleDriveId(url: string): string | null {
  const match = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=download&)?id=)([a-zA-Z0-9_-]+)/
  )
  return match?.[1] ?? null
}

// Arma el link de wa.me con un mensaje predefinido, listo para enviar
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

// "09:00:00" -> "09:00"
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

// Link "Agregar a Google Calendar" sin necesitar integración con la API de Google
export function googleCalendarLink(opts: {
  title: string
  description: string
  location?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM or HH:MM:SS
  endTime: string // HH:MM or HH:MM:SS
}): string {
  const toStamp = (time: string) => `${opts.date.replace(/-/g, '')}T${time.replace(/:/g, '').padEnd(6, '0')}`
  const dates = `${toStamp(opts.startTime)}/${toStamp(opts.endTime)}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates,
    details: opts.description,
    location: opts.location ?? '',
  })
  return `https://www.google.com/calendar/render?${params.toString()}`
}
