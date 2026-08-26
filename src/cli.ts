#!/usr/bin/env node
import { parse } from "./parse.js";
import { toAnsi, toHtml, toLegacy, toPlain } from "./render.js";
import { COLORS, STYLE_CODES } from "./colors.js";

const USAGE = `mc-motd - parse and render a Minecraft MOTD

Usage:
  mc-motd <motd> [options]
  cat motd.json | mc-motd [options]

Options:
  --ansi        Render with ANSI colours (default)
  --html        Render to HTML spans
  --plain       Strip all formatting
  --legacy      Re-encode as a legacy section-sign string
  --json        Print the parsed node tree as JSON
  --codes       Print the colour and formatting code reference table
  --basic       Use the 16 basic ANSI colours instead of 24-bit true colour
  -h, --help    Show this help

Examples:
  mc-motd "&aHello &lworld"
  mc-motd '{"text":"Welcome","color":"gold"}' --html
  mc-motd "&x&f&f&8&8&0&0Hex colours work too"
`;

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

function printCodes(): string {
  const lines: string[] = [];
  lines.push("Colour codes");
  lines.push("");
  for (const color of COLORS) {
    lines.push(`  §${color.code}  ${color.name.padEnd(14)} ${color.hex}`);
  }
  lines.push("");
  lines.push("Formatting codes");
  lines.push("");
  for (const [code, name] of Object.entries(STYLE_CODES)) {
    lines.push(`  §${code}  ${name}`);
  }
  lines.push("  §r  reset");
  lines.push("");
  lines.push("Hex colours use the BungeeCord form: §x§R§R§G§G§B§B");
  return lines.join("\n");
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((arg) => arg.startsWith("-")));
  const positional = argv.filter((arg) => !arg.startsWith("-"));

  if (flags.has("-h") || flags.has("--help")) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (flags.has("--codes")) {
    process.stdout.write(`${printCodes()}\n`);
    return 0;
  }

  let input = positional.join(" ");
  if (input === "" && !process.stdin.isTTY) {
    input = (await readStdin()).trim();
  }

  if (input === "") {
    process.stdout.write(USAGE);
    return 2;
  }

  const normalized = input.replace(/&(?=[0-9a-fk-orxA-FK-ORX])/g, "§");
  const nodes = parse(normalized);

  if (flags.has("--json")) {
    process.stdout.write(`${JSON.stringify(nodes, null, 2)}\n`);
    return 0;
  }
  if (flags.has("--html")) {
    process.stdout.write(`${toHtml(nodes)}\n`);
    return 0;
  }
  if (flags.has("--plain")) {
    process.stdout.write(`${toPlain(nodes)}\n`);
    return 0;
  }
  if (flags.has("--legacy")) {
    process.stdout.write(`${toLegacy(nodes)}\n`);
    return 0;
  }

  process.stdout.write(`${toAnsi(nodes, { trueColor: !flags.has("--basic") })}\n`);
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`${(error as Error).stack ?? String(error)}\n`);
    process.exitCode = 1;
  });
