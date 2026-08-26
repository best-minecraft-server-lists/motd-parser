# motd-parser - Minecraft MOTD Parser and Renderer (`mc-motd`)

[![CI](https://github.com/best-minecraft-server-lists/motd-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/best-minecraft-server-lists/motd-parser/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mc-motd.svg)](https://www.npmjs.com/package/mc-motd)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A Node library and CLI to parse Minecraft MOTD strings and render them anywhere. It reads both legacy `§` colour codes and modern JSON chat components, and outputs ANSI for terminals, HTML for web pages, or plain text for logs and search indexes. Zero dependencies, full TypeScript types.

```bash
npx mc-motd "&aTalonMC &7| &lCOBBLEMON RELEASED" --html
```

```html
<span style="color:#55ff55">TalonMC </span><span style="color:#aaaaaa">| </span><span style="color:#aaaaaa;font-weight:bold">COBBLEMON RELEASED</span>
```

## Why

A server list ping hands you a MOTD in one of several shapes: a legacy string full of `§` codes, a nested JSON chat component, or a mix of the two where a component's `text` field also contains `§` codes. Rendering that correctly means knowing that a colour code resets bold, that `§x` introduces a six-part hex colour, and that child components inherit their parent's styling. This library handles all of it and gives you a flat list of styled runs you can render however you like.

## Install

```bash
npm install mc-motd
```

## Usage

### Strip formatting for a log line or a search index

```js
import { renderPlain } from "mc-motd";

renderPlain("§aTalonMC §7| §lCOBBLEMON RELEASED");
// "TalonMC | COBBLEMON RELEASED"
```

### Render a MOTD to HTML

```js
import { renderHtml } from "mc-motd";

renderHtml("§aHello §lworld");
// '<span style="color:#55ff55">Hello </span><span style="color:#55ff55;font-weight:bold">world</span>'
```

Wrap it and tag obfuscated runs so you can animate them with CSS:

```js
renderHtml("§kSECRET", {
  wrapper: "div",
  wrapperClassName: "motd",
  obfuscatedClassName: "mc-obfuscated",
});
// '<div class="motd"><span class="mc-obfuscated">SECRET</span></div>'
```

### Print a MOTD in a terminal

```js
import { renderAnsi } from "mc-motd";

console.log(renderAnsi("§aTalonMC §7| §cLIVE"));
console.log(renderAnsi("§aTalonMC", { trueColor: false })); // 16-colour terminals
```

### Handle a JSON chat component

Child components inherit styling from their parent unless they override it.

```js
import { renderPlain, parse } from "mc-motd";

const component = {
  text: "Welcome ",
  color: "gold",
  bold: true,
  extra: [{ text: "back" }, { text: "!", color: "red", bold: false }],
};

renderPlain(component); // "Welcome back!"

parse(component);
// [
//   { text: "Welcome back", style: { color: "#ffaa00", colorName: "gold", bold: true, ... } },
//   { text: "!",            style: { color: "#ff5555", colorName: "red",  bold: false, ... } },
// ]
```

### Work with the parsed nodes directly

`parse` returns a flat array of styled runs, so you can render into React, canvas, or anything else.

```jsx
import { parse } from "mc-motd";

function Motd({ source }) {
  return (
    <>
      {parse(source).map((node, index) => (
        <span
          key={index}
          style={{
            color: node.style.color ?? undefined,
            fontWeight: node.style.bold ? "bold" : undefined,
            fontStyle: node.style.italic ? "italic" : undefined,
          }}
        >
          {node.text}
        </span>
      ))}
    </>
  );
}
```

### Pair it with a server ping

```js
import { status } from "mc-status";
import { renderHtml } from "mc-motd";

const server = await status("play.talonmc.net");
const html = renderHtml(server.motd.json ?? server.motd.raw);
```

### Convert between formats

```js
import { parse, toLegacy, toComponent } from "mc-motd";

const nodes = parse({ text: "hi", color: "green" });

toLegacy(nodes);    // "§ahi"
toComponent(nodes); // { text: "", extra: [{ text: "hi", color: "green" }] }
```

## CLI

```
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
```

The CLI accepts `&` in place of `§` so you can paste straight from a `server.properties` or a plugin config without fighting your shell.

```bash
npx mc-motd "&6&lMY SERVER&r &7| &aOnline"
curl -s https://example.com/motd.json | npx mc-motd --html
```

## Colour and formatting code reference

Minecraft formatting codes are the section sign `§` (U+00A7) followed by one character. Many config files use `&` instead and convert it at load time.

### Colour codes

| Code | Name | Hex | RGB | Terminal |
| --- | --- | --- | --- | --- |
| `§0` | `black` | `#000000` | 0, 0, 0 | 30 |
| `§1` | `dark_blue` | `#0000aa` | 0, 0, 170 | 34 |
| `§2` | `dark_green` | `#00aa00` | 0, 170, 0 | 32 |
| `§3` | `dark_aqua` | `#00aaaa` | 0, 170, 170 | 36 |
| `§4` | `dark_red` | `#aa0000` | 170, 0, 0 | 31 |
| `§5` | `dark_purple` | `#aa00aa` | 170, 0, 170 | 35 |
| `§6` | `gold` | `#ffaa00` | 255, 170, 0 | 33 |
| `§7` | `gray` | `#aaaaaa` | 170, 170, 170 | 37 |
| `§8` | `dark_gray` | `#555555` | 85, 85, 85 | 90 |
| `§9` | `blue` | `#5555ff` | 85, 85, 255 | 94 |
| `§a` | `green` | `#55ff55` | 85, 255, 85 | 92 |
| `§b` | `aqua` | `#55ffff` | 85, 255, 255 | 96 |
| `§c` | `red` | `#ff5555` | 255, 85, 85 | 91 |
| `§d` | `light_purple` | `#ff55ff` | 255, 85, 255 | 95 |
| `§e` | `yellow` | `#ffff55` | 255, 255, 85 | 93 |
| `§f` | `white` | `#ffffff` | 255, 255, 255 | 97 |

### Formatting codes

| Code | Name | Effect |
| --- | --- | --- |
| `§k` | `obfuscated` | Characters scramble and re-randomise every frame |
| `§l` | `bold` | Bold text |
| `§m` | `strikethrough` | Line through the text |
| `§n` | `underlined` | Underlined text |
| `§o` | `italic` | Italic text |
| `§r` | `reset` | Clears colour and every style |

### Hex colours

Servers on 1.16 and newer can use full RGB. The BungeeCord encoding, which this library reads, spells the hex out one nibble at a time:

```
§x§R§R§G§G§B§B
§x§f§f§8§8§0§0  ->  #ff8800
```

In a JSON chat component the same colour is simply `"color": "#ff8800"`.

### Two rules that catch people out

1. **A colour code resets formatting.** `§l§agreen` is green and *not* bold, because `§a` cleared the bold. Write `§a§lgreen` instead. This library reproduces that behaviour exactly.
2. **Component children inherit, legacy codes do not.** In a chat component, `extra` entries inherit the parent's colour and styles. In a legacy string there is no nesting at all, just a running state machine.

## API reference

### Parsing

#### `parse(input): MotdNode[]`

Accepts a legacy string, a JSON chat component object or array, or a JSON string. Auto-detects which it is. This is the one to reach for.

#### `parseLegacy(input, options?): MotdNode[]`

Parses a legacy `§` string. Options: `formattingChar` (default `"§"`) and `initialStyle` to seed inherited formatting.

#### `parseComponent(component): MotdNode[]`

Parses a JSON chat component. Walks `extra` recursively and applies inheritance. Legacy codes inside a `text` field are still honoured.

### Rendering

| Function | Returns |
| --- | --- |
| `renderAnsi(input, options?)` | Terminal string with ANSI escape codes |
| `renderHtml(input, options?)` | HTML string of `<span>` elements |
| `renderPlain(input)` | Text with all formatting removed |
| `renderLegacy(input, char?)` | Legacy `§`-coded string |
| `strip(input)` | Alias for `renderPlain` |

Each has a `to*` counterpart (`toAnsi`, `toHtml`, `toPlain`, `toLegacy`, `toComponent`) that takes an already-parsed `MotdNode[]` instead of raw input, so you can parse once and render several ways.

#### `AnsiOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `trueColor` | `boolean` | `true` | Emit 24-bit `38;2;r;g;b` codes. Set `false` for the nearest of the 16 basic colours. |
| `obfuscatedPlaceholder` | `string` | - | Replace obfuscated characters with this, since terminals cannot scramble text. |

#### `HtmlOptions`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | - | Class added to every span. |
| `obfuscatedClassName` | `string` | - | Class added to obfuscated runs only. |
| `wrapper` | `"span" \| "div" \| "none"` | `"none"` | Wrap the whole output in an element. |
| `wrapperClassName` | `string` | - | Class for that wrapper. |
| `lineBreaks` | `boolean` | `true` | Convert `\n` to `<br>`. |

All text is HTML-escaped. A MOTD is attacker-controlled input, so never interpolate the raw string into a page yourself.

### Types

```ts
interface MotdNode {
  text: string;
  style: MotdStyle;
}

interface MotdStyle {
  color: string | null;      // "#55ff55"
  colorName: string | null;  // "green", or null for hex colours
  bold: boolean;
  italic: boolean;
  underlined: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
}
```

Adjacent runs with identical styling are merged, so the node list stays short.

### Colour table exports

`COLORS` is the full sixteen-entry table, and `COLOR_BY_CODE` / `COLOR_BY_NAME` are `Map`s over it. `hexToRgb(hex)` is exported for convenience.

```js
import { COLORS, COLOR_BY_NAME } from "mc-motd";

COLOR_BY_NAME.get("gold"); // { code: "6", name: "gold", hex: "#ffaa00", ansi: 33 }
```

## Related

Built and maintained by [Best Minecraft Server Lists](https://bestcobblemonservers.net). Every ranking below is ordered on player counts taken from a direct server ping, never on numbers a server reports about itself.

- [Best Cobblemon servers](https://bestcobblemonservers.net) - The Best Cobblemon Servers, Top 10, Rated by the players
- [Best Minecraft Prison servers](https://bestprisonservers.com) - The Best Prison Servers, Top 10, Rated by the players
- [Best Minecraft Skyblock servers](https://bestskyblockservers.net) - The Best Skyblock Servers, Top 10, Rated by the players
- [Best Minecraft SMP servers](https://bestsmpservers.com) - The Best SMP Servers, Top 10, Rated by the players
- [Best Minecraft Survival servers](https://bestsurvivalservers.com) - The Best Survival Servers, Top 10, Rated by the players
- [Free rankings JSON API](https://bestprisonservers.com/api/rankings.json) - Every ranking above as JSON, CC BY 4.0, no key and no sign-up

Sister libraries:

- [mc-status](https://github.com/best-minecraft-server-lists/mc-status) - ping a Java or Bedrock server for players, version and MOTD
- [mc-votifier](https://github.com/best-minecraft-server-lists/votifier-client) - send and receive Votifier votes
- [mc-rankings-client](https://github.com/best-minecraft-server-lists/mc-rankings-client) - typed client for the rankings feeds above

## Contributing

Issues and pull requests are welcome.

```bash
npm install
npm test
```

## License

MIT
