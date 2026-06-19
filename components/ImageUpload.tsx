'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
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
      setError(data.error ?? 'Error al subir la imagen')
      return
    }

    onChange(data.url)
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {value && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
          <Image src={value} alt="Preview" fill className="object-contain p-1" unoptimized />
          <button
            type="button"
            onClick={() => onChange('')}
            title="Quitar imagen"
            className="absolute top-1.5 right-1.5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-400 hover:text-red-600 text-xs font-bold leading-none"
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
          {uploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        <input
          type="url"
          className="input-field text-sm flex-1 min-w-0"
          placeholder="O pegá una URL directamente..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
