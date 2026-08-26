import { COLORS, hexToRgb } from "./colors.js";
import type { MotdNode } from "./types.js";

const ESC = String.fromCharCode(27);
const RESET = `${ESC}[0m`;

export interface AnsiOptions {
  trueColor?: boolean;
  obfuscatedPlaceholder?: string;
}

function nearestAnsiCode(hex: string): number {
  const target = hexToRgb(hex);
  if (!target) {
    return 39;
  }

  let best = COLORS[0] as (typeof COLORS)[number];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of COLORS) {
    const rgb = hexToRgb(candidate.hex);
    if (!rgb) {
      continue;
    }
    const distance =
      (rgb.r - target.r) ** 2 + (rgb.g - target.g) ** 2 + (rgb.b - target.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return best.ansi;
}

export function toAnsi(nodes: readonly MotdNode[], options: AnsiOptions = {}): string {
  const trueColor = options.trueColor !== false;
  let output = "";

  for (const node of nodes) {
    const codes: string[] = [];

    if (node.style.color) {
      if (trueColor) {
        const rgb = hexToRgb(node.style.color);
        if (rgb) {
          codes.push(`38;2;${rgb.r};${rgb.g};${rgb.b}`);
        }
      } else {
        codes.push(String(nearestAnsiCode(node.style.color)));
      }
    }

    if (node.style.bold) codes.push("1");
    if (node.style.italic) codes.push("3");
    if (node.style.underlined) codes.push("4");
    if (node.style.strikethrough) codes.push("9");

    let text = node.text;
    if (node.style.obfuscated && options.obfuscatedPlaceholder) {
      const placeholder = options.obfuscatedPlaceholder;
      text = [...text].map((char) => (char === "\n" || char === " " ? char : placeholder)).join("");
    }

    output += codes.length > 0 ? `${ESC}[${codes.join(";")}m${text}${RESET}` : text;
  }

  return output;
}

export interface HtmlOptions {
  className?: string;
  obfuscatedClassName?: string;
  wrapper?: "span" | "div" | "none";
  wrapperClassName?: string;
  lineBreaks?: boolean;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] as string);
}

export function toHtml(nodes: readonly MotdNode[], options: HtmlOptions = {}): string {
  const lineBreaks = options.lineBreaks !== false;
  let output = "";

  for (const node of nodes) {
    const styles: string[] = [];
    const classes: string[] = [];

    if (options.className) {
      classes.push(options.className);
    }
    if (node.style.color) {
      styles.push(`color:${node.style.color}`);
    }
    if (node.style.bold) {
      styles.push("font-weight:bold");
    }
    if (node.style.italic) {
      styles.push("font-style:italic");
    }

    const decorations: string[] = [];
    if (node.style.underlined) decorations.push("underline");
    if (node.style.strikethrough) decorations.push("line-through");
    if (decorations.length > 0) {
      styles.push(`text-decoration:${decorations.join(" ")}`);
    }

    if (node.style.obfuscated && options.obfuscatedClassName) {
      classes.push(options.obfuscatedClassName);
    }

    let text = escapeHtml(node.text);
    if (lineBreaks) {
      text = text.replace(/\n/g, "<br>");
    }

    if (styles.length === 0 && classes.length === 0) {
      output += text;
      continue;
    }

    const classAttribute = classes.length > 0 ? ` class="${escapeHtml(classes.join(" "))}"` : "";
    const styleAttribute = styles.length > 0 ? ` style="${styles.join(";")}"` : "";
    output += `<span${classAttribute}${styleAttribute}>${text}</span>`;
  }

  const wrapper = options.wrapper ?? "none";
  if (wrapper === "none") {
    return output;
  }

  const wrapperClass = options.wrapperClassName ? ` class="${escapeHtml(options.wrapperClassName)}"` : "";
  return `<${wrapper}${wrapperClass}>${output}</${wrapper}>`;
}

export function toPlain(nodes: readonly MotdNode[]): string {
  return nodes.map((node) => node.text).join("");
}

export function toLegacy(nodes: readonly MotdNode[], formattingChar = "§"): string {
  let output = "";

  for (const node of nodes) {
    if (node.style.color) {
      const named = COLORS.find((entry) => entry.hex === node.style.color);
      if (named) {
        output += `${formattingChar}${named.code}`;
      } else {
        output += `${formattingChar}x`;
        for (const char of node.style.color.slice(1)) {
          output += `${formattingChar}${char}`;
        }
      }
    } else {
      output += `${formattingChar}r`;
    }

    if (node.style.obfuscated) output += `${formattingChar}k`;
    if (node.style.bold) output += `${formattingChar}l`;
    if (node.style.strikethrough) output += `${formattingChar}m`;
    if (node.style.underlined) output += `${formattingChar}n`;
    if (node.style.italic) output += `${formattingChar}o`;

    output += node.text;
  }

  return output;
}

export function toComponent(nodes: readonly MotdNode[]): { text: string; extra: unknown[] } {
  const extra = nodes.map((node) => {
    const component: Record<string, unknown> = { text: node.text };

    if (node.style.colorName) {
      component["color"] = node.style.colorName;
    } else if (node.style.color) {
      component["color"] = node.style.color;
    }

    if (node.style.bold) component["bold"] = true;
    if (node.style.italic) component["italic"] = true;
    if (node.style.underlined) component["underlined"] = true;
    if (node.style.strikethrough) component["strikethrough"] = true;
    if (node.style.obfuscated) component["obfuscated"] = true;

    return component;
  });

  return { text: "", extra };
}
