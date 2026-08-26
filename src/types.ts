export interface MotdStyle {
  color: string | null;
  colorName: string | null;
  bold: boolean;
  italic: boolean;
  underlined: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
}

export interface MotdNode {
  text: string;
  style: MotdStyle;
}

export const EMPTY_STYLE: MotdStyle = Object.freeze({
  color: null,
  colorName: null,
  bold: false,
  italic: false,
  underlined: false,
  strikethrough: false,
  obfuscated: false,
});

export function createStyle(overrides: Partial<MotdStyle> = {}): MotdStyle {
  return { ...EMPTY_STYLE, ...overrides };
}

export function stylesEqual(left: MotdStyle, right: MotdStyle): boolean {
  return (
    left.color === right.color &&
    left.bold === right.bold &&
    left.italic === right.italic &&
    left.underlined === right.underlined &&
    left.strikethrough === right.strikethrough &&
    left.obfuscated === right.obfuscated
  );
}

export interface ChatComponent {
  text?: unknown;
  extra?: unknown;
  translate?: unknown;
  color?: unknown;
  bold?: unknown;
  italic?: unknown;
  underlined?: unknown;
  strikethrough?: unknown;
  obfuscated?: unknown;
}

export type MotdInput = string | ChatComponent | readonly unknown[];
