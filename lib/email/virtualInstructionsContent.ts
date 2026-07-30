import "server-only";

import type { RegistrationDocument } from "@/types/admin/registration";

export const VIRTUAL_INSTRUCTIONS_SUBJECT = "Indicaciones para la fase virtual — Copa Salvadoreña de Programación 2026";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function whatsappUrl() {
  const value = process.env.CSP_VIRTUAL_WHATSAPP_URL?.trim();
  if (!value) throw new Error("Configura CSP_VIRTUAL_WHATSAPP_URL antes de enviar las indicaciones virtuales.");
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") throw new Error();
    return parsed.toString();
  } catch {
    throw new Error("CSP_VIRTUAL_WHATSAPP_URL debe ser una URL HTTPS válida.");
  }
}

function contactName(registration: RegistrationDocument) {
  const name = `${registration.responsible?.firstName ?? ""} ${registration.responsible?.lastName ?? ""}`.trim();
  return name || registration.teamName;
}

export function buildVirtualInstructionsContent(registration: RegistrationDocument) {
  const teamName = escapeHtml(registration.teamName.trim());
  const greeting = escapeHtml(contactName(registration));
  const groupUrl = whatsappUrl();
  const caption = "¡Estamos listos para participar en la fase virtual de la Copa Salvadoreña de Programación 2026! 💻🏆 #CopaSalvadoreñaDeProgramación #C3";
  return {
    subject: VIRTUAL_INSTRUCTIONS_SUBJECT,
    textContent: `Hola ${contactName(registration)},\n\nNos emociona conocer al equipo ${registration.teamName}. Participarán en la fase virtual de la Copa Salvadoreña de Programación 2026. Aún no compartimos el enlace del concurso; pronto enviaremos el enlace oficial.\n\nÚnanse al grupo de WhatsApp: ${groupUrl}\n\nAdjuntamos su tarjeta personalizada lista para compartir. Caption sugerido: ${caption}`,
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">¡Nos emociona conocer a ${teamName}!</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6"><p>Hola, ${greeting}:</p><p>Gracias por inscribirse a la Copa Salvadoreña de Programación. Su equipo participará en la <strong>fase virtual</strong>.</p><p>El enlace oficial del concurso todavía no se comparte; se los enviaremos próximamente. Mientras tanto, únanse al grupo de WhatsApp para recibir avisos importantes.</p><p style="text-align:center;margin:28px 0"><a href="${escapeHtml(groupUrl)}" style="display:inline-block;background:#17b6a7;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:bold">Unirse al grupo de WhatsApp</a></p><p>Adjuntamos su tarjeta personalizada, lista para compartir en redes. Pueden etiquetar a C3, Copa Salvadoreña de Programación y nuestros aliados.</p><p style="margin:20px 0 0;padding:16px;background:#f4f5ff;border-left:4px solid #17b6a7"><strong>Caption sugerido</strong><br>${escapeHtml(caption)}</p></td></tr></table></td></tr></table></body></html>`,
  };
}
