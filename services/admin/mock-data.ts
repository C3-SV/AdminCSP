import { RegistrationDocument, UploadedFileMetadata } from "@/types/admin/registration";

function buildStudentFile(name: string): UploadedFileMetadata {
  return {
    fileName: name,
    fileSize: 1250000,
    fileType: "application/pdf",
    fileUrl: `https://example.com/mock/${name}`,
    fileKey: `mock-key-${name.replaceAll(".", "-")}`,
    uploadedAt: "2026-03-12T10:00:00.000Z",
    purpose: "student-id",
    provider: "uploadthing",
  };
}

function buildConsentFile(name: string): UploadedFileMetadata {
  return {
    fileName: name,
    fileSize: 980000,
    fileType: "application/pdf",
    fileUrl: `https://example.com/mock/${name}`,
    fileKey: `mock-key-${name.replaceAll(".", "-")}`,
    uploadedAt: "2026-03-12T10:00:00.000Z",
    purpose: "image-consent",
    provider: "uploadthing",
  };
}

function buildMember(
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  extra: { career?: string; universityYear?: string; schoolGrade?: string; linkedin?: string },
) {
  return {
    id,
    firstName,
    lastName,
    age: 17,
    email,
    whatsapp: "+503 7000-0000",
    career: extra.career,
    universityYear: extra.universityYear,
    schoolGrade: extra.schoolGrade,
    linkedin: extra.linkedin,
    about: "Participante activo en clubes de programacion.",
    studentIdFile: buildStudentFile(`carnet-${id}.pdf`),
  };
}

