import test from "node:test";
import assert from "node:assert/strict";
import { COLORS, parse, renderAnsi, renderHtml, renderPlain, escapeHtml, toHtml } from "../dist/index.js";

const ESC = String.fromCharCode(27);

test("renderAnsi emits 24 bit colour by default", () => {
  const output = renderAnsi("§aGreen");
  assert.equal(output, `${ESC}[38;2;85;255;85mGreen${ESC}[0m`);
});

test("renderAnsi can fall back to the basic 16 colours", () => {
  const output = renderAnsi("§aGreen", { trueColor: false });
  assert.equal(output, `${ESC}[92mGreen${ESC}[0m`);
});

test("renderAnsi maps an arbitrary hex to the nearest basic colour", () => {
  const output = renderAnsi("§x§0§0§0§0§a§apure", { trueColor: false });
  assert.equal(output, `${ESC}[34mpure${ESC}[0m`);
});

test("renderAnsi combines colour and style codes", () => {
  const output = renderAnsi("§c§lBold red", { trueColor: false });
  assert.equal(output, `${ESC}[91;1mBold red${ESC}[0m`);
});

test("unstyled text is emitted without escape codes", () => {
  assert.equal(renderAnsi("plain"), "plain");
});

test("renderHtml produces styled spans", () => {
  assert.equal(renderHtml("§aGreen"), '<span style="color:#55ff55">Green</span>');
  assert.equal(renderHtml("§c§lRed bold"), '<span style="color:#ff5555;font-weight:bold">Red bold</span>');
});

test("renderHtml combines underline and strikethrough into one declaration", () => {
  assert.equal(
    renderHtml("§n§mboth"),
    '<span style="text-decoration:underline line-through">both</span>',
  );
});

test("renderHtml escapes user supplied text", () => {
  assert.equal(renderHtml('§a<script>alert("x")</script>'), '<span style="color:#55ff55">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</span>');
  assert.equal(escapeHtml("a & b"), "a &amp; b");
});

test("renderHtml converts newlines to br by default", () => {
  assert.equal(renderHtml("line one\nline two"), "line one<br>line two");
  assert.equal(toHtml(parse("line one\nline two"), { lineBreaks: false }), "line one\nline two");
});

test("renderHtml can wrap output and tag obfuscated runs", () => {
  const output = toHtml(parse("§khidden"), {
    wrapper: "div",
    wrapperClassName: "motd",
    obfuscatedClassName: "mc-obfuscated",
  });

  assert.equal(output, '<div class="motd"><span class="mc-obfuscated">hidden</span></div>');
});

test("renderPlain strips every code", () => {
  assert.equal(renderPlain("§aGreen §lBold§r plain"), "Green Bold plain");
  assert.equal(renderPlain({ text: "a", extra: [{ text: "b", color: "red" }] }), "ab");
});

test("the exported colour table covers all sixteen codes", () => {
  assert.equal(COLORS.length, 16);
  assert.equal(new Set(COLORS.map((entry) => entry.code)).size, 16);
  assert.equal(new Set(COLORS.map((entry) => entry.hex)).size, 16);
  for (const color of COLORS) {
    assert.match(color.hex, /^#[0-9a-f]{6}$/);
  }
});
