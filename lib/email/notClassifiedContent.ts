import type { RegistrationDocument } from "@/types/admin/registration";

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export function getNotClassifiedSubject() {
  return "Gracias por ser parte de la Copa Salvadoreña de Programación 2026";
}

/** Editorial content reserved for all categories; no sending action is exposed yet. */
export function buildNotClassifiedContent(registration: RegistrationDocument) {
  const teamName = registration.teamName.trim();
  const textContent = `Hola, ${teamName}:

Queremos comenzar agradeciéndoles por haber participado en la fase virtual de la Copa Salvadoreña de Programación 2026.

Luego de revisar los resultados de esta etapa, en esta ocasión su equipo no avanzará a la final presencial.

Sabemos que enfrentarse a una competencia como esta implica preparación, trabajo en equipo y la disposición de poner a prueba lo que saben frente a nuevos problemas. Haber participado y completado esta fase forma parte de esa experiencia.

Esperamos que puedan aprovechar lo vivido durante la competencia para identificar qué salió bien, qué pueden fortalecer y qué nuevos retos quieren enfrentar a partir de ahora.

Desde C3 continuaremos compartiendo competencias, actividades, espacios de aprendizaje y otras oportunidades para jóvenes interesados en tecnología y programación, y esperamos poder volver a encontrarlos en ellas.

Esta vez el camino en la Copa termina aquí, pero esperamos volver a encontrarnos en nuevas competencias, actividades y espacios de C3.

Gracias por ser parte de esta edición.

Nos vemos en los próximos retos.

Equipo C3
Copa Salvadoreña de Programación 2026`;
  const paragraphs = textContent.split(/\n\n/).map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br />")}</p>`).join("");
  return {
    subject: getNotClassifiedSubject(),
    textContent,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Gracias por competir en la Copa 2026</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6">${paragraphs}</td></tr></table></td></tr></table></body></html>`,
  };
}
