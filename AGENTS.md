# FixNow website — instructions for AI assistants (Claude, ChatGPT/Codex)

Static landing page for FixNow (Apple repair, CABA). Spanish (es-AR) copy, voseo.

## Where to edit
- `landing/index.html` — all page text. The page has a desktop and a mobile copy of most sections: change BOTH.
- `landing/script.js` — repair data (`diagnosticData`: times, warranty, texts) and WhatsApp messages.
- `landing/styles.css` — styles. `landing/privacidad.html` — privacy policy.
- `landing/assets/` — images. Keep WebP, keep file sizes small.
- Never edit `dist/`, `dist-staging/` or `landing/assets/phone3d.js` unless asked; never commit build output.

## Facts that must stay consistent
Main WhatsApp (Belgrano): 5491156327284. Branch numbers, addresses and hours appear in branch cards (desktop + mobile), the "Ver todas en el mapa" dialog and the JSON-LD block in `<head>` — update all of them together.

## Check before pushing
`pnpm install && node tools/build.mjs --site https://fixnow.com.ar && node tools/build.mjs --site https://mediumpurple-pig-827825.hostingersite.com --staging && node tools/check-build.mjs` must pass. If you intentionally change a fact that `tools/check-build.mjs` asserts (hours, links, labels), update that assertion too.

## Deploy
Every push to `main` goes live: GitHub Actions (`.github/workflows/deploy.yml`) builds the production package (`dist/`, https://fixnow.com.ar) and uploads it over FTP to the Hostinger website that serves fixnow.com.ar (formerly the mediumpurple-pig staging site; there is no separate staging anymore). `dist-staging/` is still built for the local board and the check script.
