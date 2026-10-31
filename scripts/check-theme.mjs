import { readFileSync } from "node:fs";

const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const MIN_CONTRAST = 4.5;

const failures = [];

let theme;
try {
  theme = JSON.parse(readFileSync(new URL("../themes/qx-theme-color-theme.json", import.meta.url), "utf8"));
} catch (error) {
  console.error(`Cannot read the theme file: ${error.message}`);
  process.exit(1);
}

const colors = theme.colors ?? {};
const editorBackground = colors["editor.background"];

const isColor = (value) => typeof value === "string" && HEX_COLOR.test(value);

function parseColor(hex) {
  let digits = hex.slice(1);
  if (digits.length <= 4) {
    digits = [...digits].map((digit) => digit + digit).join("");
  }
  const [r, g, b, a = 255] = digits.match(/../g).map((pair) => parseInt(pair, 16));
  return { r, g, b, a: a / 255 };
}

// WCAG 2 relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function luminance({ r, g, b }) {
  const [R, G, B] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(foreground, background) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  const blend = (channel) => fg[channel] * fg.a + bg[channel] * (1 - fg.a);
  const [lighter, darker] = [luminance({ r: blend("r"), g: blend("g"), b: blend("b") }), luminance(bg)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkFormat(label, value) {
  if (value !== undefined && !isColor(value)) {
    failures.push(`${label}: invalid color ${JSON.stringify(value)}`);
  }
}

function checkContrast(label, foreground, background) {
  if (!isColor(foreground) || !isColor(background)) return;
  const ratio = contrast(foreground, background);
  if (ratio < MIN_CONTRAST) {
    failures.push(`${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1 (< ${MIN_CONTRAST}:1)`);
  }
}

for (const [key, value] of Object.entries(colors)) {
  checkFormat(`colors.${key}`, value);
}

if (editorBackground === undefined) {
  failures.push("colors.editor.background is missing");
}
checkContrast("colors.editor.foreground", colors["editor.foreground"], editorBackground);
checkContrast("colors.button.foreground", colors["button.foreground"], colors["button.background"]);

(theme.tokenColors ?? []).forEach(({ name, scope, settings = {} }, index) => {
  const label = `tokenColors[${index}]${name ? ` (${name})` : ""}`;
  const scopes = (Array.isArray(scope) ? scope : String(scope ?? "").split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  const allScopesStartWith = (...prefixes) =>
    scopes.length > 0 && scopes.every((s) => prefixes.some((prefix) => s.startsWith(prefix)));

  checkFormat(label, settings.foreground);
  // Comments are secondary text, judged visually (spec §3).
  if (!allScopesStartWith("comment", "punctuation.definition.comment")) {
    checkContrast(label, settings.foreground, editorBackground);
  }
  if (settings.fontStyle?.includes("italic") && !allScopesStartWith("markup.italic")) {
    failures.push(`${label}: italic is only allowed on markup.italic`);
  }
});

for (const [selector, style] of Object.entries(theme.semanticTokenColors ?? {})) {
  const label = `semanticTokenColors.${selector}`;
  const foreground = typeof style === "string" ? style : style.foreground;

  checkFormat(label, foreground);
  if (selector.split(/[.:]/)[0] !== "comment") {
    checkContrast(label, foreground, editorBackground);
  }
  if (style.italic || style.fontStyle?.includes("italic")) {
    failures.push(`${label}: italic is not allowed`);
  }
}

if (failures.length > 0) {
  console.error(`${failures.length} problem(s) in the theme:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Theme OK");
