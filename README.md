# Portfolio Template

A Swiss-editorial personal portfolio built with Next.js 15, React 19 and TypeScript, exported as a static site. Black on white, hairline rules, one neo-grotesk (Inter Tight), one mono (IBM Plex Mono) and a single blood-red accent (`#8a0303`).

Everything personal in this repository is a placeholder — "Your Name", `you@example.com`, example.com links and generated grey images. Replace them with your own and deploy.

## Features

- **Homepage cover** — large name, portrait, profile with live entry counts, contact list with hover/focus previews of a recent post per network, and a "listening" card.
- **Activity calendar** — a GitHub contribution heatmap (newest weeks first) overlaid with social-posting days, plus a cumulative views counter.
- **Timeline index** — a sortable, filterable, searchable table of every entry across four categories (Experience, Projects, Education, Activities), with an optional descriptions toggle.
- **Detail pages** — `/timeline/<id>` for every entry: meta grid, "What I did / What I learned / Skills", external links, image gallery, optional logo, video and long-form project notebook. Newer/older pager.
- **`/work`** — a 3D MacBook (three.js) that opens onto a macOS desktop with Safari showing your sites. Shuffles through screenshots, loads the live site on hover/click, and falls back to a flat render without WebGL.
- **`/achievements`** — a big-number stat grid.
- **`/about`** — long-form biography with a sticky contents rail that tracks the section you are reading.
- **`/random`** — drafts and miscellany, with a shuffling playlist player (handles tracks without audio previews).
- **SEO** — canonical URLs, Open Graph/Twitter cards, JSON-LD (`Person`, `WebSite`, `ProfilePage`, breadcrumbs), sitemap and robots, all from one site URL.
- **Guard-rail tests** — palette and font checks, data-shape checks, component rendering, and an export check that every page's canonical URL and the sitemap agree.

## Quick start

Requires Node.js 22 and pnpm 9 (`corepack enable`). Python 3 is only needed for the optional data scripts.

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # build + typecheck + tests
```

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Publish the social summary and export the site to `out/` |
| `pnpm check` | Build, type-check and run every test |
| `pnpm test` | Run the tests against an existing build |
| `pnpm preview` | Build and serve `out/` with Wrangler on port 8004 |
| `pnpm sync:contributions` | Refresh the GitHub calendar (needs `GITHUB_USERNAME`, plus `gh` login or `GITHUB_CONTRIBUTIONS_TOKEN`) |
| `pnpm sync:playlists` | Refresh playlists from public Spotify playlists (needs `SPOTIFY_PLAYLIST_IDS`) |
| `pnpm capture:work` | Screenshot every `/work` site into `public/design-work/` (needs Python Playwright) |
| `pnpm refresh` | Run every configured sync, keeping the old snapshot if one fails |

## Make it yours

Start with the first two files; the rest are content.

| File | What to change |
| --- | --- |
| `src/data/profile.ts` | Name, role, company, location, email, one-line bio, GitHub URL, first year of the timeline. Read by the header, footer, homepage, about page and structured data. |
| `src/lib/seo.ts` | `SITE_URL` (your domain), sharing image, Twitter handle. Canonicals, sitemap and robots follow it. |
| `src/data/timeline.ts` | Timeline entries and the four category names. |
| `src/data/projects.ts` | Projects (they appear on the timeline under Projects), their links and images. |
| `src/data/experience-details.ts` | "What I did / What I learned / Skills" for every timeline id. |
| `src/data/project-writeups.ts` | Optional long-form project notebooks. |
| `src/app/about/page.tsx` + `src/components/AboutContents.tsx` | Biography prose and its section list. |
| `src/app/achievements/page.tsx` | Achievement figures and headings. |
| `src/app/random/page.tsx` | The drafts list. |
| `src/data/design-work.json` | Sites shown in the `/work` laptop. Then run `pnpm capture:work` to replace the placeholder posters and favicons in `public/design-work/`. |
| `src/data/social-previews.json` | Contact icons and the post preview shown for each. |
| `src/data/listening.ts`, `src/data/playlists.json` | The homepage listening card and the `/random` playlist. A track's `preview` may be `null`. |
| `src/data/github-contributions.json` | Calendar snapshot — run `pnpm sync:contributions`. |
| `src/data/social-stats.json` | Social posts and views behind the counter and red calendar squares. Keep the same shape. |
| `public/img/portrait.jpg` | Your portrait (also the default sharing image). Update the size in `src/app/page.tsx` and `SHARE_IMAGE` if it changes. |
| `public/logos/`, `public/projects/`, `public/music/`, `public/social-previews/`, `public/random-mark.svg` | Placeholder images — replace or delete along with the data that points at them. |
| `src/app/icon.svg`, `src/app/apple-icon.png` | Favicon and home-screen icon. |
| `wrangler.toml`, `package.json` (`deploy`), `.github/workflows/deploy.yml` | Your Cloudflare Pages project name (placeholder `your-portfolio`). |

All JSON snapshots in `src/data/` (and the generated `public/social-summary.json`) ship as **sample data**. `pnpm check` verifies that every image a data file points to exists, so a missed rename fails the build rather than the page.

The palette test (`tests/design-system.test.mjs`) fails on any colour outside white, black, grey and the red family — loosen it if you want a different look.

## Deploy to Cloudflare Pages

The site is a static export in `out/`.

**Git integration (recommended):** in the Cloudflare dashboard create a Pages project from your repository with build command `pnpm build`, output directory `out`, and environment variable `NODE_VERSION=22`. Add your custom domain in the project settings and set the same origin as `SITE_URL`.

**Wrangler:** set the project name in `wrangler.toml` and the `deploy` script, then:

```sh
pnpm exec wrangler login
pnpm deploy
```

**GitHub Actions:** `.github/workflows/deploy.yml` runs `pnpm check` on every push and pull request. To deploy from Actions instead of the Git integration, set the repository variable `CLOUDFLARE_DEPLOY_ENABLED=true` and the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. `.github/workflows/contributions.yml` refreshes the calendar and playlists daily when the repository variables `GITHUB_USERNAME` and/or `SPOTIFY_PLAYLIST_IDS` are set.

## Project structure

```text
src/
  app/          Routes, page layouts, styles, metadata, sitemap and robots
  components/   Header, footer, timeline, calendar, players, the /work laptop
  data/         Profile, content and sample data snapshots
  lib/          SEO helpers, shuffle deck, social summary
public/         Fonts, the MacBook model and placeholder images
scripts/        Data sync, screenshot capture and export verification
tests/          Node test suite (node --test)
```

## Credits and licences

- Code: [MIT](LICENSE).
- Laptop model: [MacBook Pro M3 16-inch 2024](https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4) by **jackbaeten**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); rigged by **William Laverty** ([rigged-macbook-3d](https://github.com/william-laverty/rigged-macbook-3d)). The credit line on `/work` is required by the licence — keep it. Not affiliated with Apple.
- Fonts: [Inter Tight](https://github.com/rsms/inter) and [IBM Plex Mono](https://github.com/IBM/plex), both under the SIL Open Font License 1.1.
- Icons: [react-icons](https://github.com/react-icons/react-icons) (MIT, with each icon set under its own licence).
