# Design files (no code needed)

Everything here is for designers and no-code tools. You don't need to run the site to use it.

| Path | What it is |
| --- | --- |
| `figma/` | A Figma plugin that builds the whole portfolio as an editable Figma file |
| `tokens.json` | Colours, fonts and layout as design tokens (W3C format) |
| `renders/laptop.png`, `renders/phone.png` | The 3D MacBook and iPhone renders, transparent, for mockups and decks |
| `renders/*.jpg` | Full-page screenshots of every page at desktop and phone width |

## Figma

1. Open the **Figma desktop app** (development plugins don't run in the browser) and create a blank design file.
2. **Plugins → Development → Import plugin from manifest…** and pick `design/figma/manifest.json`.
3. **Plugins → Development → Portfolio Template → Figma**. It takes a few seconds.

You get five pages:

- **Foundations**: colour variables (`Portfolio colours`), 12 text styles, and 12-column desktop and 4-column phone grid styles.
- **Components**: Button, Nav item, Index row and Device toggle (each with variants), plus Header, Footer, Section bar, Stat, Contact row, Timeline row and the badges.
- **Desktop**: Home and Work at 1440px, built from those components with auto layout.
- **Phone**: Home and Work at 390px.
- **Reference**: locked screenshots of the live site to check against.

Change a colour variable or text style and every page follows. The content (your name, timeline, sites, numbers) comes from `src/data`, so after editing it run `pnpm design:figma` to rebuild the plugin, then run it again in a fresh file.

The site uses **Inter Tight** and **IBM Plex Mono**, both Google Fonts that Figma includes. If a file can't load them, the plugin falls back to Inter and says so when it finishes.

## Framer, Webflow and other builders

None of these can open a Next.js project directly. The usual route is to go through Figma:

- **Framer**: build the Figma file above, then copy frames across with Framer's Figma plugin.
- **Webflow**: same, with Webflow's Figma plugin.
- **Tokens**: `tokens.json` loads into Tokens Studio for Figma, Style Dictionary, and most tools that read the W3C design-token format.

Without Figma, a plugin such as html.to.design can import the deployed site's URL into a design file instead.

What carries over is the design: layout, type, colour, components and content. What doesn't is the behaviour that lives in code: the 3D laptop and phone animation, live sites inside the browser frames, the shuffle, the sortable timeline and the automatic data refresh. In a design tool those are static images (`renders/`) or need rebuilding with that tool's own interactions.
