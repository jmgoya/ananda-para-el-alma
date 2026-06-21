-- Migration: Audio/Spotify support + Configurable manual payment methods
-- Ejecutar en el SQL Editor de Supabase

-- --------------------------------------------------------
-- Item 3: Soporte para audio MP3 y Spotify
-- --------------------------------------------------------

ALTER TABLE materials ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS audio_url TEXT;

ALTER TABLE meditations ADD COLUMN IF NOT EXISTS spotify_url TEXT;
ALTER TABLE meditations ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE meditations ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'youtube';

-- --------------------------------------------------------
-- Item 4: Métodos de pago manual configurables
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS manual_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instructions TEXT,
  enabled BOOLEAN DEFAULT true,
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE manual_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manual_payment_methods_all" ON manual_payment_methods USING (true);

-- Métodos por defecto
INSERT INTO manual_payment_methods (name, instructions, enabled, "order") VALUES
  ('Efectivo', 'Coordinar el pago en efectivo directamente con Natalia.', true, 1),
  ('Transferencia', 'Transferir a Alias: [completar] / CBU: [completar]', true, 2);

-- Referencia en course_access para registrar qué método eligió el usuario
ALTER TABLE course_access ADD COLUMN IF NOT EXISTS manual_payment_method_id UUID REFERENCES manual_payment_methods(id);
