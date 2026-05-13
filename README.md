# AdminCSP

Admin standalone de la Copa Salvadorena de Programacion (CSP), preparado para ejecutarse y desplegarse como proyecto independiente.

Ruta principal:
- `/` redirige a `/admin`
- el panel sigue funcionando en `/admin`

## Stack

- Next.js (App Router)
- Firebase (`Auth` + `Firestore`)
- TypeScript
- Tailwind CSS

## Ejecutar localmente

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo local de entorno:

```bash
cp .env.example .env.local
```

3. Levanta el proyecto:

```bash
npm run dev
```

Abre:
- `http://localhost:3000/`
- `http://localhost:3000/admin`

## Variables de entorno

Definidas en `.env.example`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_SITE_URL=https://admin.copa.c3.com.sv
NEXT_PUBLIC_MAIN_SITE_URL=https://copa.c3.com.sv
UPLOADTHING_TOKEN=
```

Notas:
- `NEXT_PUBLIC_*` se usan para la configuracion del cliente Firebase.
- `UPLOADTHING_TOKEN` es opcional y solo se usa como diagnostico en la pagina de configuracion.

## Auth admin (Google + allowlist)

- El panel `/admin` usa **Google Sign-In**.
- Solo entra un usuario cuyo correo exista y este activo en la coleccion `admin_allowlist`.
- Roles permitidos en `admin_allowlist`:
  - `owner`: puede administrar la allowlist desde el panel.
  - `admin`: puede usar el panel, pero no administrar allowlist.

### Estructura recomendada de `admin_allowlist/{email_normalizado}`

```json
{
  "email": "owner@dominio.com",
  "role": "owner",
  "active": true,
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>",
  "createdBy": "owner@dominio.com",
  "updatedBy": "owner@dominio.com"
}
```

### Bootstrap inicial (obligatorio)

Antes de aplicar reglas estrictas:

1. Crea manualmente en Firebase Console el primer documento owner en `admin_allowlist`.
2. Usa el correo en minusculas como ID del documento.
3. Luego ingresa al panel y administra el resto de correos desde `/admin/autorizados`.

### Reglas de Firestore

Este repo incluye `firestore.rules` con estas politicas:

- `admin_allowlist`: lectura propia, listado/escritura solo para `owner`.
- `registrations`: `read`/`update` solo para admins autorizados.
- `registrations.create`: se mantiene abierto (`true`) para no romper flujo publico actual.

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de produccion
- `npm run start`: servidor de produccion
- `npm run lint`: lint con ESLint
- `npm run typecheck`: chequeo de tipos TypeScript

## Validacion recomendada

```bash
npm run lint
npm run typecheck
npm run build
```

## Despliegue (admin.copa.c3.com.sv)

- Build command: `npm run build`
- Start command: `npm run start`
- Dominio objetivo: `admin.copa.c3.com.sv`
- Configura todas las variables de entorno antes del build.

Si esta carpeta viene de otro repo, crea un repo nuevo para `AdminCSP` y apunta su `origin` al nuevo remoto antes de publicar
