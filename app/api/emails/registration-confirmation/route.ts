import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendBrevoEmail } from "@/lib/email/sendBrevoEmail";
import {
  getAllowedOrigins as getConfiguredAllowedOrigins,
  getRegistrationConfirmationEnvStatus,
} from "@/lib/email/registrationConfirmationDiagnostics";

export const runtime = "nodejs";

const REGISTRATIONS_COLLECTION = "registrations";
const EMAIL_OUTBOX_COLLECTION = "emailOutbox";
const TEMPLATE_KEY = "registration_confirmation";
const MAX_ATTEMPTS = 3;

type RegistrationPayload = Record<string, unknown>;
type OutboxStatus = "processing" | "sent" | "failed";
type RegistrationEmailTemplateMember = {
  TEAM_MEMBER_NAME: string;
};
type RegistrationEmailTemplateParams = {
  TEAM_NAME: string;
  OMEGAUP_USER: string;
  INSTITUTION: string;
  items: RegistrationEmailTemplateMember[];
  HAS_COACH: boolean;
  COACH_NAME: string;
};

type OutboxRecord = {
  eventId: string;
  registrationId: string;
  recipientEmail: string;
  recipientName: string;
  recipientType: "captain";
  templateKey: string;
  brevoTemplateId: number;
  payload: RegistrationEmailTemplateParams;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  idempotencyKey: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  sentAt?: unknown;
  brevoMessageId?: string;
  lastError?: string;
};

type LogLevel = "info" | "error";

function getRequestId(request: Request) {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id") ||
    request.headers.get("x-vercel-id")
  );
}

