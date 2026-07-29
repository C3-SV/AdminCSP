import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  resolveRegistrationCompetitiveView,
  type DisplayCompetitivePhase,
  type DisplayCompetitiveStatus,
  type RegistrationCompetitiveView,
} from "@/lib/admin/registrationView";
import { buildEmailQueueDraft } from "@/services/admin/emailQueue";
import { MOCK_REGISTRATIONS } from "@/services/admin/mock-data";
import {
  CompetitivePhase,
  CompetitiveStatus,
  KnownRegistrationCategory,
  RegistrationCategory,
  RegistrationDocument,
  RegistrationDocumentMember,
  RegistrationStatus,
  Responsible,
  UploadedFileMetadata,
} from "@/types/admin/registration";

const COLLECTION_NAME = "registrations";

export {
  resolveRegistrationCompetitiveView,
  type DisplayCompetitivePhase,
  type DisplayCompetitiveStatus,
  type RegistrationCompetitiveView,
};

type UpdateRegistrationCompetitiveStateInput = {
  id: string;
  faseActual: CompetitivePhase;
  estadoCompetitivo: CompetitiveStatus;
  updatedBy?: string;
};

const KNOWN_CATEGORIES = new Set<KnownRegistrationCategory>([
  "colegios",
  "universidades",
  "ade",
]);
const REGISTRATION_STATUSES = new Set<RegistrationStatus>([
  "recibida",
  "en_revision",
  "aprobada",
  "rechazada",
  "pendiente_correccion",
]);
const COMPETITIVE_PHASES = new Set<CompetitivePhase>([
  "online",
  "presencial",
  "final",
  "cerrado",
]);
const COMPETITIVE_STATUSES = new Set<CompetitiveStatus>([
  "pendiente",
  "participando",
  "clasificado",
  "no_clasificado",
  "finalista",
  "ganador",
  "eliminado",
]);

type UpdateRegistrationScoresInput = {
  id: string;
  puntajeOnline?: number | null;
  puntajePresencial?: number | null;
  puntajeFinal?: number | null;
  rankingOnline?: number | null;
  rankingPresencial?: number | null;
  posicionFinal?: number | null;
  fechaPresencial?: string | null;
  sedePresencial?: string | null;
  updatedBy?: string;
};

function toISODate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return undefined;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapUploadthingMetadata(value: unknown): UploadedFileMetadata | undefined {
  if (!value || typeof value !== "object") return undefined;
  const file = value as Partial<UploadedFileMetadata>;
  if (!file.fileName || !file.fileUrl || !file.fileKey) return undefined;
  return {
    fileName: String(file.fileName),
    fileSize: Number(file.fileSize ?? 0),
    fileType: String(file.fileType ?? ""),
    fileUrl: String(file.fileUrl),
    fileKey: String(file.fileKey),
    uploadedAt: file.uploadedAt ? String(file.uploadedAt) : undefined,
    purpose: file.purpose,
    provider: "uploadthing",
  };
}

export function normalizeRegistrationCategory(value: unknown): RegistrationCategory {
  const rawValue = typeof value === "string" ? value.trim().toLowerCase() : "";
  return KNOWN_CATEGORIES.has(rawValue as KnownRegistrationCategory)
    ? (rawValue as KnownRegistrationCategory)
    : "desconocida";
}

function normalizeRegistrationStatus(value: unknown): RegistrationStatus {
  return REGISTRATION_STATUSES.has(value as RegistrationStatus)
    ? (value as RegistrationStatus)
    : "recibida";
}

function normalizeCompetitivePhase(value: unknown): CompetitivePhase | null {
  return COMPETITIVE_PHASES.has(value as CompetitivePhase)
    ? (value as CompetitivePhase)
    : null;
}

function normalizeCompetitiveStatus(value: unknown): CompetitiveStatus | null {
  return COMPETITIVE_STATUSES.has(value as CompetitiveStatus)
    ? (value as CompetitiveStatus)
    : null;
}

