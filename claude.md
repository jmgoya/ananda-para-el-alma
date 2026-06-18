# Perfil del Proyecto: Ananda para el Alma

## Cliente y Contexto
- **Dueña**: Natalia Schwaderer - Profesora de cursos espirituales
- **Sitio**: Ananda para el Alma (anandaparaelalma.com)
- **Espacio físico**: "Terapias para el alma con Nati Schwaderer"
- **Servicios**: Tarot, Chamanismo, Meditación, Constelaciones Familiares
- **Ubicación**: Argentina
- **Escala inicial**: <100 usuarios, 3-8 cursos, meditaciones regulares, publicaciones semanales
- **Objetivo**: Plataforma integral de cursos + contenido dinámico + comunidad

## Especificaciones Clave

### Usuarios y Roles
- **Público (sin login)**: Ver catálogo de cursos, meditaciones gratuitas, publicaciones públicas
- **Usuario registrado**: Login, solicitar/comprar acceso a cursos, ver meditaciones para registrados
- **Estudiante/Suscriptor**: Usuario con acceso aprobado (pago online o manual) → accede a cursos + meditaciones premium
- **Admin**: Natalia, control total: cursos, meditaciones, publicaciones, usuarios, configuración, pagos

### Contenido Principal: 3 Tipos

#### 1. CURSOS
- Estructura: Curso > Módulos > Materiales
- Materiales: Documentos (PDF/DOCX) + Videos (YouTube)
- Acceso: Pago online (MercadoPago) O pago manual (efectivo/transferencia) + aprobación
- Control: Admin CRUD, reordenar módulos

#### 2. MEDITACIONES
- Formato: Videos YouTube embebidos (cortos/medianos)
- Tipos: Gratuitas o Premium (dentro de cursos)
- Visibilidad: Pública | Solo registrados | Restringida a curso
- Display: Grid en `/meditaciones`
- Control: Admin CRUD, reordenar, filtrar por tipo/acceso

#### 3. PUBLICACIONES/FEED
- Formato: Posts cortos tipo Instagram/Twitter (título + texto + imagen)
- Visibilidad: Pública | Solo registrados
- Display: Feed en landing page + página `/publicaciones`
- Categorías: Meditación, Tarot, Chamanismo, General
- Control: Admin CRUD

---

## 💳 SISTEMA DE PAGOS: HÍBRIDO (ONLINE + MANUAL)

El usuario elige CÓMO pagar. Ambos métodos coexisten siempre.

### Opción A: Pago Online (MercadoPago Checkout Pro)

```
1. Usuario click "Solicitar/Comprar" en curso
2. Ve 2 opciones: "Pagar online" o "Pagar en efectivo/transferencia"
3. Si elige ONLINE:
   → Backend crea una "preferencia de pago" en MercadoPago (API)
   → Usuario es redirigido a Checkout Pro (la página de MercadoPago)
   → Paga con tarjeta de crédito/débito o saldo en cuenta MP
   → MercadoPago redirige de vuelta + envía webhook de confirmación
4. Webhook recibe la notificación → valida el pago
5. Si pago aprobado:
   → Se crea/actualiza course_access: status='approved', payment_method='online'
   → Se crea registro en transactions con los datos del pago
   → Usuario accede inmediatamente al curso (sin esperar al admin)
6. Si pago rechazado/pendiente: se refleja el estado correspondiente
```

### Opción B: Pago Manual (Efectivo/Transferencia)

```
1. Usuario elige "Pagar en efectivo/transferencia"
2. Ve instrucciones de pago (configuradas por admin en site_config):
   Ej: "Transferí a Alias: nati.ananda.mp / O pagá en efectivo en el estudio"
3. Usuario puede dejar una nota opcional (ej: "Transferí el 15/06")
4. Se crea course_access: status='pending', payment_method='manual'
5. Admin ve la solicitud en /admin/users → sección "Pendientes de aprobación"
6. Admin verifica el pago por fuera del sistema (WhatsApp, banco, etc.)
7. Admin click "Aprobar acceso" → status='approved'
   (o "Rechazar" → status='denied')
```

### Configuración de Pagos — TODO DESDE EL PANEL ADMIN (sin tocar código)

```
/admin/settings → Sección "Pagos"

┌──────────────────────────────────────────────┐
│ Habilitar pago online (MercadoPago): [ON/OFF] │
│ MercadoPago Access Token: [**********]        │
│ MercadoPago Public Key: [**********]          │
│                                                │
│ Instrucciones de pago manual:                 │
│ [textarea libre - alias, CBU, efectivo, etc.] │
└──────────────────────────────────────────────┘
```

