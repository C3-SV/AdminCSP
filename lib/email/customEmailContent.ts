export const CUSTOM_EMAIL_MAX_SUBJECT_LENGTH = 200;
export const CUSTOM_EMAIL_MAX_CONTENT_LENGTH = 50_000;

export class CustomEmailContentError extends Error {}

type CustomEmailContentInput = {
  subject: string;
  content: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function safeLink(value: string) {
  const decoded = value.replace(/&amp;/g, "&");
  try {
    const url = new URL(decoded);
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) return null;
    return escapeHtml(url.toString());
  } catch {
    return null;
  }
}

function renderEmphasis(value: string) {
  return value
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
}

function renderInline(value: string) {
  const links: string[] = [];
  let rendered = escapeHtml(value.replace(/\0/g, ""));
  rendered = rendered.replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_match, label: string, url: string) => {
    const href = safeLink(url);
    const replacement = href
      ? `<a href="${href}" style="color:#33247c;font-weight:600;text-decoration:underline">${renderEmphasis(label)}</a>`
      : `${label} (${url})`;
    const token = `\0${links.length}\0`;
    links.push(replacement);
    return token;
  });
  rendered = renderEmphasis(rendered);
  return rendered.replace(/\0(\d+)\0/g, (_match, index: string) => links[Number(index)] ?? "");
}

function renderBlocks(content: string) {
  const blocks: string[] = [];
  let paragraphLines: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push(`<p style="margin:0 0 18px">${paragraphLines.map(renderInline).join("<br />")}</p>`);
    paragraphLines = [];
  };
  const flushList = () => {
    if (!listType || !listItems.length) return;
    blocks.push(`<${listType} style="margin:0 0 18px;padding-left:24px">${listItems.map((item) => `<li style="margin:0 0 6px">${renderInline(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const rawLine of content.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length + 1;
      const sizes = { 2: 24, 3: 20, 4: 17 } as const;
      blocks.push(`<h${level} style="margin:24px 0 12px;color:#33247c;font-size:${sizes[level as keyof typeof sizes]}px;line-height:1.3">${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered ?? ordered)?.[1] ?? "");
      continue;
    }
    flushList();
    paragraphLines.push(line);
  }
  flushParagraph();
  flushList();
  return blocks.join("");
}

function toPlainText(content: string) {
  return content
    .replace(/\r\n?/g, "\n")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

export function buildCustomEmailContent(input: CustomEmailContentInput) {
  const subject = input.subject.trim();
  const content = input.content.trim();
  if (!subject) throw new CustomEmailContentError("El asunto es obligatorio.");
  if (subject.length > CUSTOM_EMAIL_MAX_SUBJECT_LENGTH) {
    throw new CustomEmailContentError(`El asunto no puede superar ${CUSTOM_EMAIL_MAX_SUBJECT_LENGTH} caracteres.`);
  }
  if (!content) throw new CustomEmailContentError("El contenido del correo es obligatorio.");
  if (content.length > CUSTOM_EMAIL_MAX_CONTENT_LENGTH) {
    throw new CustomEmailContentError(`El contenido no puede superar ${CUSTOM_EMAIL_MAX_CONTENT_LENGTH} caracteres.`);
  }

  const body = renderBlocks(content);
  return {
    subject,
    textContent: toPlainText(content),
    htmlContent: `<!doctype html><html><body style="margin:0;background:#f4f5ff;font-family:Arial,sans-serif;color:#29225d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#33247c;padding:30px;color:#ffffff"><p style="margin:0;font-size:14px;font-weight:bold;color:#72ded2">C3 · COPA SALVADOREÑA DE PROGRAMACIÓN 2026</p><h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">${escapeHtml(subject)}</h1></td></tr><tr><td style="padding:30px;font-size:16px;line-height:1.6">${body}</td></tr></table></td></tr></table></body></html>`,
  };
}
