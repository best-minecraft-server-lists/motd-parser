import { COLOR_BY_CODE, COLOR_BY_NAME, STYLE_CODES, type StyleName } from "./colors.js";
import { createStyle, stylesEqual, type ChatComponent, type MotdInput, type MotdNode, type MotdStyle } from "./types.js";

const SECTION = "§";

function pushNode(nodes: MotdNode[], text: string, style: MotdStyle): void {
  if (text === "") {
    return;
  }

  const last = nodes[nodes.length - 1];
  if (last && stylesEqual(last.style, style)) {
    last.text += text;
    return;
  }

  nodes.push({ text, style: { ...style } });
}

export interface ParseLegacyOptions {
  formattingChar?: string;
  initialStyle?: MotdStyle;
}

export function parseLegacy(input: string, options: ParseLegacyOptions = {}): MotdNode[] {
  const marker = options.formattingChar ?? SECTION;
  const baseStyle = options.initialStyle ?? createStyle();
  const nodes: MotdNode[] = [];
  let style = { ...baseStyle };
  let buffer = "";

  const flush = (): void => {
    pushNode(nodes, buffer, style);
    buffer = "";
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index] as string;

    if (char !== marker) {
      buffer += char;
      continue;
    }

    const next = input[index + 1];
    if (next === undefined) {
      buffer += char;
      break;
    }

    const lower = next.toLowerCase();

    if (lower === "x") {
      const digits: string[] = [];
      let cursor = index + 2;

      while (digits.length < 6 && input[cursor] === marker && input[cursor + 1] !== undefined) {
        digits.push(input[cursor + 1] as string);
        cursor += 2;
      }

      if (digits.length === 6 && /^[0-9a-f]{6}$/i.test(digits.join(""))) {
        flush();
        style = { ...style, color: `#${digits.join("").toLowerCase()}`, colorName: null };
        index = cursor - 1;
        continue;
      }

      buffer += char;
      continue;
    }

    const color = COLOR_BY_CODE.get(lower);
    if (color) {
      flush();
      style = createStyle({ color: color.hex, colorName: color.name });
      index += 1;
      continue;
    }

    if (lower === "r") {
      flush();
      style = { ...baseStyle };
      index += 1;
      continue;
    }

    const styleName = STYLE_CODES[lower as keyof typeof STYLE_CODES] as StyleName | undefined;
    if (styleName) {
      flush();
      style = { ...style, [styleName]: true };
      index += 1;
      continue;
    }

    buffer += char;
  }

  flush();
  return nodes;
}

function resolveColor(value: unknown): { color: string; colorName: string | null } | null {
  if (typeof value !== "string") {
    return null;
  }

  if (value.startsWith("#")) {
    return /^#[0-9a-f]{6}$/i.test(value) ? { color: value.toLowerCase(), colorName: null } : null;
  }

  const named = COLOR_BY_NAME.get(value);
  return named ? { color: named.hex, colorName: named.name } : null;
}

function mergeStyle(inherited: MotdStyle, node: ChatComponent): MotdStyle {
  const color = resolveColor(node.color);

  return {
    color: color ? color.color : inherited.color,
    colorName: color ? color.colorName : inherited.colorName,
    bold: typeof node.bold === "boolean" ? node.bold : inherited.bold,
    italic: typeof node.italic === "boolean" ? node.italic : inherited.italic,
    underlined: typeof node.underlined === "boolean" ? node.underlined : inherited.underlined,
    strikethrough: typeof node.strikethrough === "boolean" ? node.strikethrough : inherited.strikethrough,
    obfuscated: typeof node.obfuscated === "boolean" ? node.obfuscated : inherited.obfuscated,
  };
}

function walkComponent(component: unknown, inherited: MotdStyle, nodes: MotdNode[]): void {
  if (component === null || component === undefined) {
    return;
  }

  if (typeof component === "string") {
    for (const node of parseLegacy(component, { initialStyle: inherited })) {
      pushNode(nodes, node.text, node.style);
    }
    return;
  }

  if (Array.isArray(component)) {
    for (const entry of component) {
      walkComponent(entry, inherited, nodes);
    }
    return;
  }

  if (typeof component !== "object") {
    pushNode(nodes, String(component), inherited);
    return;
  }

  const node = component as ChatComponent;
  const style = mergeStyle(inherited, node);

  if (typeof node.text === "string" && node.text !== "") {
    for (const parsed of parseLegacy(node.text, { initialStyle: style })) {
      pushNode(nodes, parsed.text, parsed.style);
    }
  } else if (typeof node.translate === "string") {
    pushNode(nodes, node.translate, style);
  }

  if (Array.isArray(node.extra)) {
    for (const child of node.extra) {
      walkComponent(child, style, nodes);
    }
  }
}

export function parseComponent(component: unknown): MotdNode[] {
  const nodes: MotdNode[] = [];
  walkComponent(component, createStyle(), nodes);
  return nodes;
}

export function parse(input: MotdInput): MotdNode[] {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return parseComponent(JSON.parse(trimmed));
      } catch {
        return parseLegacy(input);
      }
    }
    return parseLegacy(input);
  }

  return parseComponent(input);
}
