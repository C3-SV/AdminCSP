import type { RegistrationDocument } from "@/types/admin/registration";

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export const FINAL_INSTRUCTIONS_SUBJECT = "Indicaciones finales para la Gran Final de la Copa 2026";

export function buildFinalInstructionsContent(registration: RegistrationDocument) {
  const teamName = registration.teamName.trim();
  const laboratory = registration.laboratorioAsignado?.trim();
  if (!teamName || !laboratory) throw new Error("El equipo necesita nombre y laboratorio asignado para generar las indicaciones finales.");
  const safeTeamName = escapeHtml(teamName);
  const safeLaboratory = escapeHtml(laboratory);
  return {
    subject: FINAL_INSTRUCTIONS_SUBJECT,
    textContent: `Hola, ${teamName}:

¡Estamos muy emocionados de conocerlos mañana!

Esperamos que estén listos para la Gran Final de la Copa Salvadoreña de Programación 2026, donde competirán junto a otros equipos clasificados y tendrán una nueva oportunidad de demostrar su talento técnico, trabajo en equipo y capacidad para resolver desafíos.

Queremos compartirles algunas indicaciones finales importantes para la jornada.

Llegada y registro

Los estaremos esperando desde las 7:15 a. m. en la zona de los auditorios de ESEN.

Ahí podrán registrarse, recibir su kit de bienvenida y recibir las últimas indicaciones antes de comenzar.

Laboratorio asignado

Su equipo competirá en:

${laboratory}

Sobre la competencia

Recuerden algunas condiciones importantes:

• competirán en equipos de 3 integrantes;
• cada equipo contará con una computadora;
• la competencia tendrá una duración de 3 horas;
• les recomendamos llegar todos juntos y con suficiente anticipación.

La agenda general de la jornada fue compartida previamente y también pueden consultarla en nuestras redes sociales.

Instagram: @c3.elsalvador

La jornada se extenderá aproximadamente hasta las 3:30 p. m., incluyendo las actividades posteriores y la premiación.

Estamos preparando esta final para que sea mucho más que únicamente la competencia: queremos que puedan conocer a otros participantes, compartir con personas de la comunidad y disfrutar toda la experiencia de la Copa.

Lleguen preparados, con energía y listos para competir.

¡Nos vemos mañana!

Equipo C3
Copa Salvadoreña de Programación 2026`,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">¡Nos vemos mañana en la Gran Final!</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6"><p>Hola, <strong>${safeTeamName}</strong>:</p><p>¡Estamos muy emocionados de conocerlos mañana!</p><p>Esperamos que estén listos para la <strong>Gran Final de la Copa Salvadoreña de Programación 2026</strong>, donde competirán junto a otros equipos clasificados y tendrán una nueva oportunidad de demostrar su talento técnico, trabajo en equipo y capacidad para resolver desafíos.</p><p>Queremos compartirles algunas <strong>indicaciones finales importantes para la jornada</strong>.</p><h2 style="margin:28px 0 10px;font-size:20px;color:#33247c">Llegada y registro</h2><p>Los estaremos esperando <strong>desde las 7:15 a. m. en la zona de los auditorios de ESEN</strong>.</p><p>Ahí podrán registrarse, recibir su kit de bienvenida y recibir las últimas indicaciones antes de comenzar.</p><h2 style="margin:28px 0 10px;font-size:20px;color:#33247c">Laboratorio asignado</h2><div style="margin:14px 0 24px;padding:18px;background:#eefbfa;border:1px solid #8adbd3;border-left:5px solid #17b6a7;border-radius:8px;text-align:center"><p style="margin:0 0 6px;font-size:14px;color:#5b5682">Su equipo competirá en:</p><p style="margin:0;font-size:22px;font-weight:bold;color:#33247c">${safeLaboratory}</p></div><h2 style="margin:28px 0 10px;font-size:20px;color:#33247c">Sobre la competencia</h2><p>Recuerden algunas condiciones importantes:</p><ul style="padding-left:24px"><li>competirán en equipos de 3 integrantes;</li><li>cada equipo contará con una computadora;</li><li>la competencia tendrá una duración de <strong>3 horas</strong>;</li><li>les recomendamos llegar todos juntos y con suficiente anticipación.</li></ul><p>La agenda general de la jornada fue compartida previamente y también pueden consultarla en nuestras redes sociales.</p><p><strong>Instagram:</strong> @c3.elsalvador</p><p>La jornada se extenderá aproximadamente hasta las <strong>3:30 p. m.</strong>, incluyendo las actividades posteriores y la premiación.</p><p>Estamos preparando esta final para que sea mucho más que únicamente la competencia: queremos que puedan conocer a otros participantes, compartir con personas de la comunidad y disfrutar toda la experiencia de la Copa.</p><p><strong>Lleguen preparados, con energía y listos para competir.</strong></p><div style="margin-top:24px;padding:16px;background:#33247c;color:#ffffff;border-radius:8px;text-align:center;font-size:18px;font-weight:bold">¡Nos vemos mañana!</div><p style="margin-top:28px">Equipo C3<br /><strong>Copa Salvadoreña de Programación 2026</strong></p></td></tr></table></td></tr></table></body></html>`,
  };
}
