import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, firebaseConfigDiagnostics, isFirebaseConfigured } from "@/lib/firebase";
import { MOCK_REGISTRATIONS } from "@/lib/mock-data";
import {
  RegistrationDocument,
  RegistrationDocumentMember,
  RegistrationFormData,
  RegistrationStatus,
  UploadedFileMetadata,
} from "@/lib/types";
import { removeUndefined } from "@/lib/removeUndefined";

const COLLECTION_NAME = "registrations";

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
    adminNotes: typeof data.adminNotes === "string" ? data.adminNotes : "",
    createdAt: toISODate(data.createdAt),
    updatedAt: toISODate(data.updatedAt),
  };
}

function getMockFallbackMessage() {
  return "Mostrando datos de prueba porque Firebase no esta configurado.";
}

export async function createRegistration(formData: RegistrationFormData): Promise<string> {
  if (!db || !isFirebaseConfigured) {
    const invalidKeys = firebaseConfigDiagnostics.invalidEnvKeys.join(", ");
    throw new Error(
      `Firebase no esta configurado correctamente. Revisa .env.local (${invalidKeys}).`,
    );
  }

  const missingMemberDoc = formData.members.some((member) => !member.studentIdFile?.fileUrl);
  if (missingMemberDoc) {
    throw new Error("Todos los miembros deben tener su documento subido.");
  }

  if (formData.category === "colegios" && !(formData.schoolImageConsentFiles ?? []).length) {
    throw new Error("Debes subir al menos un consentimiento para colegios.");
  }

  const registrationRef = doc(collection(db, COLLECTION_NAME));
  const registrationId = registrationRef.id;

  const rawPayload = {
    id: registrationId,
    category: formData.category,
    teamName: formData.teamName,
    institution: formData.institution,
    discoverySource: formData.discoverySource,
    discoverySourceOther: formData.discoverySourceOther ?? "",
    teamDescription: formData.teamDescription,
    teamOmegaUpUser: formData.teamOmegaUpUser,
    contactEmail: formData.contactEmail ?? "",
    members: formData.members.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      age: Number(member.age),
      email: member.email,
      whatsapp: member.whatsapp ?? "",
      career: member.career ?? "",
      universityYear: member.universityYear ?? "",
      schoolGrade: member.schoolGrade ?? "",
      about: member.about ?? "",
      linkedin: member.linkedin ?? "",
      studentIdFile: member.studentIdFile ?? null,
    })),
    responsible:
      formData.category === "colegios"
        ? {
            firstName: formData.responsible.firstName,
            lastName: formData.responsible.lastName,
            email: formData.responsible.email,
            phone: formData.responsible.phone,
            institution: formData.responsible.institution,
            role: formData.responsible.role,
            relationship: formData.responsible.relationship,
            comments: formData.responsible.comments ?? "",
          }
        : undefined,
    consents: {
      dataReviewAccepted: formData.dataReviewAccepted,
      privacyAccepted: formData.privacyAccepted,
      universityImageConsentAccepted: Boolean(formData.universityImageConsentAccepted),
      schoolImageConsentFiles: formData.schoolImageConsentFiles ?? [],
    },
    status: "recibida",
    adminNotes: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const cleanedPayload = removeUndefined(rawPayload);
  await setDoc(registrationRef, cleanedPayload);
  return registrationId;
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
) {
  if (!db || !isFirebaseConfigured) {
    throw new Error("No se puede actualizar estado: Firebase no esta configurado.");
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status,
    adminNotes,
    updatedAt: serverTimestamp(),
  });
}
