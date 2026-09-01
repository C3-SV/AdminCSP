import { getFinalInstructionsConfig } from "@/lib/email/finalInstructionsConfig";
import type { RegistrationDocument } from "@/types/admin/registration";

export const FINAL_INSTRUCTIONS_SUBJECT = "Indicaciones finales para la Gran Final de la Copa 2026";

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function paragraph(value: string) {
  return `<p>${escapeHtml(value).replace(/\n/g, "<br />")}</p>`;
}

function sectionHeading(value: string) {
  return `<h2 style="margin:28px 0 10px;font-size:20px;color:#33247c">${escapeHtml(value)}</h2>`;
}

export function buildFinalInstructionsContent(registration: RegistrationDocument) {
  const config = registration.category === "desconocida" ? undefined : getFinalInstructionsConfig(registration.category);
  const teamName = registration.teamName.trim();
  const laboratory = registration.laboratorioAsignado?.trim();
  if (!config) throw new Error("Las indicaciones finales sólo están disponibles para Colegios, Universidades y AdE.");
  if (!teamName || !laboratory) throw new Error("El equipo necesita nombre y laboratorio asignado para generar las indicaciones finales.");

  const category = config.categoryLabel;
  const finalDate = config.finalDate;
  const arrival = `desde las ${config.arrivalTime} en ${config.arrivalLocation}`;
  const safeTeamName = escapeHtml(teamName);
  const safeLaboratory = escapeHtml(laboratory);
  const scheduleNotice = config.scheduleAttachment
    ? `Adjuntamos también el cronograma de la jornada para ${category}, con los horarios de registro, competencia, convivencia y premiación.`
    : "La agenda general de la jornada fue compartida previamente y también pueden consultarla en nuestras redes sociales.";

  const textContent = `Hola, ${teamName}:

¡Estamos muy emocionados de conocerlos mañana!

Esperamos que estén listos para la Gran Final de la Copa Salvadoreña de Programación 2026, donde competirán junto a otros equipos clasificados y tendrán una nueva oportunidad de demostrar su talento técnico, trabajo en equipo y capacidad para resolver desafíos.

Queremos compartirles algunas indicaciones finales importantes para la jornada.

Categoría: ${category}
Final presencial: ${finalDate}
Lugar: ESEN

Llegada y registro

Los estaremos esperando ${arrival}.

Ahí podrán registrarse, recibir su kit de bienvenida y recibir las últimas indicaciones antes de comenzar.

Laboratorio asignado

Su equipo competirá en:

${laboratory}

Sobre la competencia

Recuerden algunas condiciones importantes:

• competirán en sus equipos de 3 integrantes;
• cada equipo contará con una computadora;
• la competencia tendrá una duración de 4 horas;
• les recomendamos llegar todos juntos y con suficiente anticipación.

${scheduleNotice}

Instagram: @c3.elsalvador

La jornada se extenderá aproximadamente hasta las ${config.endTime}, incluyendo las actividades posteriores y la premiación.

Estamos preparando esta final para que sea mucho más que únicamente la competencia: queremos que puedan conocer a otros participantes, compartir con personas de la comunidad y disfrutar toda la experiencia de la Copa.

Lleguen preparados, con energía y listos para competir.

¡Nos vemos el ${finalDate}!

Equipo C3
Copa Salvadoreña de Programación 2026`;

  const htmlParts = textContent.split(/\n\n/).map((part) => {
    if (part === `Hola, ${teamName}:`) return `<p>Hola, <strong>${safeTeamName}</strong>:</p>`;
    if (["Llegada y registro", "Laboratorio asignado", "Sobre la competencia"].includes(part)) return sectionHeading(part);
    if (part.startsWith("• ")) return `<ul style="padding-left:24px">${part.split("\n").map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join("")}</ul>`;
    if (part === laboratory) return `<div style="margin:14px 0 24px;padding:18px;background:#eefbfa;border:1px solid #8adbd3;border-left:5px solid #17b6a7;border-radius:8px;text-align:center"><p style="margin:0 0 6px;font-size:14px;color:#5b5682">Su equipo competirá en:</p><p style="margin:0;font-size:22px;font-weight:bold;color:#33247c">${safeLaboratory}</p></div>`;
    if (part === `¡Nos vemos el ${finalDate}!`) return `<div style="margin:24px 0;padding:16px;background:#33247c;color:#ffffff;border-radius:8px;text-align:center;font-size:18px;font-weight:bold">${escapeHtml(part)}</div>`;
    return paragraph(part);
  }).join("");

  return {
    subject: FINAL_INSTRUCTIONS_SUBJECT,
    textContent,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">¡Nos vemos mañana en la Gran Final!</h1><p style="margin:14px 0 0;color:#ffffff;font-size:15px">${escapeHtml(category)} · ${escapeHtml(finalDate)}</p></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6">${htmlParts}</td></tr></table></td></tr></table></body></html>`,
    attachmentName: config.scheduleAttachment?.fileName,
    attachmentPath: config.scheduleAttachment?.relativePath,
  };
}
