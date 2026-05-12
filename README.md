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

Si esta carpeta viene de otro repo, crea un repo nuevo para `AdminCSP` y apunta su `origin` al nuevo remoto antes de publicar.
