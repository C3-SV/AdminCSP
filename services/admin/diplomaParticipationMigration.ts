import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

function participatedFromScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function completedVirtualResult(value: unknown) {
  return value === "clasificado" || value === "no_clasificado" || value === "finalista" || value === "ganador" || value === "eliminado";
}

/** Backfills only missing explicit flags; existing administrator decisions are never overwritten. */
export async function backfillDiplomaParticipation(updatedBy: string) {
  const snapshot = await getAdminDb().collection("registrations").get();
  const pending = snapshot.docs.flatMap((document) => {
    const data = document.data();
    const update: Record<string, unknown> = {};
    const virtualParticipationIsProven = participatedFromScore(data.puntajeOnline) || completedVirtualResult(data.estadoCompetitivo);
    if (virtualParticipationIsProven && data.participacionVirtual !== true) update.participacionVirtual = true;
    else if (typeof data.participacionVirtual !== "boolean") update.participacionVirtual = false;
    if (typeof data.participacionPresencial !== "boolean") update.participacionPresencial = participatedFromScore(data.puntajePresencial);
    return Object.keys(update).length ? [{ ref: document.ref, update }] : [];
  });
  for (let index = 0; index < pending.length; index += 400) {
    const batch = getAdminDb().batch();
    pending.slice(index, index + 400).forEach(({ ref, update }) => {
      batch.update(ref, { ...update, updatedAt: FieldValue.serverTimestamp(), updatedBy });
    });
    await batch.commit();
  }
  return { scanned: snapshot.size, updated: pending.length };
}