export function mapRegistrationFromFirestore(
  id: string,
  data: Record<string, unknown>,
): RegistrationDocument {
  const rawMembers = Array.isArray(data.members) ? data.members : [];
  const members: RegistrationDocumentMember[] = rawMembers
    .map((member, index): RegistrationDocumentMember => {
      const item = member as Record<string, unknown>;
      const ageNumber = typeof item.age === "number" ? item.age : Number(item.age ?? 0);

      return {
        id: typeof item.id === "string" && item.id ? item.id : `member-${index + 1}`,
        firstName: String(item.firstName ?? ""),
        lastName: String(item.lastName ?? ""),
        age: Number.isFinite(ageNumber) ? ageNumber : 0,
        email: String(item.email ?? ""),
        whatsapp: typeof item.whatsapp === "string" ? item.whatsapp : undefined,
        career: typeof item.career === "string" ? item.career : undefined,
        universityYear:
          typeof item.universityYear === "string" ? item.universityYear : undefined,
        schoolGrade: typeof item.schoolGrade === "string" ? item.schoolGrade : undefined,
        about: typeof item.about === "string" ? item.about : undefined,
        linkedin: typeof item.linkedin === "string" ? item.linkedin : undefined,
        studentIdFile: mapUploadthingMetadata(item.studentIdFile) ?? null,
      };
    });

  const responsibleRaw =
    typeof data.responsible === "object" && data.responsible !== null
      ? (data.responsible as Record<string, unknown>)
      : null;

  const consentsRaw =
    typeof data.consents === "object" && data.consents !== null
      ? (data.consents as Record<string, unknown>)
      : {};

  const schoolImageConsentFiles = Array.isArray(consentsRaw.schoolImageConsentFiles)
    ? consentsRaw.schoolImageConsentFiles
        .map((file) => mapUploadthingMetadata(file))
        .filter((file): file is UploadedFileMetadata => Boolean(file))
    : [];

  return {
    id,
    category: normalizeRegistrationCategory(data.category),
    rawCategory: typeof data.category === "string" ? data.category : undefined,
    teamName: String(data.teamName ?? ""),
    institution: String(data.institution ?? ""),
    discoverySource: (data.discoverySource as RegistrationDocument["discoverySource"]) ?? "",
    discoverySourceOther:
      typeof data.discoverySourceOther === "string" ? data.discoverySourceOther : undefined,
    teamDescription: String(data.teamDescription ?? ""),
    teamOmegaUpUser: String(data.teamOmegaUpUser ?? ""),
    contactEmail: typeof data.contactEmail === "string" ? data.contactEmail : undefined,
    members,
    responsible: responsibleRaw
      ? {
          firstName: String(responsibleRaw.firstName ?? ""),
          lastName: String(responsibleRaw.lastName ?? ""),
          email: String(responsibleRaw.email ?? ""),
          phone: String(responsibleRaw.phone ?? ""),
          institution: String(responsibleRaw.institution ?? ""),
          role: (responsibleRaw.role as Responsible["role"]) ?? "",
          relationship: String(responsibleRaw.relationship ?? ""),
          comments:
            typeof responsibleRaw.comments === "string" ? responsibleRaw.comments : undefined,
        }
      : undefined,
    consents: {
      dataReviewAccepted: Boolean(consentsRaw.dataReviewAccepted),
      privacyAccepted: Boolean(consentsRaw.privacyAccepted),
      universityImageConsentAccepted: Boolean(consentsRaw.universityImageConsentAccepted),
      schoolImageConsentFiles,
    },
    status: normalizeRegistrationStatus(data.status),
    faseActual: normalizeCompetitivePhase(data.faseActual),
    estadoCompetitivo: normalizeCompetitiveStatus(data.estadoCompetitivo),
    puntajeOnline: toNullableNumber(data.puntajeOnline),
    puntajePresencial: toNullableNumber(data.puntajePresencial),
    puntajeFinal: toNullableNumber(data.puntajeFinal),
    rankingOnline: toNullableNumber(data.rankingOnline),
    rankingPresencial: toNullableNumber(data.rankingPresencial),
    posicionFinal: toNullableNumber(data.posicionFinal),
    fechaPresencial: toNullableString(data.fechaPresencial),
    sedePresencial: toNullableString(data.sedePresencial),
    adminNotes: typeof data.adminNotes === "string" ? data.adminNotes : "",
    createdAt: toISODate(data.createdAt),
    updatedAt: toISODate(data.updatedAt),
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : undefined,
  };
}

function getMockFallbackMessage() {
  return "Mostrando datos de prueba porque Firebase no esta configurado.";
}

function buildAuditPayload(updatedBy?: string) {
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof updatedBy === "string" && updatedBy.trim()) {
    payload.updatedBy = updatedBy.trim().toLowerCase();
  }

  return payload;
}

export async function getRegistrations(): Promise<{
  registrations: RegistrationDocument[];
  usingMockData: boolean;
  message?: string;
}> {
  if (!db || !isFirebaseConfigured) {
    return {
      registrations: MOCK_REGISTRATIONS,
      usingMockData: true,
      message: getMockFallbackMessage(),
    };
  }

  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc")),
    );

    const registrations = querySnapshot.docs.map((snapshot) =>
      mapRegistrationFromFirestore(snapshot.id, snapshot.data()),
    );
    return { registrations, usingMockData: false };
  } catch (error) {
    console.error("Error al consultar inscripciones en Firestore:", error);
    return {
      registrations: [],
      usingMockData: false,
      message: "No se pudieron cargar las inscripciones reales. Revisa tu conexión o permisos.",
    };
  }
}

