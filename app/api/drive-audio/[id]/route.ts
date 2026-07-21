import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

async function fetchDriveFile(fileId: string, range: string | null): Promise<Response> {
  const rangeHeaders: HeadersInit = range ? { Range: range } : {}

  let res = await fetch(
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    { headers: rangeHeaders, redirect: 'follow' }
  )

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('text/html')) {
    // Archivo grande: Drive devuelve la página de advertencia de antivirus.
    // Repetimos la descarga pasando el token de confirmación y la cookie de sesión.
    const interstitial = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, {
      redirect: 'manual',
    })
    const cookie = interstitial.headers.get('set-cookie') ?? ''
    const html = await interstitial.text()
    const token = html.match(/confirm=([0-9A-Za-z_-]+)/)?.[1]

    if (token) {
      res = await fetch(
        `https://drive.google.com/uc?export=download&confirm=${token}&id=${fileId}`,
        { headers: { ...rangeHeaders, ...(cookie ? { Cookie: cookie } : {}) }, redirect: 'follow' }
      )
    }
  }

  return res
}

export async function GET(request: NextRequest, ctx: RouteContext<'/api/drive-audio/[id]'>) {
  const { id } = await ctx.params
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return new Response('ID de archivo inválido', { status: 400 })
  }

  const range = request.headers.get('range')
  const driveRes = await fetchDriveFile(id, range)

  if (!driveRes.ok && driveRes.status !== 206) {
    return new Response('No se pudo obtener el audio desde Google Drive', { status: 502 })
  }

  const contentType = driveRes.headers.get('content-type') ?? ''
  const headers = new Headers()
  headers.set('Content-Type', contentType.includes('text/html') ? 'audio/mpeg' : contentType || 'audio/mpeg')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', 'public, max-age=3600')

  const contentLength = driveRes.headers.get('content-length')
  if (contentLength) headers.set('Content-Length', contentLength)
  const contentRange = driveRes.headers.get('content-range')
  if (contentRange) headers.set('Content-Range', contentRange)

  return new Response(driveRes.body, {
    status: driveRes.status === 206 ? 206 : 200,
    headers,
  })
}
