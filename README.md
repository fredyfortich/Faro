# Faro — community relief needs map (working prototype)

**Faro** ("lighthouse") is a prototype of the app you described: after an earthquake or
other catastrophe, people register what their household still lacks, and a shared map
shows government and relief organizations **where help is still missing** — per
neighborhood and town, never per person. When someone receives help and marks it,
their neighborhood's circle shrinks.

Everything runs in the browser: three tabs (**Nuestras necesidades** /
**Mapa** / **Evolución**) — with **Vías** (Invías road status) as a mode inside
the map, on a chip right after Higiene — Spanish first with English one tap
away, and a demo "simulate aid delivery" button so you can watch circles
shrink. Medellín appears as a label-only reference city (no needs mark).

Since v2 the scenario is the **real M 7.4 Chocó earthquake of August 10, 2026**:
real cities (Quibdó, Pereira, Manizales, Armenia, Cali, Buenaventura, plus the
quake-corridor municipalities El Cairo — ~10 km from the epicenter — Cartago,
Obando, Zarzal, Tuluá, Buga, Dosquebradas, Santa Rosa de Cabal, Calarcá,
Salento, Yumbo and Palmira), the real epicenter (4.844°N 76.242°W, ~110 km
deep, USGS us6000tjl2) and Invías-reported road closures. **Every needs count remains simulated** and the app says so in a
permanent banner — nobody has registered real needs through Faro, and inventing
them about a real disaster without labeling would be harmful.

> 🧪 **This is a prototype, not a deployable relief tool.** It proves the product
> and the map mechanics. What still separates it from the real thing is listed
> honestly below, and the full design review is in
> [`docs/PRODUCT-NOTES.md`](docs/PRODUCT-NOTES.md).

---

## 1. Try it (no installation)

- **Click-to-try demo:** the same app is published as a private shareable page:
  <https://claude.ai/code/artifact/0ca19c74-1ad8-4c95-801b-4885ad478421>
  (visible to the repo owner's Claude account; use the page's share menu to
  share it with others).
- **From this repository:** GitHub can host it for you, free:
  1. On GitHub, open **Settings → Pages**.
  2. Under *Build and deployment*, choose **Deploy from a branch**, pick this
     branch, folder **/ (root)**, and save.
  3. After a minute your app is live at
     `https://fredyfortich.github.io/Faro/` — open that on
     your phone, and use the browser's **"Add to Home Screen"** to install it
     like an app (it keeps working offline afterwards).

## 2. Run it on your computer

Any static file server works — no build step, no dependencies to install:

```bash
# from the repository root, either:
python3 -m http.server 8000        # if you have Python
npx serve .                        # if you have Node.js

# then open http://localhost:8000/
```

To try it on your phone against your computer, both must be on the same Wi-Fi;
open `http://<your-computer's-IP>:8000/`.

## 3. What you're looking at (tour for a first app)

An app like this is just **files the browser reads**. There is no magic:

| File | What it does |
|---|---|
| `index.html` | The skeleton: header, the two tabs, and the list of scripts to load |
| `css/styles.css` | All visual styling, including light/dark theme |
| `js/config.js` | The knobs: categories & colors, privacy threshold, zoom levels, expiry days |
| `js/strings.js` | Every piece of visible text, in English and Spanish |
| `js/seed.js` | Real cities/zones, real epicenter + road alerts (sourced); **simulated** baseline needs. **Adding a town = one object** — see the HOW-TO comment at the top of the file |
| `js/basemap.js` | OpenStreetMap tiles when online; built-in schematic of western Colombia offline |
| `js/store.js` | The "database": saves your profile & needs on the device, computes totals |
| `js/needs-view.js` | The **Our needs** tab: register household, add/receive/confirm needs |
| `js/map-view.js` | The **Mapa** tab: marks, category chips (incl. the Vías road-status mode), ranking panel, CSV export |
| `js/trends-view.js` | The **Evolución** tab: needs per day since the quake, most-critical ranking, your own registrations |
| `js/app.js` | Glue: language switch, tabs, toasts, startup, and the PIN-gated authorities contact export |
| `vendor/leaflet/` | [Leaflet](https://leafletjs.com), the standard open-source map library |
| `sw.js`, `manifest.webmanifest` | Make it installable + able to open offline (a **PWA**) |

The one architectural decision that matters: **`store.js` is the only file that
knows where data lives.** Today that's the device's local storage plus the seeded
demo numbers. In phase 2 you swap its internals for a shared online database and
*nothing else changes*.

## 4. What's real vs. simulated

| Works for real | Simulated in this prototype |
|---|---|
| Registering a household (size, zone; max. 10 people) | **Shared database** — your entries only live on your device |
| Registering / editing / removing needs per category | **Phone verification** — the number is asked for but not verified by SMS |
| "We received this" → your zone's count drops | **Other people receiving aid** — the "Simulate aid delivery" button stands in for it |
| Real geography, epicenter and Invías road alerts (Aug 17, 2026 cut) | **Every needs count** — the baseline numbers are illustrative, shaped by press reporting but invented |
| Live "today" point on the trends charts (moves with your registrations) | **The 7-day history** — simulated arcs consistent with the reported dynamics |
| Authorities contact export: Excel workbook, one sheet per city (About → 🔐) | **Its access control** — a demo PIN (2026) stands in for institutional sign-in + audit logging; sample contacts are clearly fake |
| Aggregation per zone, rolled up per city; privacy folding (counts under 3) | **Zone boundaries** — approximate points, not official comuna polygons |
| Freshness: needs must be re-confirmed after 14 days, expire at 30 | |
| Spanish/English, offline shell + schematic basemap, CSV export | |

## 5. How the map thinks (your spec, implemented)

- **Circle area ∝ people with open needs** (area, not radius — twice the people
  reads as twice the ink, which is the honest encoding).
- **Zoomed out** you see one mark per city; **zoom past level ~10.5** and cities
  split into neighborhoods/zones. Individuals are *never* shown — exactly as you
  specified.
- **One category at a time** for precise reading (your "choose the color
  category") — and **«Todas» shows composition donuts**: slices in a fixed
  category order with white separators and the total in the center, so the mix
  is visible at a glance. Identity never rides on color alone: chips carry
  names, marks carry counts, popups spell everything out, and the "Lo más
  crítico" panel is a ranked table (seven simultaneous hues are not
  distinguishable for colorblind viewers — measured with a palette validator,
  which is why the separators, labels and table exist).
- **Time is its own tab.** «Evolución» shows people with open needs per day
  since August 10, ordered by what is most critical today. Each category is a
  single-hue sparkline row (never seven lines on one chart — that fails
  colorblind separation); the last point is computed live, so your own
  registrations and the delivery simulator visibly move it.
- **Privacy threshold:** a neighborhood with fewer than 3 open reports in a
  category isn't drawn (its people still count in the town circle) — so the map
  can't be used to find "the one family that needs insulin" on a street.
- **Freshness:** your goal was a map that's still true *months* later. That
  only works if needs decay: after 14 days the app asks "still needed?", after
  30 days an unconfirmed need leaves the map until re-confirmed.

## 6. The steps from here (the honest roadmap)

**Phase 1 — this prototype (done).** Click around, show it to two or three
people who lived through a disaster response (a municipal civil-protection
officer if you can reach one), and write down what confuses them. Nothing
teaches faster.

**Phase 2 — make it shared (first real engineering step).** Replace the inside
of `store.js` with a hosted database + tiny API. For a beginner the friendliest
path is [Supabase](https://supabase.com) (free tier): tables `households`,
`needs`, `areas`; one server function that returns the aggregated counts per
area (never raw rows!). Host the front end on GitHub Pages/Netlify. Effort:
days, not months.

**Phase 3 — one household, once.** SMS verification (e.g. Twilio Verify) so a
phone number = one household; rate limits; server-side enforcement of the
privacy threshold; a moderation queue for suspicious spikes. This is also where
"one app per phone" becomes real — see the product notes for why *household*,
not phone, is the right unit.

**Phase 4 — pilot with refined geography and a real partner.** Replace the
approximate zone points with official comuna/barrio boundaries (municipal open
data or OpenStreetMap), and run a drill with one municipality or NGO. Add the
supply side: distribution events by organizations, and a hosting ("couch")
offer registry with matching. Add proxy registration ("I'm reporting for my
neighbor who has no phone") and a kiosk mode for shelters. Decide data
ownership and retention with the partner *before* collecting anything real.

**Phase 5 — scale & integrate.** If app stores matter, wrap the same code with
Capacitor; add an SMS/USSD reporting channel for feature phones; export in
[HXL](https://hxlstandard.org) (the humanitarian data standard) so UN/NGO
coordination systems can ingest it; connect to the government's civil
protection dashboard.

## 7. Things this prototype deliberately does

- **No exact addresses, no names on the map.** Aggregation is the privacy model.
- **A visible emergency disclaimer.** A needs map must never masquerade as a
  rescue channel — that's what 123 is for.
- **A "simulated reports" banner always on.** Real geography with simulated
  needs must never read as real data — a relief map that can be mistaken for a
  real one causes real harm.
- **Everything text-first and translated.** Disasters don't happen in one
  language.

Read [`docs/PRODUCT-NOTES.md`](docs/PRODUCT-NOTES.md) for the full design
review: what your original idea already got right, what was missing (water!
medication! households! decay!), the fraud/trust model, accessibility, and the
prior art (Ushahidi, Sahana) worth studying before building further.