export async function getRegistrationsByCategory(category: KnownRegistrationCategory) {
  const response = await getRegistrations();
  return {
    ...response,
    registrations: response.registrations.filter(
      (registration) => registration.category === category,
    ),
  };
}

export async function getRegistrationById(
  id: string,
): Promise<{
  registration: RegistrationDocument | null;
  usingMockData: boolean;
  message?: string;
}> {
  if (!db || !isFirebaseConfigured) {
    return {
      registration: MOCK_REGISTRATIONS.find((item) => item.id === id) ?? null,
      usingMockData: true,
      message: getMockFallbackMessage(),
    };
  }

  try {
    const snapshot = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snapshot.exists()) {
      return { registration: null, usingMockData: false };
    }

    return {
      registration: mapRegistrationFromFirestore(snapshot.id, snapshot.data()),
      usingMockData: false,
    };
  } catch (error) {
    console.error("Error consultando inscripcion por ID:", error);
    return {
      registration: null,
      usingMockData: false,
      message: "No se pudo cargar la inscripción real. Revisa tu conexión o permisos.",
    };
  }
}

export async function updateRegistrationStatus(
  id: string,
  status: RegistrationStatus,
  adminNotes: string,
  updatedBy?: string,
) {
  if (!db || !isFirebaseConfigured) {
    throw new Error("No se puede actualizar estado: Firebase no esta configurado.");
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status,
    adminNotes,
    ...buildAuditPayload(updatedBy),
  });
}

export async function updateRegistrationCompetitiveState({
  id,
  faseActual,
  estadoCompetitivo,
  updatedBy,
}: UpdateRegistrationCompetitiveStateInput) {
  if (!db || !isFirebaseConfigured) {
    throw new Error(
      "No se puede actualizar fase competitiva: Firebase no esta configurado.",
    );
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    faseActual,
    estadoCompetitivo,
    ...buildAuditPayload(updatedBy),
  });
}

export async function updateRegistrationScores({
  id,
  puntajeOnline,
  puntajePresencial,
  puntajeFinal,
  rankingOnline,
  rankingPresencial,
  posicionFinal,
  fechaPresencial,
  sedePresencial,
  updatedBy,
}: UpdateRegistrationScoresInput) {
  if (!db || !isFirebaseConfigured) {
    throw new Error("No se puede actualizar puntajes: Firebase no esta configurado.");
  }

  const payload: Record<string, unknown> = {
    ...buildAuditPayload(updatedBy),
  };

  if (puntajeOnline !== undefined) payload.puntajeOnline = puntajeOnline;
  if (puntajePresencial !== undefined) payload.puntajePresencial = puntajePresencial;
  if (puntajeFinal !== undefined) payload.puntajeFinal = puntajeFinal;
  if (rankingOnline !== undefined) payload.rankingOnline = rankingOnline;
  if (rankingPresencial !== undefined) payload.rankingPresencial = rankingPresencial;
  if (posicionFinal !== undefined) payload.posicionFinal = posicionFinal;
  if (fechaPresencial !== undefined) payload.fechaPresencial = fechaPresencial;
  if (sedePresencial !== undefined) payload.sedePresencial = sedePresencial;

  await updateDoc(doc(db, COLLECTION_NAME, id), payload);
}

export async function normalizeRegistrationCompetitiveFields(
  registration: RegistrationDocument,
  updatedBy?: string,
) {
  if (!db || !isFirebaseConfigured) {
    return;
  }

  if (registration.status !== "aprobada") {
    return;
  }

  const payload: Record<string, unknown> = {};
  if (!registration.faseActual) {
    payload.faseActual = "online";
  }
  if (!registration.estadoCompetitivo) {
    payload.estadoCompetitivo = "participando";
  }

  if (!Object.keys(payload).length) {
    return;
  }

  await updateDoc(doc(db, COLLECTION_NAME, registration.id), {
    ...payload,
    ...buildAuditPayload(updatedBy),
  });
}

export function buildFutureStatusEmailQueueDraft(
  registration: RegistrationDocument,
  emailType: "classified_to_onsite" | "not_classified" | "finalist" | "winner",
  createdBy?: string,
) {
  const recipientEmail =
    registration.contactEmail ||
    registration.responsible?.email ||
    registration.members.find((member) => member.email)?.email ||
    "";
  const recipientName =
    registration.responsible?.firstName && registration.responsible.lastName
      ? `${registration.responsible.firstName} ${registration.responsible.lastName}`
      : registration.teamName;

  if (!recipientEmail) {
    return null;
  }

  return buildEmailQueueDraft({
    teamId: registration.id,
    teamName: registration.teamName,
    recipientEmail,
    recipientName,
    emailType,
    createdBy,
    params: {
      TEAM_NAME: registration.teamName,
      INSTITUTION: registration.institution,
      CATEGORY: registration.category,
    },
  });
}
