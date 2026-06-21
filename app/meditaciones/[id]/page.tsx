import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { extractYouTubeId, extractSpotifyEmbed } from '@/lib/utils'
import AudioPlayer from '@/components/AudioPlayer'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function userHasRedeemedCodeForMeditation(userId: string, meditationId: string): Promise<boolean> {
  const { data: codeLinks } = await supabaseAdmin
    .from('redemption_code_meditations')
    .select('code_id')
    .eq('meditation_id', meditationId)

  const codeIds = (codeLinks ?? []).map((cl: any) => cl.code_id)
  if (codeIds.length === 0) return false

  const { data: use } = await supabaseAdmin
    .from('redemption_code_uses')
    .select('id')
    .eq('user_id', userId)
    .in('code_id', codeIds)
    .limit(1)
    .single()

  return !!use
}

export default async function MeditacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const { data: m, error } = await supabaseAdmin.from('meditations').select('*').eq('id', id).single()
  if (error || !m) notFound()

  let canAccess = m.visibility === 'public' || session?.user?.role === 'admin'

  if (!canAccess && m.visibility === 'registered') {
    canAccess = !!session?.user
  }

  if (!canAccess && m.visibility === 'code_restricted' && session?.user) {
    canAccess = await userHasRedeemedCodeForMeditation(session.user.id, id)
  }

  if (!canAccess) {
    if (m.visibility === 'code_restricted') {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-5xl">📖</div>
            <h1 className="text-2xl font-bold text-gray-800">Meditación exclusiva del libro</h1>
            <p className="text-gray-500">
              Esta meditación es un bonus exclusivo para quienes compraron el libro. ¿Tenés tu código?
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/canjear" className="btn-primary">Canjear código</Link>
              <Link href="/meditaciones" className="btn-outline">Ver meditaciones</Link>
            </div>
            {!session?.user && (
              <p className="text-sm text-gray-400">
                Primero necesitás{' '}
                <Link href="/auth/login?callbackUrl=/canjear" className="underline" style={{ color: 'var(--color-primary)' }}>
                  iniciar sesión
                </Link>
              </p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800">Contenido para miembros</h1>
          <p className="text-gray-500">Esta meditación requiere una cuenta registrada.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary">Crear cuenta</Link>
            <Link href="/auth/login" className="btn-outline">Ingresar</Link>
          </div>
        </div>
      </div>
    )
  }

  const mediaType = m.media_type ?? (m.spotify_url ? 'spotify' : m.audio_url ? 'audio' : 'youtube')
  const youtubeId = mediaType === 'youtube' && m.video_url ? extractYouTubeId(m.video_url) : null
  const spotifyEmbedUrl = mediaType === 'spotify' && m.spotify_url ? extractSpotifyEmbed(m.spotify_url) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/meditaciones" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6">
        ← Volver a meditaciones
      </Link>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">{m.title}</h1>
          {m.visibility === 'code_restricted' ? (
            <span className="badge badge-blue">Bonus libro</span>
          ) : (
            <span className={`badge ${m.type === 'free' ? 'badge-green' : 'badge-purple'}`}>
              {m.type === 'free' ? 'Gratis' : 'Premium'}
            </span>
          )}
        </div>

        {m.duration_minutes && (
          <p className="text-gray-400 text-sm">⏱ {m.duration_minutes} minutos</p>
        )}

        {m.description && <p className="text-gray-600 leading-relaxed">{m.description}</p>}

        {mediaType === 'youtube' && youtubeId && (
          <div className="aspect-video rounded-2xl overflow-hidden shadow-md">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={m.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {mediaType === 'spotify' && spotifyEmbedUrl && (
          <SpotifyEmbed embedUrl={spotifyEmbedUrl} />
        )}

        {mediaType === 'audio' && m.audio_url && (
          <AudioPlayer url={m.audio_url} />
        )}

        {!youtubeId && !spotifyEmbedUrl && !m.audio_url && (
          <div className="bg-gray-100 rounded-2xl p-12 text-center text-gray-400">
            <p className="text-5xl mb-4">🎵</p>
            <p>Contenido no disponible</p>
          </div>
        )}
      </div>
    </div>
  )
}
