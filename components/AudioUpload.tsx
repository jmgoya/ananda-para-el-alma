'use client'

import { useRef, useState } from 'react'

interface AudioUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function AudioUpload({ value, onChange, label }: AudioUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)

    if (inputRef.current) inputRef.current.value = ''

    if (!res.ok) {
      setError(data.error ?? 'Error al subir el audio')
      return
    }

    onChange(data.url)
  }

  const fileName = value ? value.split('/').pop() : null

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {value && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between gap-2">
          <span className="text-sm text-gray-600 truncate">🎧 {fileName ?? value}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-gray-400 hover:text-red-600 text-xs font-bold flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-outline text-sm py-2 whitespace-nowrap disabled:opacity-60"
        >
          {uploading ? 'Subiendo...' : value ? 'Cambiar audio' : 'Subir MP3'}
        </button>
        <input
          type="url"
          className="input-field text-sm flex-1 min-w-0"
          placeholder="O pegá una URL del archivo de audio..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,.mp3,.wav,.ogg,.m4a,.aac"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