function logRegistrationEmailEvent(
  level: LogLevel,
  event: string,
  details: Record<string, unknown>,
) {
  const payload = {
    scope: "registration-confirmation-email",
    event,
    ...details,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };

  if (!origin) {
    return headers;
  }

  const allowedOrigins = getConfiguredAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function isOriginAllowed(origin: string | null) {
  if (!origin) return false;
  return getConfiguredAllowedOrigins().includes(origin);
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
) {
  return NextResponse.json(body, {
    status,
    headers: getCorsHeaders(origin),
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function combineName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function getMemberDisplayName(member: Record<string, unknown>) {
  return (
    combineName(getString(member.firstName), getString(member.lastName)) ||
    getString(member.name)
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toDisplayDate(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const dateObject = (value as { toDate: () => Date }).toDate();
    if (dateObject instanceof Date && !Number.isNaN(dateObject.valueOf())) {
      return dateObject.toISOString();
    }
  }

  return "fecha por confirmar";
}

function mapRegistrationEmailData(registration: RegistrationPayload) {
  const captain = asRecord(registration.captain);
  const responsible = asRecord(registration.responsible);
  const event = asRecord(registration.event);
  const team = asRecord(registration.team);
  const members = asArray(registration.members);
  const firstMember = asRecord(members[0]);

  const rawCaptainName =
    getString(captain.name) ||
    combineName(getString(captain.firstName), getString(captain.lastName)) ||
    combineName(getString(responsible.firstName), getString(responsible.lastName)) ||
    combineName(getString(firstMember.firstName), getString(firstMember.lastName));

  const captainEmail =
    getString(captain.email) ||
    getString(responsible.email) ||
    getString(registration.contactEmail) ||
    getString(firstMember.email);

  const eventId =
    getString(registration.eventId) ||
    getString(event.id) ||
    getString(registration.eventSlug) ||
    "csp";
  const eventName = getString(registration.eventName) || getString(event.name);
  const eventDate = toDisplayDate(registration.eventDate || event.date);
  const teamName = getString(registration.teamName) || getString(team.name);
  const omegaUpUser =
    getString(registration.teamOmegaUpUser) ||
    getString(team.omegaUpUser) ||
    getString(team.omegaupUser) ||
    getString(team.omega_up_user);
  const institution =
    getString(registration.institution) ||
    getString(team.institution) ||
    getString(responsible.institution);
  const items = members
    .map((member) => asRecord(member))
    .map((member) => getMemberDisplayName(member))
    .filter((memberName): memberName is string => Boolean(memberName))
    .slice(0, 4)
    .map((memberName) => ({
      TEAM_MEMBER_NAME: memberName,
    }));
  const coachName =
    combineName(getString(responsible.firstName), getString(responsible.lastName)) ||
    getString(responsible.name);
  const hasCoach = Boolean(coachName);
  const captainName = rawCaptainName || "Participante";

  const payload: RegistrationEmailTemplateParams = {
    TEAM_NAME: teamName,
    OMEGAUP_USER: omegaUpUser,
    INSTITUTION: institution,
    items,
    HAS_COACH: hasCoach,
    COACH_NAME: hasCoach ? coachName : "",
  };

  return {
    eventId,
    eventName,
    eventDate,
    teamName,
    omegaUpUser,
    institution,
    itemsCount: items.length,
    captainName,
    captainEmail: captainEmail.toLowerCase(),
    hasCaptainName: Boolean(rawCaptainName),
    hasTeamName: Boolean(teamName),
    hasOmegaUpUser: Boolean(omegaUpUser),
    hasValidMembers: items.length > 0,
    payload,
  };
}

function getBrevoTemplateId() {
  const rawTemplateId = process.env.BREVO_REGISTRATION_TEMPLATE_ID?.trim();
  if (!rawTemplateId) {
    throw new Error("Missing required environment variable: BREVO_REGISTRATION_TEMPLATE_ID");
  }

  const templateId = Number(rawTemplateId);
  if (!Number.isInteger(templateId) || templateId <= 0) {
    throw new Error("BREVO_REGISTRATION_TEMPLATE_ID must be a positive integer");
  }

  return templateId;
}

function getPublicErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unexpected error";
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({ ok: false, message: "Origin not allowed." }, 403, origin);
  }

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestId = getRequestId(request);
  const envStatus = getRegistrationConfirmationEnvStatus();

  logRegistrationEmailEvent("info", "request.received", {
    requestId,
    origin,
    envStatus,
  });

  if (origin && !isOriginAllowed(origin)) {
    logRegistrationEmailEvent("info", "request.blocked_origin", {
      requestId,
      origin,
    });
    return jsonResponse({ ok: false, message: "Origin not allowed." }, 403, origin);
  }

  let body: unknown;
  let outboxRefForError: DocumentReference | null = null;
  let registrationId = "";

  try {
    body = await request.json();
  } catch {
    logRegistrationEmailEvent("info", "request.invalid_json", {
      requestId,
      origin,
    });
    return jsonResponse({ ok: false, message: "Invalid JSON body." }, 400, origin);
  }

  const registrationIdValue = asRecord(body).registrationId;
  registrationId = typeof registrationIdValue === "string" ? registrationIdValue.trim() : "";
  logRegistrationEmailEvent("info", "request.parsed", {
    requestId,
    origin,
    registrationId,
  });

  if (!registrationId) {
    logRegistrationEmailEvent("info", "request.missing_registration_id", {
      requestId,
      origin,
    });
    return jsonResponse({ ok: false, message: "registrationId is required." }, 400, origin);
  }

  try {
    const db = getAdminDb();
    const registrationRef = db.collection(REGISTRATIONS_COLLECTION).doc(registrationId);
    const registrationSnapshot = await registrationRef.get();

    logRegistrationEmailEvent("info", "registration.lookup", {
      requestId,
      origin,
      registrationId,
      found: registrationSnapshot.exists,
    });

    if (!registrationSnapshot.exists) {
      return jsonResponse({ ok: false, message: "Registration not found." }, 404, origin);
    }

    const registrationData = registrationSnapshot.data() as RegistrationPayload;
    const templateId = getBrevoTemplateId();
    const mapped = mapRegistrationEmailData(registrationData);

    if (!mapped.captainEmail || !isValidEmail(mapped.captainEmail)) {
      logRegistrationEmailEvent("info", "registration.invalid_recipient_email", {
        requestId,
        origin,
        registrationId,
      });
      return jsonResponse(
        { ok: false, message: "Registration has no valid recipient email." },
        400,
        origin,
      );
    }

    if (!mapped.hasTeamName) {
      logRegistrationEmailEvent("info", "registration.missing_required_email_data", {
        requestId,
        origin,
        registrationId,
        missingField: "TEAM_NAME",
      });
      return jsonResponse(
        { ok: false, message: "Registration is missing TEAM_NAME." },
        400,
        origin,
      );
    }

    if (!mapped.hasOmegaUpUser) {
      logRegistrationEmailEvent("info", "registration.missing_required_email_data", {
        requestId,
        origin,
        registrationId,
        missingField: "OMEGAUP_USER",
      });
      return jsonResponse(
        { ok: false, message: "Registration is missing OMEGAUP_USER." },
        400,
        origin,
      );
    }

    if (!mapped.hasValidMembers) {
      logRegistrationEmailEvent("info", "registration.missing_required_email_data", {
        requestId,
        origin,
        registrationId,
        missingField: "items",
      });
      return jsonResponse(
        { ok: false, message: "Registration has no valid team members." },
        400,
        origin,
      );
    }

    const idempotencyKey = `${mapped.eventId}_${registrationId}_${TEMPLATE_KEY}`;
    const outboxRef = db.collection(EMAIL_OUTBOX_COLLECTION).doc(idempotencyKey);
    outboxRefForError = outboxRef;

    const transactionResult = await db.runTransaction(async (transaction) => {
      const now = FieldValue.serverTimestamp();
      const currentSnapshot = await transaction.get(outboxRef);
      const existing = currentSnapshot.exists
        ? (currentSnapshot.data() as Partial<OutboxRecord>)
        : null;

      if (existing?.status === "sent") {
        return { decision: "already_sent" as const };
      }

      if (existing?.status === "processing") {
        return { decision: "already_processing" as const };
      }

      if ((existing?.attempts ?? 0) >= MAX_ATTEMPTS) {
        return { decision: "max_attempts_reached" as const };
      }

      const attempts = (existing?.attempts ?? 0) + 1;
      const basePayload: OutboxRecord = {
        eventId: mapped.eventId,
        registrationId,
        recipientEmail: mapped.captainEmail,
        recipientName: mapped.captainName,
        recipientType: "captain",
        templateKey: TEMPLATE_KEY,
        brevoTemplateId: templateId,
        payload: mapped.payload,
        status: "processing",
        attempts,
        maxAttempts: MAX_ATTEMPTS,
        idempotencyKey,
      };

      if (!currentSnapshot.exists) {
        transaction.set(outboxRef, {
          ...basePayload,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        transaction.set(
          outboxRef,
          {
            ...basePayload,
            updatedAt: now,
          },
          { merge: true },
        );
      }

      return { decision: "send" as const };
    });

    logRegistrationEmailEvent("info", "outbox.transaction_decision", {
      requestId,
      origin,
      registrationId,
      decision: transactionResult.decision,
    });

    if (transactionResult.decision === "already_sent") {
      return jsonResponse(
        {
          ok: true,
          message: "Confirmation email was already sent.",
          alreadySent: true,
        },
        200,
        origin,
      );
    }

    if (transactionResult.decision === "already_processing") {
      return jsonResponse(
        {
          ok: true,
          message: "Confirmation email is already being processed.",
          processing: true,
        },
        202,
        origin,
      );
    }

    if (transactionResult.decision === "max_attempts_reached") {
      return jsonResponse(
        {
          ok: false,
          message: "Email retries limit reached.",
        },
        429,
        origin,
      );
    }

    logRegistrationEmailEvent("info", "brevo.send_attempt", {
      requestId,
      origin,
      registrationId,
      templateId,
      hasCoach: mapped.payload.HAS_COACH,
      itemsCount: mapped.itemsCount,
      recipientEmailDomain: mapped.captainEmail.split("@")[1] ?? null,
    });

    const brevoResponse = await sendBrevoEmail({
      to: {
        email: mapped.captainEmail,
        name: mapped.captainName,
      },
      templateId,
      params: mapped.payload,
    });

    await outboxRef.set(
      {
        status: "sent",
        brevoMessageId:
          typeof brevoResponse.messageId === "string" ? brevoResponse.messageId : null,
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastError: FieldValue.delete(),
      },
      { merge: true },
    );

    logRegistrationEmailEvent("info", "brevo.send_success", {
      requestId,
      origin,
      registrationId,
      messageId:
        typeof brevoResponse.messageId === "string" ? brevoResponse.messageId : null,
    });

    return jsonResponse({ ok: true, message: "Confirmation email sent." }, 200, origin);
  } catch (error) {
    const errorMessage = getPublicErrorMessage(error);

    logRegistrationEmailEvent("error", "request.failed", {
      requestId,
      origin,
      registrationId,
      errorMessage,
    });

    if (outboxRefForError) {
      await outboxRefForError.set(
        {
          status: "failed",
          lastError: errorMessage,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    return jsonResponse(
      { ok: false, message: "Failed to send confirmation email." },
      500,
      origin,
    );
  }
}
