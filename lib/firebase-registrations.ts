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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  db,
  firebaseConfigDiagnostics,
  isFirebaseConfigured,
  storage,
} from "@/lib/firebase";
import { MOCK_REGISTRATIONS } from "@/lib/mock-data";
import {
  RegistrationDocument,
  RegistrationDocumentMember,
  RegistrationFormData,
  Responsible,
  RegistrationStatus,
  UploadedFileMetadata,
} from "@/lib/types";
import { TEMP_DISABLE_FILE_UPLOADS } from "@/lib/constants";
import { removeUndefined } from "@/lib/removeUndefined";

const COLLECTION_NAME = "registrations";

function toISODate(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

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

function emptyMember(index: number): RegistrationDocumentMember {
  return {
    id: `member-${index + 1}`,
    fullName: "",
    age: 0,
    email: "",
  };
}

function mapRegistrationFromFirestore(
  id: string,
  data: Record<string, unknown>,
): RegistrationDocument {
  const resolvedCategory =
    (data.category as RegistrationDocument["category"]) ?? "colegios";
  const rawMembers = Array.isArray(data.members) ? data.members : [];
  const members: RegistrationDocumentMember[] = rawMembers
    .slice(0, 3)
    .map((member, index): RegistrationDocumentMember => {
      const item = member as Record<string, unknown>;
      const ageNumber =
        typeof item.age === "number" ? item.age : Number(item.age ?? 0);
      return {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `member-${index + 1}`,
        fullName: String(item.fullName ?? ""),
        age: Number.isFinite(ageNumber) ? ageNumber : 0,
        email: String(item.email ?? ""),
        whatsapp: typeof item.whatsapp === "string" ? item.whatsapp : undefined,
        career: typeof item.career === "string" ? item.career : undefined,
        universityYear:
          typeof item.universityYear === "string"
            ? item.universityYear
            : undefined,
        schoolGrade:
          typeof item.schoolGrade === "string" ? item.schoolGrade : undefined,
        about: typeof item.about === "string" ? item.about : undefined,
        studentIdFileName:
          typeof item.studentIdFileName === "string"
            ? item.studentIdFileName
            : undefined,
        studentIdFileMetadata: item.studentIdFileMetadata as
          | UploadedFileMetadata
          | undefined,
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
    ? (consentsRaw.schoolImageConsentFiles as UploadedFileMetadata[])
    : [];

  return {
    id,
    category: resolvedCategory,
    teamName: String(data.teamName ?? ""),
    teamOmegaUpUser: String(data.teamOmegaUpUser ?? ""),
    institution: String(data.institution ?? ""),
    discoverySource: (data.discoverySource as RegistrationDocument["discoverySource"]) ?? "",
    discoverySourceOther:
      typeof data.discoverySourceOther === "string"
        ? data.discoverySourceOther
        : undefined,
    teamDescription: String(data.teamDescription ?? ""),
    contactEmail:
      typeof data.contactEmail === "string" ? data.contactEmail : undefined,
    members: members as RegistrationDocument["members"],
    responsible:
      resolvedCategory === "colegios"
        ? {
            fullName: String((data.responsible as Record<string, unknown>)?.fullName ?? ""),
            email: String((data.responsible as Record<string, unknown>)?.email ?? ""),
            phone: String((data.responsible as Record<string, unknown>)?.phone ?? ""),
            institution: String(
              (data.responsible as Record<string, unknown>)?.institution ?? "",
            ),
            role:
              ((data.responsible as Record<string, unknown>)?.role as
                | Responsible["role"]
                | "") ?? "",
            relationship: String(
              (data.responsible as Record<string, unknown>)?.relationship ?? "",
            ),
            comments:
              typeof (data.responsible as Record<string, unknown>)?.comments ===
              "string"
                ? String((data.responsible as Record<string, unknown>)?.comments)
                : undefined,
          }
        : undefined,
    consents: {
      dataReviewAccepted: Boolean(consentsRaw.dataReviewAccepted),
      privacyAccepted: Boolean(consentsRaw.privacyAccepted),
      universityImageConsentAccepted: Boolean(
        consentsRaw.universityImageConsentAccepted,
      ),
      schoolImageConsentFiles,
    },
    status: (data.status as RegistrationStatus) ?? "recibida",
    adminNotes: typeof data.adminNotes === "string" ? data.adminNotes : "",
    createdAt: toISODate(data.createdAt),
    updatedAt: toISODate(data.updatedAt),
  };
}

function getMockFallbackMessage() {
  return "Mostrando datos de prueba porque Firebase no está configurado.";
}

export async function uploadRegistrationFile(
  file: File,
  path: string,
): Promise<UploadedFileMetadata> {
  if (!storage) {
    throw new Error("Firebase Storage no está configurado.");
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    storagePath: path,
    downloadURL,
  };
}

export async function createRegistration(
  formData: RegistrationFormData,
): Promise<string> {
  if (!db || !isFirebaseConfigured) {
    const invalidKeys = firebaseConfigDiagnostics.invalidEnvKeys.join(", ");
    throw new Error(
      `Firebase no esta configurado correctamente. Revisa .env.local (${invalidKeys}).`,
    );
  }
  if (!TEMP_DISABLE_FILE_UPLOADS && !storage) {
    throw new Error("Firebase Storage no esta configurado.");
  }

  const registrationRef = doc(collection(db, COLLECTION_NAME));
  const registrationId = registrationRef.id;

  const memberMetadata: UploadedFileMetadata[] = [];
  if (!TEMP_DISABLE_FILE_UPLOADS) {
    for (let index = 0; index < formData.members.length; index += 1) {
      const member = formData.members[index];
      if (!member.studentIdFile) {
        throw new Error(`Falta el documento del miembro ${index + 1}.`);
      }

      const cleanName = member.studentIdFile.name.replace(/\s+/g, "-");
      const filePath = `registrations/${registrationId}/members/member-${index + 1}/${cleanName}`;
      const metadata = await uploadRegistrationFile(member.studentIdFile, filePath);
      memberMetadata.push(metadata);
    }
  }

  const consentMetadata: UploadedFileMetadata[] = [];
  if (!TEMP_DISABLE_FILE_UPLOADS) {
    for (let index = 0; index < (formData.schoolImageConsentFiles ?? []).length; index += 1) {
      const consentFile = formData.schoolImageConsentFiles?.[index];
      if (!consentFile) {
        continue;
      }

      const cleanName = consentFile.name.replace(/\s+/g, "-");
      const filePath = `registrations/${registrationId}/consents/${cleanName}`;
      const metadata = await uploadRegistrationFile(consentFile, filePath);
      consentMetadata.push(metadata);
    }
  }

  const rawPayload = {
    id: registrationId,
    category: formData.category,
    teamName: formData.teamName,
    teamOmegaUpUser: formData.teamOmegaUpUser,
    institution: formData.institution,
    discoverySource: formData.discoverySource,
    discoverySourceOther: formData.discoverySourceOther ?? "",
    teamDescription: formData.teamDescription,
    contactEmail: formData.contactEmail ?? "",
    members: formData.members.map((member, index) => ({
      id: member.id,
      fullName: member.fullName,
      age: Number(member.age),
      email: member.email,
      whatsapp: member.whatsapp ?? "",
      career: member.career ?? "",
      universityYear: member.universityYear ?? "",
      schoolGrade: member.schoolGrade ?? "",
      about: member.about ?? "",
      studentIdFileName: member.studentIdFile?.name ?? "",
      studentIdFileMetadata: memberMetadata[index],
    })),
    responsible:
      formData.category === "colegios" && formData.responsible
        ? {
            fullName: formData.responsible.fullName,
            email: formData.responsible.email,
            phone: formData.responsible.phone,
            institution: formData.responsible.institution,
            role: formData.responsible.role,
            relationship: formData.responsible.relationship,
            comments: formData.responsible.comments ?? "",
          }
        : null,
    consents: {
      dataReviewAccepted: formData.dataReviewAccepted,
      privacyAccepted: formData.privacyAccepted,
      universityImageConsentAccepted: Boolean(
        formData.universityImageConsentAccepted,
      ),
      schoolImageConsentFiles: consentMetadata,
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
    console.error("Error consultando inscripción por ID:", error);
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
    throw new Error("No se puede actualizar estado: Firebase no está configurado.");
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    status,
    adminNotes,
    updatedAt: serverTimestamp(),
  });
}
