export type CustomEmailFormatAction =
  | "bold"
  | "italic"
  | "heading"
  | "bullet-list"
  | "numbered-list"
  | "link";

export type CustomEmailEditorChange = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string,
): CustomEmailEditorChange {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder;
  const replacement = `${before}${selected}${after}`;
  return {
    value: value.slice(0, selectionStart) + replacement + value.slice(selectionEnd),
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + selected.length,
  };
}

function prefixSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: (index: number) => string,
): CustomEmailEditorChange {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = value.indexOf("\n", selectionEnd);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const selected = value.slice(lineStart, lineEnd) || "Elemento";
  const replacement = selected.split("\n").map((line, index) => `${prefix(index)}${line}`).join("\n");
  return {
    value: value.slice(0, lineStart) + replacement + value.slice(lineEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + replacement.length,
  };
}

export function applyCustomEmailFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: CustomEmailFormatAction,
): CustomEmailEditorChange {
  if (action === "bold") return wrapSelection(value, selectionStart, selectionEnd, "**", "**", "texto");
  if (action === "italic") return wrapSelection(value, selectionStart, selectionEnd, "*", "*", "texto");
  if (action === "heading") return prefixSelectedLines(value, selectionStart, selectionEnd, () => "## ");
  if (action === "bullet-list") return prefixSelectedLines(value, selectionStart, selectionEnd, () => "- ");
  if (action === "numbered-list") return prefixSelectedLines(value, selectionStart, selectionEnd, (index) => `${index + 1}. `);

  const selected = value.slice(selectionStart, selectionEnd) || "texto del enlace";
  const replacement = `[${selected}](https://)`;
  const urlStart = selectionStart + selected.length + 3;
  return {
    value: value.slice(0, selectionStart) + replacement + value.slice(selectionEnd),
    selectionStart: urlStart,
    selectionEnd: urlStart + 8,
  };
}
