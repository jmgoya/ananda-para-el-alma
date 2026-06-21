import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getCourse } from '@/lib/db'
import AudioPlayer from '@/components/AudioPlayer'
import SpotifyEmbed from '@/components/SpotifyEmbed'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { extractYouTubeId, extractSpotifyEmbed } from '@/lib/utils'

interface Material {
  id: string
  title: string
  type: string
  video_url?: string
  document_url?: string
  spotify_url?: string
  audio_url?: string
  order?: number
}

interface Module {
  id: string
  title: string
  order?: number
  materials?: Material[]
}

const materialIcon: Record<string, string> = {
  video: '📹',
  document: '📄',
  spotify: '🎵',
  audio: '🎧',
}

export default async function StudentCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const { data: access } = await supabaseAdmin
    .from('course_access')
    .select('status')
    .eq('user_id', session!.user.id)
    .eq('course_id', id)
    .eq('status', 'approved')
    .single()

  if (!access) redirect(`/courses/${id}`)

  const course = await getCourse(id).catch(() => null)
  if (!course) notFound()

  const modules: Module[] = (course.modules ?? []).sort((a: Module, b: Module) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="space-y-8">
      <div>
        <Link href="/student" className="text-sm text-gray-400 hover:text-gray-600">← Mi área</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{course.title}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Module list sidebar */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold text-gray-700 mb-3">Contenido</h2>
          <div className="space-y-2">
            {modules.map((mod) => (
              <details key={mod.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <summary className="p-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <span>📚</span> {mod.title}
                </summary>
                <div className="border-t border-gray-100">
                  {(mod.materials ?? [])
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((mat) => (
                    <div key={mat.id} className="px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 text-sm text-gray-600">
                      <span>{materialIcon[mat.type] ?? '📄'}</span>
                      {mat.title}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {modules.map((mod) => (
            <div key={mod.id}>
              <h3 className="font-semibold text-gray-700 mb-4 text-lg">{mod.title}</h3>
              <div className="space-y-4">
                {(mod.materials ?? [])
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((mat) => (
                  <div key={mat.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                      <span>{materialIcon[mat.type] ?? '📄'}</span>
                      <span className="font-medium text-gray-700">{mat.title}</span>
                    </div>
                    <div className="p-4">
                      {mat.type === 'video' && mat.video_url && (() => {
                        const ytId = extractYouTubeId(mat.video_url)
                        return ytId ? (
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}`}
                              title={mat.title}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : null
                      })()}
                      {mat.type === 'document' && mat.document_url && (
                        <a
                          href={mat.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline inline-flex"
                        >
                          📄 Descargar documento
                        </a>
                      )}
                      {mat.type === 'spotify' && mat.spotify_url && (() => {
                        const embedUrl = extractSpotifyEmbed(mat.spotify_url)
                        return embedUrl ? <SpotifyEmbed embedUrl={embedUrl} /> : null
                      })()}
                      {mat.type === 'audio' && mat.audio_url && (
                        <AudioPlayer url={mat.audio_url} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
