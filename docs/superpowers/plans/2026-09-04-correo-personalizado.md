# Correo personalizado desde admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que un administrador redacte, previsualice y envíe correos personalizados por Brevo con múltiples destinatarios y auditoría completa.

**Architecture:** Extender el cliente Brevo y el modelo de logs existentes; concentrar el parseo/validación en utilidades puras compartidas; crear un servicio server-only con el mismo outbox, interruptor global y modo sandbox de los flujos actuales; conectar una nueva página cliente protegida.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Firebase Admin/Firestore, Brevo API, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-correo-personalizado-design.md`

## Global Constraints

- No enviar correos reales durante implementación o pruebas.
- No agregar dependencias de editor.
- El remitente se obtiene exclusivamente de `BREVO_SENDER_EMAIL` y `BREVO_SENDER_NAME`.
- Reutilizar autorización admin, `emailOutbox`, `email_logs`, interruptor global y `CSP_EMAIL_DELIVERY_MODE`.
- No implementar borradores ni almacenar el cuerpo del correo.
- Mantener compatibles todos los flujos de correo existentes.

---

### Task 1: Parseo de destinatarios y contenido seguro

**Files:**
- Create: `tests/customEmail.test.ts`
- Create: `lib/email/customEmailRecipients.ts`
- Create: `lib/email/customEmailContent.ts`

**Interfaces:**
- Produces: `parseRecipientField(value: string): ParsedRecipientField`
- Produces: `resolveCustomEmailRecipients(input): ResolvedCustomEmailRecipients`
- Produces: `buildCustomEmailContent({ subject, content }): { subject, htmlContent, textContent }`

- [ ] **Step 1: Write failing tests** for separators, normalization, invalid addresses, cross-field deduplication, empty To, escaping HTML and supported formatting.
- [ ] **Step 2: Run** `npm.cmd test -- tests/customEmail.test.ts` and confirm failures are caused by missing modules.
- [ ] **Step 3: Implement minimal pure helpers** with explicit result types, safe URL schemes and central length limits.
- [ ] **Step 4: Run** `npm.cmd test -- tests/customEmail.test.ts` and confirm all cases pass.

### Task 2: Brevo multiple recipients and log mapping

**Files:**
- Modify: `tests/emailAndView.test.ts`
- Modify: `lib/email/sendBrevoEmail.ts`
- Modify: `types/admin/email.ts`
- Modify: `services/admin/serverVirtualInstructions.ts`
- Modify: `app/admin/correos/page.tsx`

**Interfaces:**
- Extends: `sendBrevoEmail({ to: BrevoRecipient | BrevoRecipient[], cc?, bcc?, ... })`
- Extends: `EmailLogType` with `custom`; `EmailLog` with `bcc` and optional team fields.

- [ ] **Step 1: Add a failing Brevo payload test** asserting multiple To, CC and BCC while retaining sandbox/idempotency headers.
- [ ] **Step 2: Run** `npm.cmd test -- tests/emailAndView.test.ts` and confirm the payload assertion fails.
- [ ] **Step 3: Extend Brevo input compatibly** and serialize BCC only when non-empty.
- [ ] **Step 4: Extend log mapping/history UI** with safe defaults, custom label and CC/CCO search.
- [ ] **Step 5: Run focused tests** and confirm existing single-recipient cases remain green.

### Task 3: Servicio idempotente y ruta protegida

**Files:**
- Extend: `tests/customEmail.test.ts`
- Create: `services/admin/serverCustomEmail.ts`
- Create: `app/api/admin/emails/custom/route.ts`
- Modify: `services/admin/adminMutations.ts`

**Interfaces:**
- Produces: `sendCustomEmailAsAdmin({ operationId, updatedBy, input, sendEmail? })`
- Produces: `sendCustomEmail({ user, operationId, to, cc, bcc, subject, content })`

- [ ] **Step 1: Add failing service tests** for successful dry-run, failed send metadata and duplicate operation behavior using injected dependencies or Firestore seams.
- [ ] **Step 2: Run focused tests** and confirm expected feature failures.
- [ ] **Step 3: Implement service** using `custom_<operationId>`, `assertEmailDeliveryEnabled`, fixed sender, sandbox, immutable log metadata and no stored body.
- [ ] **Step 4: Implement POST route** with admin auth and validation error status mapping.
- [ ] **Step 5: Add client mutation** and run focused tests.

### Task 4: Editor, preview and confirmation

**Files:**
- Create: `components/admin/email/CustomEmailEditor.tsx`
- Create: `app/admin/correo-personalizado/page.tsx`
- Modify: `lib/admin/routes.ts`
- Modify: `components/admin/layout/AdminSidebar.tsx`

**Interfaces:**
- Consumes: recipient/content helpers and `sendCustomEmail`.
- Produces: protected admin page at `/admin/correo-personalizado`.

- [ ] **Step 1: Add component-level pure helper tests** for toolbar insertion around a selection and confirmation readiness.
- [ ] **Step 2: Run focused tests** and confirm helpers are absent.
- [ ] **Step 3: Implement responsive form** with multiline recipient fields, read-only sender label, subject, toolbar, textarea and preview.
- [ ] **Step 4: Implement accessible confirmation modal** with delivery mode, counts, cancel/send actions and double-click protection.
- [ ] **Step 5: Add route and sidebar link** without changing existing navigation behavior.

### Task 5: Verification and regression review

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Run** `npm.cmd test` and require zero failures.
- [ ] **Step 2: Run** `npm.cmd run typecheck` and require exit code 0.
- [ ] **Step 3: Run** `npm.cmd run lint` and distinguish new errors from pre-existing warnings.
- [ ] **Step 4: Run** `npm.cmd run build` only if memory constraints allow; otherwise state it was intentionally omitted and rely on typecheck/tests.
- [ ] **Step 5: Inspect `git diff --check` and `git diff`** for secrets, accidental sends, stored message bodies and unrelated changes.