**IMPORTANTE — Sobre las credenciales de MercadoPago:**
- El Access Token y Public Key DEBEN ser de la cuenta MercadoPago de quien recibe el dinero (en producción: Natalia; durante desarrollo/testing: del desarrollador con credenciales TEST-...)
- Se guardan en la base de datos (tabla `payment_config`), NUNCA hardcodeadas en el código
- El admin puede cambiarlas en cualquier momento sin necesidad de redeploy
- El Access Token nunca se expone al frontend; solo se usa server-side para crear preferencias y validar webhooks
- En el panel se muestran enmascaradas (como un campo de contraseña)

### Esquema de Base de Datos para Pagos

```sql
-- Configuración de pagos (separado o dentro de site_config)
payment_config (
  id UUID PRIMARY KEY,
  online_payments_enabled BOOLEAN DEFAULT false,
  mercadopago_access_token TEXT,  -- sensible, solo backend lee
  mercadopago_public_key TEXT,
  payment_instructions TEXT,      -- texto libre para pago manual
  updated_at TIMESTAMP
)

-- Control de acceso (ahora con método de pago)
course_access (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'denied'
  payment_method TEXT,           -- 'online' | 'manual'
  payment_note TEXT,             -- nota del usuario (pago manual)
  admin_note TEXT,               -- nota del admin (pago manual)
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
)

-- Transacciones de MercadoPago (solo pagos online)
transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'ARS',
  mercadopago_payment_id TEXT,
  mercadopago_preference_id TEXT,
  status TEXT, -- 'pending' | 'approved' | 'rejected'
  created_at TIMESTAMP DEFAULT now()
)
```

---

## Flujo de Usuario (Actualizado)

```
ANÓNIMO (sin login)
  ├─ Ver landing page con feed de publicaciones públicas
  ├─ Ver catálogo de cursos
  ├─ Ver meditaciones gratuitas
  ├─ Ver publicaciones públicas
  ├─ Click en contenido restringido → redirige a login
  
REGISTRADO (logueado, sin acceso a cursos)
  ├─ Perfil personal
  ├─ Ver meditaciones para registrados
  ├─ Ver publicaciones (todas)
  ├─ Solicitar/comprar curso: elige pago online o manual
  ├─ Ver estado de sus solicitudes (pendiente/aprobado/rechazado)
  
APROBADO (pago online confirmado O admin aprobó pago manual)
  ├─ Dashboard: mis cursos
  ├─ Acceso a contenido del curso
  ├─ Meditaciones premium (del curso)
  ├─ Progreso: documentos/videos/meditaciones vistas
```

### Configuración del Sitio (Panel Admin)
- Nombre: "Ananda para el Alma"
- Descripción/tagline
- Paleta de 3 colores (primario, secundario, acento) → dinámicos en toda la UI
- Logo: Imagen/SVG
- **Foto de profesora**: MUST-HAVE - prominente en landing, sidebar, perfil
- Email de contacto
- **Configuración de pagos** (online + manual, ver arriba)
- Links redes sociales (opcional)

### Seguridad
- Auth: NextAuth.js + Supabase
- Videos: YouTube iframe embebido, no URLs directas públicas
- Documentos: URLs temporales desde Supabase Storage (1h expiración)
- Publicaciones: Editable solo por admin
- Meditaciones: Control de visibilidad en DB
- Backend: Validación de acceso en cada API route
- RLS: Habilitado en Supabase
- MercadoPago Access Token: nunca expuesto al cliente, solo uso server-side
- Webhook de MercadoPago: validar firma/origen antes de procesar

## Stack Técnico
```
Frontend:  React 18 + Next.js 14 App Router + Tailwind CSS + TypeScript
Backend:   Next.js API routes
Database:  Supabase (PostgreSQL)
Auth:      NextAuth.js + Supabase
Payments:  MercadoPago (Checkout Pro) + Manual (admin aprueba)
Storage:   Supabase Storage
Deploy:    Vercel
```

## Estructura de Base de Datos (Completa)

```sql
-- USUARIOS
users (id, email, password_hash, name, role: admin|user, created_at, updated_at)

-- CURSOS
courses (id, title, description, price, currency: ARS|USD, cover_url, status: draft|published, created_by, created_at, updated_at)
modules (id, course_id, title, order, created_at, updated_at)
materials (id, module_id, title, type: document|video, document_url, video_url, order, created_at, updated_at)

-- MEDITACIONES
meditations (
  id, title, description, duration_minutes, video_url,
  type: free|premium,
  visibility: public|registered|course_restricted,
  course_id (nullable),
  order, created_at, updated_at
)

-- PUBLICACIONES
publications (
  id, title, content, image_url, excerpt,
  visibility: public|registered,
  category: meditacion|tarot|chamanismo|general,
  slug, created_by, published_at, updated_at,
  views (optional)
)

-- CONTROL DE ACCESO (HÍBRIDO)
course_access (id, user_id, course_id, status: pending|approved|denied, payment_method: online|manual, payment_note, admin_note, approved_at, created_at)

-- TRANSACCIONES (SOLO PAGOS ONLINE)
transactions (id, user_id, course_id, amount, currency, mercadopago_payment_id, mercadopago_preference_id, status, created_at)

-- CONFIG DEL SITIO
site_config (id, site_name, tagline, logo_url, professor_photo_url, color_primary, color_secondary, color_accent, contact_email, updated_at)

-- CONFIG DE PAGOS
payment_config (id, online_payments_enabled, mercadopago_access_token, mercadopago_public_key, payment_instructions, updated_at)
```

