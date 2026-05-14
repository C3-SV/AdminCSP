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
import { buildEmailQueueDraft } from "@/services/admin/emailQueue";
import { MOCK_REGISTRATIONS } from "@/services/admin/mock-data";
import {
  CompetitivePhase,
  CompetitiveStatus,
  RegistrationCategory,
  RegistrationDocument,
  RegistrationDocumentMember,
  RegistrationStatus,
  UploadedFileMetadata,
} from "@/types/admin/registration";

const COLLECTION_NAME = "registrations";

export type DisplayCompetitivePhase = CompetitivePhase | "pendiente";
export type DisplayCompetitiveStatus = CompetitiveStatus | "pendiente";

export type RegistrationCompetitiveView = {
  faseActualMostrada: DisplayCompetitivePhase;
  estadoCompetitivoMostrado: DisplayCompetitiveStatus;
  defaultsAplicados: {
    faseActual: boolean;
    estadoCompetitivo: boolean;
  };
};

type UpdateRegistrationCompetitiveStateInput = {
  id: string;
  faseActual: CompetitivePhase;
  estadoCompetitivo: CompetitiveStatus;
  updatedBy?: string;
};

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

function emptyMember(index: number): RegistrationDocumentMember {
  return {
    id: `member-${index + 1}`,
    firstName: "",
    lastName: "",
    age: 0,
    email: "",
    linkedin: "",
    studentIdFile: null,
  };
}

function mapRegistrationFromFirestore(
  id: string,
  data: Record<string, unknown>,
): RegistrationDocument {
  const rawMembers = Array.isArray(data.members) ? data.members : [];
  const members: RegistrationDocumentMember[] = rawMembers
    .slice(0, 3)
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

  while (members.length < 3) {
    members.push(emptyMember(members.length));
  }

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
    category: (data.category as RegistrationDocument["category"]) ?? "colegios",
    teamName: String(data.teamName ?? ""),
    institution: String(data.institution ?? ""),
    discoverySource: (data.discoverySource as RegistrationDocument["discoverySource"]) ?? "",
    discoverySourceOther:
      typeof data.discoverySourceOther === "string" ? data.discoverySourceOther : undefined,
    teamDescription: String(data.teamDescription ?? ""),
    teamOmegaUpUser: String(data.teamOmegaUpUser ?? ""),
    contactEmail: typeof data.contactEmail === "string" ? data.contactEmail : undefined,
    members: members as RegistrationDocument["members"],
    responsible: {
      firstName: String((data.responsible as Record<string, unknown>)?.firstName ?? ""),
      lastName: String((data.responsible as Record<string, unknown>)?.lastName ?? ""),
      email: String((data.responsible as Record<string, unknown>)?.email ?? ""),
      phone: String((data.responsible as Record<string, unknown>)?.phone ?? ""),
      institution: String((data.responsible as Record<string, unknown>)?.institution ?? ""),
      role:
        ((data.responsible as Record<string, unknown>)?.role as RegistrationDocument["responsible"]["role"]) ??
        "",
      relationship: String((data.responsible as Record<string, unknown>)?.relationship ?? ""),
      comments:
        typeof (data.responsible as Record<string, unknown>)?.comments === "string"
          ? String((data.responsible as Record<string, unknown>)?.comments)
          : undefined,
    },
    consents: {
      dataReviewAccepted: Boolean(consentsRaw.dataReviewAccepted),
      privacyAccepted: Boolean(consentsRaw.privacyAccepted),
      universityImageConsentAccepted: Boolean(consentsRaw.universityImageConsentAccepted),
      schoolImageConsentFiles,
    },
    status: (data.status as RegistrationStatus) ?? "recibida",
    faseActual: (data.faseActual as CompetitivePhase | null | undefined) ?? null,
    estadoCompetitivo:
      (data.estadoCompetitivo as CompetitiveStatus | null | undefined) ?? null,
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

export function resolveRegistrationCompetitiveView(
  registration: RegistrationDocument,
): RegistrationCompetitiveView {
  const approved = registration.status === "aprobada";
  const hasStoredPhase = Boolean(registration.faseActual);
  const hasStoredStatus = Boolean(registration.estadoCompetitivo);

  if (!approved) {
    return {
      faseActualMostrada: "pendiente",
      estadoCompetitivoMostrado: "pendiente",
      defaultsAplicados: {
        faseActual: false,
        estadoCompetitivo: false,
      },
    };
  }

  return {
    faseActualMostrada: registration.faseActual ?? "online",
    estadoCompetitivoMostrado: registration.estadoCompetitivo ?? "participando",
    defaultsAplicados: {
      faseActual: !hasStoredPhase,
      estadoCompetitivo: !hasStoredStatus,
    },
  };
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
      registrations: MOCK_REGISTRATIONS,
      usingMockData: true,
      message: getMockFallbackMessage(),
    };
  }
}

export async function getRegistrationsByCategory(category: RegistrationCategory) {
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
      registration: MOCK_REGISTRATIONS.find((item) => item.id === id) ?? null,
      usingMockData: true,
      message: getMockFallbackMessage(),
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
    registration.responsible.email ||
    registration.members.find((member) => member.email)?.email ||
    "";
  const recipientName =
    registration.responsible.firstName && registration.responsible.lastName
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
