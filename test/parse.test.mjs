import test from "node:test";
import assert from "node:assert/strict";
import { parse, parseLegacy, parseComponent, toPlain, toLegacy, toComponent } from "../dist/index.js";

test("parseLegacy splits on colour codes", () => {
  const nodes = parseLegacy("§aGreen§cRed");

  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].text, "Green");
  assert.equal(nodes[0].style.color, "#55ff55");
  assert.equal(nodes[0].style.colorName, "green");
  assert.equal(nodes[1].text, "Red");
  assert.equal(nodes[1].style.colorName, "red");
});

test("a colour code resets active styles the way vanilla does", () => {
  const nodes = parseLegacy("§l§agreen but not bold");

  assert.equal(nodes[0].style.colorName, "green");
  assert.equal(nodes[0].style.bold, false);
});

test("styles applied after a colour code survive", () => {
  const nodes = parseLegacy("§a§lBold green§cplain red");

  assert.equal(nodes[0].style.colorName, "green");
  assert.equal(nodes[0].style.bold, true);
  assert.equal(nodes[1].style.colorName, "red");
  assert.equal(nodes[1].style.bold, false);
});

test("style codes stack until reset", () => {
  const nodes = parseLegacy("§l§nboth§rneither");

  assert.equal(nodes[0].style.bold, true);
  assert.equal(nodes[0].style.underlined, true);
  assert.equal(nodes[1].style.bold, false);
  assert.equal(nodes[1].style.underlined, false);
});

test("bungeecord hex sequences become a hex colour", () => {
  const nodes = parseLegacy("§x§f§f§8§8§0§0orange");

  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].style.color, "#ff8800");
  assert.equal(nodes[0].style.colorName, null);
  assert.equal(nodes[0].text, "orange");
});

test("a malformed hex sequence is kept as literal text", () => {
  const nodes = parseLegacy("§x§f§fnope");
  assert.equal(toPlain(nodes).includes("nope"), true);
});

test("unknown codes are preserved verbatim", () => {
  assert.equal(toPlain(parseLegacy("100§ off")), "100§ off");
  assert.equal(toPlain(parseLegacy("trailing§")), "trailing§");
});

test("adjacent nodes with identical styling are merged", () => {
  const nodes = parseLegacy("§aone§atwo");
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].text, "onetwo");
});

test("parseComponent walks extra and inherits styles", () => {
  const nodes = parseComponent({
    text: "Welcome ",
    color: "gold",
    bold: true,
    extra: [{ text: "back" }, { text: "!", color: "red", bold: false }],
  });

  assert.equal(toPlain(nodes), "Welcome back!");
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].text, "Welcome back");
  assert.equal(nodes[0].style.colorName, "gold");
  assert.equal(nodes[0].style.bold, true);
  assert.equal(nodes[1].text, "!");
  assert.equal(nodes[1].style.colorName, "red");
  assert.equal(nodes[1].style.bold, false);
});

test("parseComponent accepts hex colours and bare arrays", () => {
  assert.equal(parseComponent({ text: "hi", color: "#ABCDEF" })[0].style.color, "#abcdef");
  assert.equal(toPlain(parseComponent(["a", { text: "b" }])), "ab");
});

test("legacy codes inside a component text field are honoured", () => {
  const nodes = parseComponent({ text: "§cred inside", color: "gold" });
  assert.equal(nodes[0].style.colorName, "red");
});

test("parse auto-detects json versus legacy input", () => {
  assert.equal(toPlain(parse('{"text":"json"}')), "json");
  assert.equal(toPlain(parse("§alegacy")), "legacy");
  assert.equal(toPlain(parse("{not json after all")), "{not json after all");
});

test("toLegacy round trips through the parser", () => {
  const original = "§aGreen §lBold§r plain";
  assert.equal(toPlain(parse(toLegacy(parse(original)))), toPlain(parse(original)));
});

test("toComponent produces a valid chat component", () => {
  const component = toComponent(parse("§aGreen§lBold"));

  assert.equal(component.text, "");
  assert.equal(component.extra[0].color, "green");
  assert.equal(component.extra[1].bold, true);
});

test("multi line motds keep their newline", () => {
  const nodes = parse("§aline one\n§bline two");
  assert.equal(toPlain(nodes), "line one\nline two");
});
