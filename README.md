# Ananda para el Alma

Plataforma de contenido espiritual para Natalia Schwaderer — cursos, meditaciones y publicaciones con sistema de pago híbrido (MercadoPago + manual).

---

## Setup local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd ananda-para-el-alma
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completar los valores en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_SETUP_SECRET=una-clave-secreta-para-crear-admin
RESEND_API_KEY=re_...           # Requerido para recuperación de contraseña por email
SMTP_FROM=noreply@tudominio.com # Dirección remitente de los emails
```

> Las credenciales de MercadoPago NO van aquí. Se configuran desde `/admin/settings`.

### 3. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecutar `supabase/schema.sql`
3. En el SQL Editor, ejecutar `supabase/migration_redemption_codes.sql`
4. En el SQL Editor, ejecutar `supabase/migration_password_reset.sql`
5. En el SQL Editor, ejecutar `supabase/migration_audio_spotify.sql`
6. En Storage → New bucket: crear bucket `uploads` (público)
6. Copiar las claves a `.env.local`

### 4. Crear el primer usuario admin

Una vez que el servidor esté corriendo:

```bash
curl -X POST "http://localhost:3000/api/admin/create?secret=TU_ADMIN_SETUP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email": "natalia@tudominio.com", "password": "contraseña-segura", "name": "Natalia"}'
```

### 5. Iniciar el servidor

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Configurar MercadoPago desde el panel admin

1. Ingresar como admin en `/auth/login`
2. Ir a `/admin/settings` → pestaña "Pagos"
3. Activar "Habilitar pago online con MercadoPago"
4. Ingresar el Access Token y Public Key de tu cuenta de MercadoPago
   - Obtenerlos en: [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/credentials)
   - Para pruebas: usar las credenciales de **TEST** (no las productivas)
5. Completar las instrucciones de pago manual
6. Guardar

---

## Flujo de pagos

### Pago online (MercadoPago)
1. Usuario elige "Pagar online con MercadoPago" en `/checkout/[courseId]`
2. Backend crea preferencia usando credenciales de la DB
3. Usuario es redirigido a MercadoPago Checkout Pro
4. MercadoPago notifica el resultado via webhook (`/api/mercadopago/webhook`)
5. Si el pago es aprobado, se crea automáticamente el `course_access`

### Pago manual
1. Usuario elige "Pagar en efectivo o transferencia"
2. Ve las instrucciones de pago configuradas por el admin
3. Envía la solicitud (queda en estado `pending`)
4. Natalia revisa en `/admin/users` → "Solicitudes pendientes"
5. Aprueba o rechaza manualmente

---

## Estructura de roles

| Ruta | Acceso |
|------|--------|
| `/` | Público |
| `/courses` | Público |
| `/meditaciones` | Público (premium: registrado) |
| `/publicaciones` | Público (privadas: registrado) |
| `/auth/*` | Público |
| `/checkout/*` | Registrado |
| `/student/*` | Registrado con acceso aprobado |
| `/admin/*` | Solo admin |

---

## Deploy en Vercel

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. En Settings → Environment Variables, agregar las mismas variables de `.env.local` EXCEPTO:
   - NO agregar credenciales de MercadoPago (se configuran desde el panel admin)
3. Para producción, cambiar:
   - `NEXTAUTH_URL` → tu dominio real
   - `NEXT_PUBLIC_SITE_URL` → tu dominio real
4. Deploy en 1 click

---

## Testing checklist

- [ ] Registro/login funciona con email + contraseña
- [ ] Admin puede crear curso, meditación, publicación
- [ ] Admin puede subir portada (URL de imagen)
- [ ] Admin carga credenciales TEST de MercadoPago en `/admin/settings`
- [ ] Usuario solicita curso → ve las 2 opciones de pago
- [ ] Flujo online: redirige a MP, regresa a `/checkout/success`, da acceso automático
- [ ] Flujo manual: usuario solicita, aparece en `/admin/users`, admin aprueba
- [ ] Control de acceso: meditaciones premium requieren registro
- [ ] Control de acceso: publicaciones privadas requieren registro
- [ ] Tema dinámico: cambiar colores en `/admin/settings` → se aplica al instante
- [ ] Foto de la profesora visible en la landing

### Códigos de canje (libro físico)

- [ ] Admin crea código "TESTCODE" vinculado a 2 meditaciones con visibility=`code_restricted`
- [ ] Usuario logueado va a `/canjear`, ingresa "TESTCODE" → ve confirmación con las 2 meditaciones
- [ ] Esas 2 meditaciones son accesibles en `/meditaciones` y reproducibles
- [ ] El mismo usuario ingresa "TESTCODE" de nuevo → mensaje "Ya canjeaste este código anteriormente"
- [ ] Otro usuario (cuenta distinta) puede canjear "TESTCODE" por primera vez
- [ ] Admin desactiva el código → nuevos intentos fallan; accesos ya otorgados se mantienen
- [ ] Usuario sin canjear ve la meditación con badge "Bonus libro" pero recibe mensaje al clickear
- [ ] `/canjear` sin login redirige a `/auth/login?callbackUrl=/canjear`

---

## Tecnologías

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **NextAuth.js v4** (autenticación)
- **Supabase** (base de datos PostgreSQL)
- **MercadoPago SDK v3** (pagos online)
- **bcryptjs** (hash de contraseñas)
