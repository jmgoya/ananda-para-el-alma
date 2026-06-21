interface AudioPlayerProps {
  url: string
}

export default function AudioPlayer({ url }: AudioPlayerProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls className="w-full">
        <source src={url} />
        Tu navegador no soporta reproducción de audio.
      </audio>
    </div>
  )
}
