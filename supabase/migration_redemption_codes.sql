-- Migration: Códigos de Canje para libro físico
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql

CREATE TABLE redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE redemption_code_meditations (
  code_id UUID REFERENCES redemption_codes(id) ON DELETE CASCADE,
  meditation_id UUID REFERENCES meditations(id) ON DELETE CASCADE,
  PRIMARY KEY (code_id, meditation_id)
);

CREATE TABLE redemption_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES redemption_codes(id),
  user_id UUID REFERENCES users(id),
  redeemed_at TIMESTAMP DEFAULT now(),
  UNIQUE(code_id, user_id)
);

ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_code_meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_code_uses ENABLE ROW LEVEL SECURITY;

-- Control de acceso fino manejado en las API routes (service role key)
CREATE POLICY "redemption_codes_select" ON redemption_codes FOR SELECT USING (true);
CREATE POLICY "redemption_codes_all" ON redemption_codes USING (true);

CREATE POLICY "redemption_code_meditations_select" ON redemption_code_meditations FOR SELECT USING (true);
CREATE POLICY "redemption_code_meditations_all" ON redemption_code_meditations USING (true);

CREATE POLICY "redemption_code_uses_select" ON redemption_code_uses FOR SELECT USING (true);
CREATE POLICY "redemption_code_uses_all" ON redemption_code_uses USING (true);
