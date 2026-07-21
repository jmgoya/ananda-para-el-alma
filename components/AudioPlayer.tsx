'use client'

import { useState } from 'react'
import { extractGoogleDriveId } from '@/lib/utils'

interface AudioPlayerProps {
  url: string
}

export default function AudioPlayer({ url }: AudioPlayerProps) {
  const [failed, setFailed] = useState(false)
  const driveId = extractGoogleDriveId(url)
  const src = driveId ? `/api/drive-audio/${driveId}` : url

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <audio controls className="w-full" onError={() => setFailed(true)}>
        <source src={src} />
        Tu navegador no soporta reproducción de audio.
      </audio>
      {failed && (
        <p className="text-sm text-red-500 mt-2">
          No se pudo cargar el audio. Verificá que el archivo esté disponible y sea público.
        </p>
      )}
    </div>
  )
}
