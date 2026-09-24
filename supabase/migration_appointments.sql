-- Migration: Turnos de atención
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available', -- available | booked | cancelled
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  notes TEXT,
  user_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  booked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (date, start_time)
);

CREATE INDEX appointments_date_idx ON appointments (date, start_time);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Control de acceso fino manejado en las API routes (service role key)
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_all" ON appointments USING (true);
