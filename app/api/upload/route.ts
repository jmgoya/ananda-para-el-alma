import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/x-m4a']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const MAX_DOCUMENT_BYTES = 35 * 1024 * 1024

export async function POST(request: Request) {
  // Solo admins pueden subir archivos
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type) || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type) || /\.(pdf|doc|docx)$/i.test(file.name)

  if (!isImage && !isAudio && !isDocument) {
    return Response.json({ error: 'Tipo de archivo no permitido. Imágenes, audio (MP3, WAV) o documentos (PDF, DOC, DOCX).' }, { status: 400 })
  }

  const maxBytes = isAudio ? MAX_AUDIO_BYTES : isDocument ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES
  if (file.size > maxBytes) {
    return Response.json({ error: `El archivo no puede superar ${maxBytes / (1024 * 1024)}MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await supabaseAdmin.storage
    .from('uploads')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('uploads').getPublicUrl(data.path)
  return Response.json({ url: urlData.publicUrl })
}
