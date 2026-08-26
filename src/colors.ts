export interface ColorDefinition {
  code: string;
  name: string;
  hex: string;
  ansi: number;
}

export const COLORS: readonly ColorDefinition[] = [
  { code: "0", name: "black", hex: "#000000", ansi: 30 },
  { code: "1", name: "dark_blue", hex: "#0000aa", ansi: 34 },
  { code: "2", name: "dark_green", hex: "#00aa00", ansi: 32 },
  { code: "3", name: "dark_aqua", hex: "#00aaaa", ansi: 36 },
  { code: "4", name: "dark_red", hex: "#aa0000", ansi: 31 },
  { code: "5", name: "dark_purple", hex: "#aa00aa", ansi: 35 },
  { code: "6", name: "gold", hex: "#ffaa00", ansi: 33 },
  { code: "7", name: "gray", hex: "#aaaaaa", ansi: 37 },
  { code: "8", name: "dark_gray", hex: "#555555", ansi: 90 },
  { code: "9", name: "blue", hex: "#5555ff", ansi: 94 },
  { code: "a", name: "green", hex: "#55ff55", ansi: 92 },
  { code: "b", name: "aqua", hex: "#55ffff", ansi: 96 },
  { code: "c", name: "red", hex: "#ff5555", ansi: 91 },
  { code: "d", name: "light_purple", hex: "#ff55ff", ansi: 95 },
  { code: "e", name: "yellow", hex: "#ffff55", ansi: 93 },
  { code: "f", name: "white", hex: "#ffffff", ansi: 97 },
];

export const COLOR_BY_CODE = new Map(COLORS.map((entry) => [entry.code, entry]));
export const COLOR_BY_NAME = new Map(COLORS.map((entry) => [entry.name, entry]));

export const STYLE_CODES = {
  k: "obfuscated",
  l: "bold",
  m: "strikethrough",
  n: "underlined",
  o: "italic",
} as const;

export type StyleName = (typeof STYLE_CODES)[keyof typeof STYLE_CODES];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[1] as string, 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}
