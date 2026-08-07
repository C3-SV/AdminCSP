import { ONSITE_FINALIST_CARD_CONFIG } from "@/lib/cards/onsiteFinalistCardLayout";
import type { RegistrationDocument } from "@/types/admin/registration";

const SCHOOL_ATTENDANCE_FORM_URL = "https://forms.gle/92Z6q2gLSaN2aq9u9";

export function getOnsiteClassificationSubject(teamName: string) {
  // Se conserva el asunto que ya utiliza el flujo actual.
  return `${teamName} · ¡Clasificaron a la final presencial de la Copa Salvadoreña de Programación 2026!`;
}

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function paragraph(value: string) {
  return `<p>${escapeHtml(value).replace(/\n/g, "<br />")}</p>`;
}

function sectionHeading(value: string) {
  return `<h2 style="margin:28px 0 10px;font-size:20px;color:#33247c">${escapeHtml(value)}</h2>`;
}

export function buildOnsiteClassificationContent(registration: RegistrationDocument) {
  if (registration.category === "desconocida") throw new Error("La categoría del equipo no es válida.");
  const config = ONSITE_FINALIST_CARD_CONFIG[registration.category];
  const teamName = registration.teamName.trim();
  const category = config.categoryLabel;
  const date = config.finalDate;
  const isSchool = registration.category === "colegios";
  const isAdE = registration.category === "ade";

  const textContent = isSchool
    ? `Hola, ${teamName}:

¡Felicidades! Su desempeño en la fase virtual les permitió asegurar un lugar en la final presencial de la Copa Salvadoreña de Programación 2026.

Llegar hasta aquí significa que lograron destacar entre los equipos participantes y ganarse un cupo para seguir compitiendo. Queremos reconocer el esfuerzo, la lógica, el trabajo en equipo y la dedicación que demostraron durante esta primera etapa.

Categoría: ${category}
Final presencial: sábado 15 de agosto de 2026
Lugar: ESEN

Y ahora sí: ¡la final es este sábado!

Los estaremos esperando desde las 7:15 a. m. para iniciar el proceso de llegada y acreditación. Les recomendamos organizarse con tiempo y procurar llegar con anticipación para comenzar la jornada con tranquilidad.

Faltan pocos días, así que los animamos a seguir practicando, organizarse como equipo y llegar preparados para una nueva experiencia: competir presencialmente, conocer a otros participantes y poner nuevamente a prueba sus habilidades.

Confirmen su asistencia

Para ayudarnos a preparar la jornada, necesitamos que completen el siguiente formulario y nos confirmen la asistencia de su equipo.

También pueden acompañarlos padres de familia, familiares, amigos o docentes. Cada integrante del equipo podrá registrar un máximo de 2 acompañantes.

Les pedimos que indiquen en el formulario cuántas personas los acompañarán y sus datos. Esta confirmación es importante para que podamos organizar adecuadamente los espacios y la logística del evento.

[CONFIRMAR ASISTENCIA]
[LINK DEL FORMULARIO]

Muy pronto también recibirán las indicaciones logísticas completas de la jornada, incluyendo horarios, acreditación y demás información importante para la final.

Compartan que van a la final

Adjuntamos dos tarjetas personalizadas de su equipo:

una versión para publicación, ideal para Instagram o LinkedIn;
una versión para historia, lista para compartir en Instagram Stories.

Los invitamos a compartir este logro y celebrar que estarán en la final.

Pueden etiquetarnos en:

Instagram: @c3.elsalvador
LinkedIn: C3 – Competitive Coding Club

También pueden mencionar a la Copa Salvadoreña de Programación, su institución y a los patrocinadores y aliados que hacen posible esta edición.

Nos emociona recibirlos este sábado y verlos competir nuevamente.

Disfruten este logro, sigan preparándose y lleguen listos para dar lo mejor de ustedes. ¡Nos vemos en la final!

Equipo C3
Copa Salvadoreña de Programación 2026`
    : `Hola, ${teamName}:

¡Felicidades! Su desempeño durante la fase virtual les permitió avanzar a la final presencial de la Copa Salvadoreña de Programación 2026.

Clasificar significa haber destacado entre los equipos participantes y ganarse un lugar para continuar en la competencia. Queremos reconocer el trabajo, la constancia y las habilidades que demostraron durante esta primera etapa.

Categoría: ${category}
Final presencial: sábado 5 de septiembre de 2026
Lugar: ESEN

Ahora comienza una nueva etapa.

Tienen prácticamente un mes para seguir aprendiendo y preparándose, así que los invitamos a aprovechar este tiempo para practicar, revisar temas, resolver nuevos problemas y fortalecer su estrategia como equipo.

La fase virtual fue solo el comienzo. La final presencial será una oportunidad para volver a competir, conocer a otros equipos y vivir una experiencia distinta alrededor de la programación competitiva.

Más adelante les enviaremos todas las indicaciones logísticas de la jornada, incluyendo horarios, llegada, acreditación y demás información necesaria.

Esto no termina aquí

Durante las próximas semanas seguiremos en comunicación con ustedes.

Además de la final, desde C3 estamos preparando otras actividades, espacios y oportunidades para que puedan seguir compitiendo, aprendiendo, construyendo y conectándose con otras personas de la comunidad tecnológica.

Queremos que esta Copa sea también una puerta para que puedan seguir formando parte de lo que viene.

Compartan su clasificación

Adjuntamos dos tarjetas personalizadas de su equipo:

una versión para publicación, ideal para Instagram o LinkedIn;
una versión para historia, lista para Instagram Stories.

Los invitamos a compartir que estarán en la final y celebrar este resultado.

Pueden etiquetarnos en:

Instagram: @c3.elsalvador
LinkedIn: C3 – Competitive Coding Club

${isAdE ? "También pueden mencionar a la Copa Salvadoreña de Programación y a nuestros patrocinadores y aliados." : "También pueden mencionar a la Copa Salvadoreña de Programación, a nuestros patrocinadores y aliados y a su institución."}

Disfruten este resultado, pero sigan preparándose: todavía queda competencia por delante.

¡Felicidades por llegar a la final y nos vemos este 5 de septiembre!

Equipo C3
Copa Salvadoreña de Programación 2026`;

  const outputTextContent = isSchool
    ? textContent.replace("[CONFIRMAR ASISTENCIA]\n[LINK DEL FORMULARIO]", `Confirmar asistencia: ${SCHOOL_ATTENDANCE_FORM_URL}`)
    : textContent;
  const textParagraphs = textContent.split(/\n\n/);
  const htmlBody = textParagraphs.map((part) => {
    if (["Confirmen su asistencia", "Compartan que van a la final", "Esto no termina aquí", "Compartan su clasificación"].includes(part)) {
      return sectionHeading(part);
    }
    if (part === "[CONFIRMAR ASISTENCIA]\n[LINK DEL FORMULARIO]") {
      return isSchool
        ? `<div style="margin:22px 0;padding:20px;background:#eefbfa;border:1px solid #8adbd3;border-radius:12px;text-align:center"><p style="margin:0 0 14px;font-weight:bold;color:#33247c">Confirmen la asistencia de su equipo</p><a href="${SCHOOL_ATTENDANCE_FORM_URL}" style="display:inline-block;background:#17b6a7;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:bold">Confirmar asistencia</a><p style="margin:12px 0 0;font-size:13px;color:#5b5682">Cada integrante del equipo puede registrar hasta 2 acompañantes.</p></div>`
        : "";
    }
    if (part.startsWith("Categoría:")) {
      const lines = part.split("\n");
      return `<div style="margin:22px 0;padding:18px 20px;background:#f4f5ff;border-left:5px solid #17b6a7;border-radius:8px">${lines.map((line) => {
        const [label, ...rest] = line.split(":");
        return `<p style="margin:0 0 6px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(rest.join(":").trim())}</p>`;
      }).join("")}</div>`;
    }
    if (part === "Y ahora sí: ¡la final es este sábado!" || part === "Ahora comienza una nueva etapa.") {
      return `<div style="margin:22px 0;padding:14px 18px;background:#33247c;color:#ffffff;border-radius:8px;font-weight:bold;text-align:center">${escapeHtml(part)}</div>`;
    }
    if (part.startsWith("Adjuntamos dos tarjetas personalizadas")) {
      return `<div style="margin:22px 0;padding:18px 20px;background:#f4f5ff;border-radius:8px"><p style="margin:0 0 8px;font-weight:bold;color:#33247c">${escapeHtml(part.split("\n")[0])}</p>${part.split("\n").slice(1).map((line) => `<p style="margin:4px 0">${escapeHtml(line)}</p>`).join("")}</div>`;
    }
    return paragraph(part);
  }).join("");

  return {
    subject: getOnsiteClassificationSubject(teamName),
    textContent: outputTextContent,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">¡Clasificaron a la final presencial!</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6">${htmlBody}</td></tr></table></td></tr></table></body></html>`,
  };
}
