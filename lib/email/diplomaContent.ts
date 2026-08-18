import type { DiplomaPhase } from "@/lib/diplomas/teamDiplomas";
import { getDiplomaEmailScenario } from "@/lib/diplomas/diplomaEmailScenario";
import type { RegistrationDocument } from "@/types/admin/registration";

const COMMUNITY_C3_URL = "https://chat.whatsapp.com/FXy86Ay5B1wDTrqu4rg0R6";

type CommunityCallToAction = {
  title: string;
  description: string;
};

function escapeHtml(value: string) {
  return value.replace(/[<>&"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[character] ?? character);
}

/** Keeps real team names intact; only makes all-caps underscored import values readable. */
export function getDiplomaEmailTeamName(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "participante";
  if (!normalized.includes("_")) return normalized;

  const withSpaces = normalized.replace(/_/g, " ");
  if (!/^[A-ZÁÉÍÓÚÜÑ0-9\s-]+$/.test(withSpaces)) return withSpaces;

  return withSpaces
    .toLocaleLowerCase("es-SV")
    .replace(/(^|[\s-])([a-záéíóúüñ])/g, (_match, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase("es-SV")}`);
}

function communityText(callToAction: CommunityCallToAction) {
  return `${callToAction.title}\n\n${callToAction.description}\n\nSúmate y sigue siendo parte de lo que viene.\n\nUNIRME A COMUNIDAD C3: ${COMMUNITY_C3_URL}`;
}

function communityHtml(callToAction: CommunityCallToAction) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0;background:#edfafa;border:1px solid #a5e3db;border-radius:14px"><tr><td align="center" style="padding:26px 22px"><p style="margin:0 0 10px;color:#29225d;font-size:19px;font-weight:700;line-height:1.3">${escapeHtml(callToAction.title)}</p><p style="margin:0 0 22px;color:#34345b;font-size:15px;line-height:1.6">${escapeHtml(callToAction.description)}</p><a href="${COMMUNITY_C3_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#33BEAC;color:#ffffff;padding:14px 25px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.2px;text-decoration:none">UNIRME A COMUNIDAD C3</a></td></tr></table>`;
}

function getDiplomaEmailSubject(phase: DiplomaPhase) {
  return phase === "virtual"
    ? "Entrega de diplomas de Fase Virtual | Copa Salvadoreña de Programación"
    : "Entrega de diplomas de Final Presencial | Copa Salvadoreña de Programación";
}

function wrap(phase: DiplomaPhase, paragraphs: string[], callToAction?: CommunityCallToAction) {
  const textContent = [...paragraphs.slice(0, -1), ...(callToAction ? [communityText(callToAction)] : []), paragraphs.at(-1) ?? ""].join("\n\n");
  const introHtml = paragraphs
    .slice(0, -1)
    .map((paragraph) => `<p style="margin:0 0 18px">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
  const signatureHtml = `<p style="margin:0">${escapeHtml(paragraphs.at(-1) ?? "").replace(/\n/g, "<br />")}</p>`;

  return {
    subject: getDiplomaEmailSubject(phase),
    textContent,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Entrega de diplomas</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6">${introHtml}${callToAction ? communityHtml(callToAction) : ""}${signatureHtml}</td></tr></table></td></tr></table></body></html>`,
  };
}

function isCommunityAudience(registration: RegistrationDocument) {
  return registration.category === "universidades" || registration.category === "ade";
}

const GENERAL_COMMUNITY_CTA: CommunityCallToAction = {
  title: "🚀 Esto no termina con la Copa",
  description: "La Copa es solo uno de los espacios que construimos desde C3. Únanse a Comunidad C3 para seguir conectados con otros jóvenes de tecnología y conocer próximos eventos, competencias, hackathons y oportunidades.",
};

const CLASSIFIED_COMMUNITY_CTA: CommunityCallToAction = {
  title: "🚀 Y queremos que sigan siendo parte de C3",
  description: "La Copa es solo uno de los espacios que construimos. En Comunidad C3 podrán conectar con otros jóvenes de tecnología y enterarse de nuevos eventos, competencias, hackathons, oportunidades y actividades.",
};

export function buildDiplomaEmailContent(registration: RegistrationDocument, phase: DiplomaPhase) {
  const teamName = getDiplomaEmailTeamName(registration.teamName);
  const communityAudience = isCommunityAudience(registration);
  const scenario = getDiplomaEmailScenario(registration, phase);

  if (phase === "presencial") {
    const paragraphs = [
      `Hola, equipo ${teamName}:`,
      "¡Lo lograron! Después de superar la Fase Virtual y llegar hasta la Final Presencial, fueron parte de una jornada que reunió a jóvenes de distintas instituciones para competir, aprender y compartir alrededor de la programación.",
      "Queremos agradecerles por haber llegado hasta esta etapa y por ser parte de la Copa Salvadoreña de Programación 2026.",
      "Adjunto encontrarán los diplomas correspondientes a su participación en la Final Presencial, uno para cada integrante del equipo.",
      "Esperamos que se lleven mucho más que el resultado de una competencia: nuevos aprendizajes, retos, personas conocidas y ganas de seguir creciendo.",
      "Y queremos verlos celebrarlo. 🙌\nSi publican sus diplomas en redes sociales y etiquetan a C3, estaremos pendientes para compartirlos y darles visibilidad a su participación.",
      communityAudience
        ? "Gracias por competir, por aceptar el reto y por formar parte de esta edición. Esperamos volver a encontrarnos muy pronto en otro espacio de C3."
        : "Gracias por competir, por aceptar el reto y por formar parte de esta edición.",
      "Equipo C3\nCopa Salvadoreña de Programación 2026",
    ];
    return wrap(phase, paragraphs, communityAudience ? GENERAL_COMMUNITY_CTA : undefined);
  }

  if (scenario === "virtual_clasificado_final") {
    return wrap(phase, [
      `Hola, equipo ${teamName}:`,
      "¡Felicidades nuevamente! 🚀",
      "Completaron la Fase Virtual de la Copa Salvadoreña de Programación 2026 y consiguieron su lugar en la siguiente etapa.",
      "Adjunto a este correo encontrarán los diplomas de participación en la Fase Virtual de cada integrante del equipo, como reconocimiento por haber sido parte de esta primera etapa de la competencia.",
      "Pero su camino en la Copa todavía no termina.",
      "Nos vemos el próximo 5 de septiembre en la Final Presencial, donde volverán a competir junto a algunos de los mejores equipos universitarios de esta edición.",
      "Mientras llega la final, los invitamos también a compartir sus diplomas. Si los publican y etiquetan a C3, estaremos pendientes para compartir sus publicaciones y darles mayor visibilidad.",
      "Nos vemos muy pronto en la final. 💻🏆",
      "Equipo C3\nCopa Salvadoreña de Programación 2026",
    ], CLASSIFIED_COMMUNITY_CTA);
  }

  return wrap(phase, [
    `Hola, equipo ${teamName}:`,
    "¡Gracias por haber sido parte de la Copa Salvadoreña de Programación 2026! 💻",
    "Durante la Fase Virtual tuvieron la oportunidad de competir, enfrentarse a nuevos problemas y poner a prueba sus habilidades junto a equipos de diferentes instituciones del país.",
    "Hoy queremos dejarles también un recuerdo de esa experiencia.",
    "Adjunto a este correo encontrarán los diplomas de participación en la Fase Virtual de cada integrante del equipo.",
    "Esperamos que la Copa haya sido una oportunidad para aprender, retarse y seguir creciendo en programación.",
    "Y, por supuesto, ¡compártanlos! Si publican sus diplomas en LinkedIn, Instagram u otras redes y etiquetan a C3, estaremos pendientes para compartir sus publicaciones y darles mayor visibilidad.",
    "Gracias por aceptar el reto y ser parte de esta edición.",
    "Equipo C3\nCopa Salvadoreña de Programación 2026",
  ], communityAudience ? GENERAL_COMMUNITY_CTA : undefined);
}
