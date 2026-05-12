# CSP Admin App (`admin` branch)

Standalone admin panel for Copa Salvadoreña de Programación (CSP), extracted from the original website repository.

Target deployment: **`admin.c3.com.sv`**

## What this branch contains

- Admin routes and UI only (`/admin`)
- Firebase Auth + Firestore integration used by the admin panel
- Mock fallback for registrations when Firebase env is missing/incomplete
- Root route (`/`) redirecting to the admin entry

## What was removed from the original site

- Public landing page and public registration flow
- Public headers/footers and registration form components
- Public upload API and upload UI helpers
- Public-only assets not used by admin

## What was kept because admin depends on it

- `app/admin/**` pages
- `components/admin/**` and admin-used `components/ui/**`
- Global styling (`app/globals.css`) and Tailwind/Next config
- Firebase bootstrap in `lib/firebase/**`
- CSP admin logo asset(s) used in login/sidebar

## Folder structure

```txt
app/
  admin/
  layout.tsx
  page.tsx                # redirects to admin route
components/
  admin/
    auth/
    layout/
  ui/
constants/
  admin/
lib/
  admin/
    routes.ts
  firebase/
services/
  admin/
types/
  admin/
utils/
  admin/
```

## Environment variables

Required (Firebase):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Domain integration:

- `NEXT_PUBLIC_MAIN_SITE_URL` (optional link target for the main public site)

Optional:

- `UPLOADTHING_TOKEN` (shown as optional diagnostic status in Admin > Configuración)

## Run locally

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000/` (redirects to admin)
- `http://localhost:3000/admin`

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Note: in restricted/offline environments, `next build` can fail if Google Fonts cannot be fetched.
