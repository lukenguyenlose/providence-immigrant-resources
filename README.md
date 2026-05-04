# Providence Immigrant Resources

A static, multilingual website that supports Providence's immigrant community with:

1. **Resource map** — interactive map of food banks, transitional housing, legal aid, healthcare, ESL, and employment services.
2. **Benefits guide** — plain-language explainers for SNAP, Medicaid/RIte Care, Medicare, LIHEAP, WIC, RI Works, Section 8/RIHousing, and free tax help (VITA/ITIN), with explicit notes on what's available regardless of immigration status.
3. **Homepage** — landing page with quick links to the two sections and urgent-help phone numbers.

Built with vanilla HTML/CSS/JS and [Leaflet](https://leafletjs.com) on OpenStreetMap. No build step. No API keys. Free to host on GitHub Pages.

Languages: English, Español, Português, Kreyòl Ayisyen.

## Project structure

```
.
├── index.html              # homepage / landing
├── map/
│   └── index.html          # interactive resource map
├── benefits/
│   └── index.html          # benefits guide
├── css/
│   └── styles.css          # all styles
├── js/
│   ├── app.js              # map page logic
│   ├── benefits.js         # benefits page logic
│   └── translations.js     # all UI strings (EN/ES/PT/HT)
├── data/
│   ├── resources.json      # map locations
│   └── benefits.json       # benefit program guides
├── .nojekyll               # tells GitHub Pages to serve files as-is
└── README.md
```

## Local preview

Because the pages fetch JSON, you need to serve the folder over HTTP rather than opening files directly:

```bash
cd providence-immigrant-resources
python3 -m http.server 8080
# then open http://localhost:8080
```

URLs while previewing:
- Homepage: `http://localhost:8080/`
- Map: `http://localhost:8080/map/`
- Benefits: `http://localhost:8080/benefits/`

## Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `providence-immigrant-resources`).
2. Push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/providence-immigrant-resources.git
   git push -u origin main
   ```
3. GitHub repo → **Settings → Pages → Build and deployment**.
   - Source: *Deploy from a branch*
   - Branch: `main` / `(root)` → Save
4. Wait ~1 minute. Live at:
   `https://YOUR-USERNAME.github.io/providence-immigrant-resources/`

### Custom domain (optional)

Add a `CNAME` file at the repo root with your domain, point a CNAME DNS record to `YOUR-USERNAME.github.io`, then enable **Enforce HTTPS**.

## Editing content

### Map locations — `data/resources.json`

Append objects to the `resources` array:

```json
{
  "id": "unique-slug",
  "name": "Name of the organization",
  "category": "food",
  "address": "Street, City, RI ZIP",
  "lat": 41.8240,
  "lng": -71.4128,
  "phone": "(401) 555-1234",
  "website": "https://example.org",
  "hours": "Mon-Fri 9am-5pm",
  "languages": ["en", "es", "pt"],
  "notes": "One-line description."
}
```

Valid categories: `food`, `housing`, `legal`, `health`, `education`, `employment`. Find lat/lng by right-clicking on [openstreetmap.org](https://www.openstreetmap.org).

### Benefit programs — `data/benefits.json`

Each program has `name`, `summary`, `eligibility`, `documents`, `howToApply`, and `immigrationNote` — all keyed by language code:

```json
{
  "id": "snap",
  "icon": "food",
  "name":           { "en": "...", "es": "...", "pt": "...", "ht": "..." },
  "summary":        { "en": "...", "es": "...", "pt": "...", "ht": "..." },
  "eligibility":    { "en": "...", "es": "...", "pt": "...", "ht": "..." },
  "documents":      { "en": "...", "es": "...", "pt": "...", "ht": "..." },
  "howToApply":     { "en": "...", "es": "...", "pt": "...", "ht": "..." },
  "immigrationNote":{ "en": "...", "es": "...", "pt": "...", "ht": "..." },
  "links": [{ "label": "...", "url": "https://..." }]
}
```

Valid `icon` values: `food`, `health`, `energy`, `money`, `house`. Missing translations fall back to English.

Update `lastUpdated` at the top of each JSON file when you edit it.

### UI strings — `js/translations.js`

All non-data UI text (nav, headings, buttons) lives here. To add a new language:

1. Add a top-level key in `translations.js` (e.g. `fr: { ... }`).
2. Add it to `SUPPORTED_LANGS` in `js/app.js` and the `SUPPORTED` array in `js/benefits.js` and the homepage script in `index.html`.
3. Add a button to the `.lang-switch` block on each of the three pages.

## Important caveats before you publish

- **Verify every entry.** The seed data is a starting point — phone numbers, hours, and addresses change. Confirm with each organization before launch.
- **Verify benefit details.** Eligibility and application processes change frequently. The immigration notes reflect general practice but exceptions exist. A legal aid organization (Dorcas International, RI Center for Justice, Progreso Latino) should review the benefits content before launch.
- **Add a "Submit a resource" link** — easiest path is a Google Form or a GitHub Issues template.
- **Accessibility pass** — run [WAVE](https://wave.webaim.org) and [Lighthouse](https://developers.google.com/web/tools/lighthouse) once live.

## Suggested next steps

- Add print-friendly stylesheets so people can hand out one-pagers.
- Add a "near me" geolocation filter on the map.
- Add per-resource translated descriptions (current schema stores `notes` once in English).
- Partner with Dorcas International, Progreso Latino, and the Refugee Dream Center for content review.

## License

MIT for the code. Resource data is a community contribution — feel free to copy, share, and adapt.
