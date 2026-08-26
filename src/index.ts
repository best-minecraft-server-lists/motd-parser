import { parse } from "./parse.js";
import { toAnsi, toHtml, toLegacy, toPlain } from "./render.js";
import type { AnsiOptions, HtmlOptions } from "./render.js";
import type { MotdInput } from "./types.js";

export { parse, parseLegacy, parseComponent } from "./parse.js";
export type { ParseLegacyOptions } from "./parse.js";
export { toAnsi, toHtml, toPlain, toLegacy, toComponent, escapeHtml } from "./render.js";
export type { AnsiOptions, HtmlOptions } from "./render.js";
export { COLORS, COLOR_BY_CODE, COLOR_BY_NAME, STYLE_CODES, hexToRgb } from "./colors.js";
export type { ColorDefinition, StyleName } from "./colors.js";
export { createStyle, stylesEqual, EMPTY_STYLE } from "./types.js";
export type { ChatComponent, MotdInput, MotdNode, MotdStyle } from "./types.js";

export function renderAnsi(input: MotdInput, options?: AnsiOptions): string {
  return toAnsi(parse(input), options);
}

export function renderHtml(input: MotdInput, options?: HtmlOptions): string {
  return toHtml(parse(input), options);
}

export function renderPlain(input: MotdInput): string {
  return toPlain(parse(input));
}

export function renderLegacy(input: MotdInput, formattingChar?: string): string {
  return toLegacy(parse(input), formattingChar);
}

export function strip(input: MotdInput): string {
  return renderPlain(input);
}