## Prioridad de Features (MVP)
1. ✅ Auth + DB setup
2. ✅ Admin CRUD cursos + módulos + materiales
3. ✅ Admin CRUD meditaciones
4. ✅ Admin CRUD publicaciones
5. ✅ Catálogo público (cursos + meditaciones + publicaciones)
6. ✅ Sistema de pago híbrido: MercadoPago online + manual con aprobación
7. ✅ Panel estudiante (ver contenido)
8. ✅ Configuración de pagos editable desde admin (sin redeploy)
9. ⏳ Progreso tracking (futuro)
10. ⏳ Email notificaciones (futuro)

## Rutas Principales

### Públicas
```
/                          Landing page + últimas publicaciones
/courses                   Catálogo de cursos
/courses/[id]              Detalle curso (con opciones de pago)
/meditaciones              Grid de meditaciones
/meditaciones/[id]         Detalle meditación
/publicaciones             Feed de publicaciones
/publicaciones/[slug]      Post individual
```

### Autenticación
```
/auth/login
/auth/register
```

### Checkout (NUEVO, simplificado)
```
/checkout/[courseId]              Elegir método de pago
/checkout/success                 Confirmación pago online aprobado
/checkout/pending                 Pago manual: esperar aprobación
```

### Área Estudiante (requiere acceso aprobado)
```
/student                   Dashboard
/student/courses/[id]      Contenido del curso
```

### Administrador (solo admin)
```
/admin                     Dashboard admin
/admin/settings            Configuración sitio + pagos
/admin/courses             CRUD cursos
/admin/meditaciones        CRUD meditaciones
/admin/publicaciones       CRUD publicaciones
/admin/users               Gestión usuarios + aprobación de pagos manuales
```

### API
```
/api/courses/*
/api/meditaciones/*
/api/publications/*
/api/course-access/*              (solicitar manual, aprobar/denegar)
/api/mercadopago/create-preference (crear preferencia de pago)
/api/mercadopago/webhook          (recibir confirmación de pago)
/api/payment-config/*             (admin: leer/actualizar credenciales MP)
/api/auth/*
```

## Notas Críticas
- **Foto profesora**: Prominente en landing (hero), sidebar, detalles, perfil. Ratio fijo, optimizada.
- **Tema dinámico**: 3 colores → CSS variables → UI se actualiza en tiempo real
- **Documentos**: NUNCA URLs directas; siempre temporal desde backend
- **YouTube**: iframe estándar, contexto plataforma, no salir a YouTube
- **Pagos**: Sistema HÍBRIDO. MercadoPago (online, automático) + Manual (admin aprueba). 
  Configuración 100% editable desde /admin/settings, sin tocar código.
- **MercadoPago durante desarrollo**: usar credenciales TEST- del desarrollador. 
  En producción, Natalia carga SUS PROPIAS credenciales (el dinero le llega a ella).
- **Meditaciones**: Videos cortos, thumbnails atractivos, controles de visibilidad granular
- **Publicaciones**: Feed tipo Instagram, rich text editor, imágenes optimizadas
- **Responsivo**: Móvil y desktop
- **Colores**: Sugerencia temática: dorados, índigos, cremas, terracota
- **Moneda**: Pesos argentinos (ARS) como default, configurable

## Instrucciones para Claude Code
1. Leer este archivo primero
2. Implementar TODO: cursos + meditaciones + publicaciones + sistema de pago híbrido + admin completo
3. Usar MercadoPago SDK oficial (Checkout Pro) para pagos online
4. El admin puede editar credenciales de MercadoPago y configuración de pagos desde /admin/settings (guardado en DB, no en .env)
5. El flujo de "compra" ofrece ambas opciones: online (automático) y manual (requiere aprobación admin)
6. Crear estructura profesional de carpetas
7. Código limpio: comentarios solo en títulos de funciones
8. README detallado con setup + deploy + cómo configurar MercadoPago
9. Validación en backend SIEMPRE
10. RLS en Supabase activado
11. Un único pass, código funcional

## Dominio
```
Principal: anandaparaelalma.com
Alternos: anandaparaelalma.store, anandaparaelalma.online
```

## Significado del Nombre
**Ananda** = Dicha, alegría, bienaventuranza (sánscrito)
**Para el Alma** = Destinado a la transformación espiritual personal