import { getInstitutionDisplay } from "@/lib/admin/registrationPresentation";
import { ONSITE_FINALIST_CARD_CONFIG } from "@/lib/cards/onsiteFinalistCardLayout";
import type { RegistrationDocument } from "@/types/admin/registration";

export function getOnsiteClassificationSubject(teamName: string) {
  return `${teamName} · ¡Clasificaron a la final presencial de la Copa Salvadoreña de Programación 2026!`;
}

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&quot;", "'": "&#39;" })[character] ?? character);
}

export function buildOnsiteClassificationContent(registration: RegistrationDocument) {
  if (registration.category === "desconocida") throw new Error("La categoría del equipo no es válida.");
  const config = ONSITE_FINALIST_CARD_CONFIG[registration.category];
  const teamName = escapeHtml(registration.teamName);
  const institution = escapeHtml(getInstitutionDisplay(registration));
  const category = escapeHtml(config.categoryLabel);
  const date = escapeHtml(config.finalDate);
  return {
    subject: getOnsiteClassificationSubject(registration.teamName),
    textContent: `Hola, ${registration.teamName}:\n\n¡Felicidades! Su equipo ha clasificado a la final presencial de la Copa Salvadoreña de Programación 2026.\n\nParticiparán en la categoría ${config.categoryLabel}. La final presencial será el ${config.finalDate}. Próximamente compartiremos las indicaciones logísticas.\n\nAdjuntamos su tarjeta personalizada, lista para compartir en redes sociales.\n\n¡Nos emociona contar con ustedes en la final!`,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">¡Clasificaron a la final presencial!</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6"><p>Hola, <strong>${teamName}</strong>:</p><p>¡Felicidades! Su equipo ha clasificado a la <strong>final presencial</strong> de la Copa Salvadoreña de Programación 2026.</p><div style="margin:24px 0;padding:18px;background:#f4f5ff;border-left:4px solid #17b6a7"><p style="margin:0 0 8px"><strong>Categoría:</strong> ${category}</p><p style="margin:0"><strong>Final presencial:</strong> ${date}</p></div><p>Representarán a <strong>${institution}</strong>. Próximamente compartiremos las indicaciones logísticas de la jornada.</p><p>Adjuntamos su tarjeta personalizada, lista para compartir en redes sociales. Pueden etiquetarnos como <strong>@c3.elsalvador</strong> y mencionar a la Copa Salvadoreña de Programación.</p><p>¡Nos emociona contar con ustedes en la final!</p></td></tr></table></td></tr></table></body></html>`,
  };
}
