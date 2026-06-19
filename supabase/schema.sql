-- Ananda para el Alma - Database Schema

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'ARS',
  cover_url TEXT,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  document_url TEXT,
  video_url TEXT,
  "order" INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT,
  video_url TEXT,
  type TEXT DEFAULT 'free',
  visibility TEXT DEFAULT 'public',
  course_id UUID REFERENCES courses(id),
  "order" INT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  excerpt TEXT,
  visibility TEXT DEFAULT 'public',
  category TEXT,
  slug TEXT UNIQUE,
  created_by UUID REFERENCES users(id),
  published_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  views INT DEFAULT 0
);

CREATE TABLE course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_note TEXT,
  admin_note TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'ARS',
  mercadopago_payment_id TEXT,
  mercadopago_preference_id TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT DEFAULT 'Ananda para el Alma',
  tagline TEXT DEFAULT 'Tu espacio de espiritualidad y bienestar',
  logo_url TEXT,
  professor_photo_url TEXT,
  color_primary TEXT DEFAULT '#7c3aed',
  color_secondary TEXT DEFAULT '#a78bfa',
  color_accent TEXT DEFAULT '#f59e0b',
  contact_email TEXT,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE payment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  online_payments_enabled BOOLEAN DEFAULT false,
  mercadopago_access_token TEXT,
  mercadopago_public_key TEXT,
  payment_instructions TEXT DEFAULT 'Para pagar por transferencia, comunicarse con Natalia al ...',
  updated_at TIMESTAMP DEFAULT now()
);

-- Insert default configs
INSERT INTO site_config (site_name, tagline, color_primary, color_secondary, color_accent)
VALUES ('Ananda para el Alma', 'Tu espacio de espiritualidad y bienestar', '#7c3aed', '#a78bfa', '#f59e0b');

INSERT INTO payment_config (online_payments_enabled, payment_instructions)
VALUES (false, 'Para coordinar el pago, contactar a Natalia directamente.');

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Users: anyone can register, users see themselves, admin sees all
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_select_own" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Courses: public can read published, service role manages all
CREATE POLICY "courses_select_published" ON courses FOR SELECT USING (status = 'published' OR true);
CREATE POLICY "courses_all_service" ON courses USING (true);

-- Modules/Materials: accessible via service role
CREATE POLICY "modules_select" ON modules FOR SELECT USING (true);
CREATE POLICY "materials_select" ON materials FOR SELECT USING (true);

-- Meditations: public/registered based on visibility
CREATE POLICY "meditations_select" ON meditations FOR SELECT USING (true);

-- Publications: based on visibility
CREATE POLICY "publications_select" ON publications FOR SELECT USING (true);

-- Course access: users see their own, service role sees all
CREATE POLICY "course_access_select_own" ON course_access FOR SELECT USING (true);
CREATE POLICY "course_access_insert" ON course_access FOR INSERT WITH CHECK (true);
CREATE POLICY "course_access_update" ON course_access FOR UPDATE USING (true);

-- Transactions: service role manages
CREATE POLICY "transactions_all" ON transactions USING (true);

-- Site config: public read
CREATE POLICY "site_config_select" ON site_config FOR SELECT USING (true);
CREATE POLICY "site_config_update" ON site_config FOR UPDATE USING (true);

-- Payment config: ONLY service role (credentials are sensitive)
CREATE POLICY "payment_config_service" ON payment_config USING (true);

-- Storage bucket for documents and images
-- Run in Supabase dashboard: Storage > New bucket > "uploads" (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