export const MOCK_REGISTRATIONS: RegistrationDocument[] = [
  {
    id: "mock-binary-brains",
    category: "colegios",
    teamName: "Binary Brains",
    institution: "Colegio San Francisco",
    discoverySource: "profesor",
    teamDescription: "Equipo de olimpiadas de informatica.",
    teamOmegaUpUser: "binarybrains_sanfrancisco",
    members: [
      buildMember("member-1", "Ana", "Lopez", "ana@colegio.edu.sv", {
        schoolGrade: "Segundo anio de bachillerato",
      }),
      buildMember("member-2", "Jose", "Perez", "jose@colegio.edu.sv", {
        schoolGrade: "Segundo anio de bachillerato",
      }),
      buildMember("member-3", "Maria", "Hernandez", "maria@colegio.edu.sv", {
        schoolGrade: "Primer anio de bachillerato",
      }),
    ],
    responsible: {
      firstName: "Lic. Claudia",
      lastName: "Molina",
      email: "claudia.molina@colegio.edu.sv",
      phone: "+503 7100-0001",
      institution: "Colegio San Francisco",
      role: "docente",
      relationship: "Entrenadora del club de informatica",
      comments: "Equipo con experiencia en competencias nacionales.",
    },
    contactEmail: "club.programacion@colegio.edu.sv",
    consents: {
      dataReviewAccepted: true,
      privacyAccepted: true,
      schoolImageConsentFiles: [
        buildConsentFile("consentimiento-1.pdf"),
        buildConsentFile("consentimiento-2.pdf"),
        buildConsentFile("consentimiento-3.pdf"),
      ],
    },
    status: "aprobada",
    adminNotes: "Validacion completa de documentos.",
    createdAt: "2026-03-12T10:00:00.000Z",
    updatedAt: "2026-03-13T10:00:00.000Z",
  },
  {
    id: "mock-code-ninja-u",
    category: "universidades",
    teamName: "Code Ninja U",
    institution: "Universidad Tecnologica",
    discoverySource: "linkedin",
    teamDescription: "Equipo universitario centrado en programacion competitiva.",
    teamOmegaUpUser: "codeninjau_utec",
    members: [
      buildMember("member-1", "Carlos", "Rivera", "carlos@utec.edu.sv", {
        career: "Ingenieria en Sistemas",
        universityYear: "4to anio",
        linkedin: "https://www.linkedin.com/in/carlos-rivera-utec",
      }),
      buildMember("member-2", "Lucia", "Chavez", "lucia@utec.edu.sv", {
        career: "Ingenieria en Sistemas",
        universityYear: "3er anio",
        linkedin: "https://www.linkedin.com/in/lucia-chavez-utec",
      }),
      buildMember("member-3", "Kevin", "Ramos", "kevin@utec.edu.sv", {
        career: "Ingenieria en Software",
        universityYear: "2do anio",
      }),
    ],
    responsible: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      institution: "",
      role: "",
      relationship: "",
      comments: "",
    },
    contactEmail: "club.acm@utec.edu.sv",
    consents: {
      dataReviewAccepted: true,
      privacyAccepted: true,
      universityImageConsentAccepted: true,
      schoolImageConsentFiles: [],
    },
    status: "en_revision",
    adminNotes: "Pendiente revisar un carnet.",
    createdAt: "2026-04-15T08:30:00.000Z",
    updatedAt: "2026-04-16T12:00:00.000Z",
  },
  {
    id: "mock-logic-gate",
    category: "colegios",
    teamName: "Logic Gate",
    institution: "Instituto Nacional",
    discoverySource: "institucion",
    teamDescription: "Equipo emergente con enfoque en algoritmos.",
    teamOmegaUpUser: "logicgate_instituto",
    members: [
      buildMember("member-1", "Daniel", "Martinez", "daniel@instituto.edu.sv", {
        schoolGrade: "Primer anio de bachillerato",
      }),
      buildMember("member-2", "Fernanda", "Diaz", "fernanda@instituto.edu.sv", {
        schoolGrade: "Primer anio de bachillerato",
      }),
      buildMember("member-3", "Ricardo", "Torres", "ricardo@instituto.edu.sv", {
        schoolGrade: "Segundo anio de bachillerato",
      }),
    ],
    responsible: {
      firstName: "Prof. Mario",
      lastName: "Aguilar",
      email: "mario.aguilar@instituto.edu.sv",
      phone: "+503 7100-0003",
      institution: "Instituto Nacional",
      role: "docente",
      relationship: "Docente asesor del equipo",
      comments: "",
    },
    consents: {
      dataReviewAccepted: true,
      privacyAccepted: true,
      schoolImageConsentFiles: [
        buildConsentFile("consentimiento-a.pdf"),
        buildConsentFile("consentimiento-b.pdf"),
      ],
    },
    status: "recibida",
    adminNotes: "",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "mock-runtime-terror",
    category: "universidades",
    teamName: "Runtime Terror",
    institution: "Universidad de El Salvador",
    discoverySource: "omegaup",
    teamDescription: "Equipo especializado en retos de estructuras de datos.",
    teamOmegaUpUser: "runtimeterror_ues",
    members: [
      buildMember("member-1", "Andrea", "Pineda", "andrea@ues.edu.sv", {
        career: "Licenciatura en Computacion",
        universityYear: "5to anio",
        linkedin: "https://www.linkedin.com/in/andrea-pineda-ues",
      }),
      buildMember("member-2", "Javier", "Moreno", "javier@ues.edu.sv", {
        career: "Ingenieria en Sistemas",
        universityYear: "4to anio",
      }),
      buildMember("member-3", "Paola", "Ruiz", "paola@ues.edu.sv", {
        career: "Ingenieria en Sistemas",
        universityYear: "4to anio",
      }),
    ],
    responsible: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      institution: "",
      role: "",
      relationship: "",
      comments: "",
    },
    consents: {
      dataReviewAccepted: true,
      privacyAccepted: true,
      universityImageConsentAccepted: true,
      schoolImageConsentFiles: [],
    },
    status: "rechazada",
    adminNotes: "No cumple con requisitos documentales de un integrante.",
    createdAt: "2026-08-15T11:10:00.000Z",
    updatedAt: "2026-08-15T13:50:00.000Z",
  },
  {
    id: "mock-syntax-error",
    category: "universidades",
    teamName: "Syntax Error",
    institution: "Universidad Don Bosco",
    discoverySource: "instagram",
    teamDescription: "Equipo con interes en maratones de programacion.",
    teamOmegaUpUser: "syntaxerror_udb",
    members: [
      buildMember("member-1", "Sofia", "Calderon", "sofia@udb.edu.sv", {
        career: "Ingenieria en Ciencias de la Computacion",
        universityYear: "3er anio",
        linkedin: "https://www.linkedin.com/in/sofia-calderon-udb",
      }),
      buildMember("member-2", "Miguel", "Lopez", "miguel@udb.edu.sv", {
        career: "Ingenieria en Sistemas",
        universityYear: "2do anio",
      }),
      buildMember("member-3", "Valeria", "Molina", "valeria@udb.edu.sv", {
        career: "Ingenieria en Software",
        universityYear: "2do anio",
      }),
    ],
    responsible: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      institution: "",
      role: "",
      relationship: "",
      comments: "",
    },
    consents: {
      dataReviewAccepted: true,
      privacyAccepted: true,
      universityImageConsentAccepted: true,
      schoolImageConsentFiles: [],
    },
    status: "pendiente_correccion",
    adminNotes: "Enviar actualizacion de documento del capitan.",
    createdAt: "2026-08-29T16:20:00.000Z",
    updatedAt: "2026-08-30T09:15:00.000Z",
  },
];
