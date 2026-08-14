import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { LABORATORY_OPTIONS } from "@/constants/admin";
import { COMPETITIVE_ACTIONS, CompetitiveActionKey } from "@/lib/admin/competitiveActions";
import { getAdminDb } from "@/lib/firebase/admin";
import { mapRegistrationFromFirestore } from "@/services/admin/registrations";
import {
  CompetitivePhase,
  CompetitiveStatus,
  RegistrationDocument,
  RegistrationStatus,
  LaboratoryAssignment,
} from "@/types/admin/registration";

const REGISTRATIONS_COLLECTION = "registrations";

export class AdminMutationError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function registrationRef(id: string) {
  return getAdminDb().collection(REGISTRATIONS_COLLECTION).doc(id);
}

function auditPayload(updatedBy: string) {
  return { updatedAt: FieldValue.serverTimestamp(), updatedBy };
}

function toRegistration(snapshot: FirebaseFirestore.DocumentSnapshot): RegistrationDocument {
  if (!snapshot.exists) throw new AdminMutationError("No se encontró el equipo solicitado.", 404);
  return mapRegistrationFromFirestore(snapshot.id, snapshot.data() ?? {});
}

async function readRegistration(id: string) {
  return toRegistration(await registrationRef(id).get());
}

export async function updateRegistrationStatusAsAdmin({
  id,
  status,
  adminNotes,
  updatedBy,
}: {
  id: string;
  status: RegistrationStatus;
  adminNotes: string;
  updatedBy: string;
}) {
  const ref = registrationRef(id);
  toRegistration(await ref.get());
  await ref.update({ status, adminNotes, ...auditPayload(updatedBy) });
  return readRegistration(id);
}

/**
 * Legacy endpoint retained for compatibility. Competitive actions now only
 * persist state; no action in this module sends an email or creates an outbox.
 */
export async function applyCompetitiveActionAsAdmin({
  id,
  action,
  updatedBy,
}: {
  id: string;
  action: CompetitiveActionKey;
  operationId?: string;
  updatedBy: string;
}) {
  const actionDefinition = COMPETITIVE_ACTIONS[action];
  const ref = registrationRef(id);
  toRegistration(await ref.get());
  await ref.update({
    faseActual: actionDefinition.faseActual,
    estadoCompetitivo: actionDefinition.estadoCompetitivo,
    ...auditPayload(updatedBy),
  });
  return { registration: await readRegistration(id), emailSent: false };
}

export async function updateRegistrationResultsAsAdmin({
  id,
  puntajeOnline,
  puntajePresencial,
  faseActual,
  estadoCompetitivo,
  updatedBy,
}: {
  id: string;
  puntajeOnline: number | null;
  puntajePresencial: number | null;
  faseActual: CompetitivePhase;
  estadoCompetitivo: CompetitiveStatus;
  updatedBy: string;
}) {
  const ref = registrationRef(id);
  toRegistration(await ref.get());
  await ref.update({
    puntajeOnline,
    puntajePresencial,
    faseActual,
    estadoCompetitivo,
    ...auditPayload(updatedBy),
  });
  return readRegistration(id);
}

export async function updateLaboratoryAssignmentAsAdmin({ id, laboratorioAsignado, updatedBy }: {
  id: string;
  laboratorioAsignado: LaboratoryAssignment | null;
  updatedBy: string;
}) {
  if (laboratorioAsignado !== null && !LABORATORY_OPTIONS.some(({ value }) => value === laboratorioAsignado)) {
    throw new AdminMutationError("El laboratorio seleccionado no es válido.", 422);
  }
  const ref = registrationRef(id);
  const registration = toRegistration(await ref.get());
  if (registration.estadoCompetitivo !== "clasificado") {
    throw new AdminMutationError("Sólo los equipos clasificados pueden tener un laboratorio asignado.", 422);
  }
  await ref.update({ laboratorioAsignado, ...auditPayload(updatedBy) });
  return readRegistration(id);
}
