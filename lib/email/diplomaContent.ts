import type { RegistrationDocument } from "@/types/admin/registration";
import type { DiplomaPhase } from "@/lib/diplomas/teamDiplomas";

const SUBJECT = "Entrega de diplomas | Copa Salvadoreña de Programación";

function escapeHtml(value: string) {
  return value.replace(/[<>&"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[character] ?? character);
}

function wrap(textContent: string) {
  const paragraphs = textContent.split(/\n\n/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`).join("");
  return {
    subject: SUBJECT,
    textContent,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Entrega de diplomas</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6">${paragraphs}</td></tr></table></td></tr></table></body></html>`,
  };
}

export function buildDiplomaEmailContent(registration: RegistrationDocument, phase: DiplomaPhase) {
  const teamName = registration.teamName.trim() || "participante";
  if (phase === "presencial") {
    return wrap(`Hola, equipo ${teamName}:

Muchas gracias por haber sido parte de la Final Presencial de la Copa Salvadoreña de Programación 2026.

Adjunto encontrarán los diplomas correspondientes a su participación en esta etapa de la competencia para cada integrante del equipo.

Fue un gusto contar con ustedes en esta edición y verlos formar parte de la experiencia presencial de la Copa.

Pueden compartir sus diplomas en redes sociales. Si nos etiquetan, con gusto estaremos compartiendo sus publicaciones desde C3 para darles mayor visibilidad.

Gracias por ser parte de la Copa Salvadoreña de Programación 2026.

Equipo C3
Copa Salvadoreña de Programación`);
  }
  if (registration.estadoCompetitivo === "clasificado" && !registration.participacionPresencial) {
    return wrap(`Hola, equipo ${teamName}:

¡Felicitaciones nuevamente por haber completado la Fase Virtual de la Copa Salvadoreña de Programación 2026!

Adjunto encontrarán los diplomas correspondientes a esta primera etapa de la competencia para cada integrante del equipo.

Su participación en la Copa continúa y nos alegra saber que estaremos viéndonos nuevamente en la Final Presencial.

Pueden compartir sus diplomas en redes sociales y etiquetar a C3. Con gusto estaremos dando visibilidad a sus publicaciones.

Nos vemos en la final.

Equipo C3
Copa Salvadoreña de Programación`);
  }
  return wrap(`Hola, equipo ${teamName}:

Muchas gracias por haber sido parte de la Copa Salvadoreña de Programación 2026.

Adjunto a este correo encontrarán los diplomas correspondientes a su participación en la Fase Virtual de la competencia.

Esperamos que esta experiencia haya sido una oportunidad para poner a prueba sus habilidades, aprender y seguir creciendo.

Pueden compartir sus diplomas en redes sociales. Si nos etiquetan, con gusto estaremos compartiendo también sus publicaciones desde C3 para darles mayor visibilidad.

Muchas gracias por ser parte de esta edición.

Equipo C3
Copa Salvadoreña de Programación`);
}
