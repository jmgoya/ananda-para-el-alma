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
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&\s]+)/
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
