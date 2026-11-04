// Visual regression check: no word may split across lines, no text may overflow its box, and no heading line
// may hold a single short word ("DE", "EN"). Serves dist/ locally, sweeps every page from 320 to 1920 px wide at
// three heights with real (classic) scrollbars, and fails on any hit.
//   node tools/check-text-fit.mjs            (uses CHROME_PATH, else Playwright's cached Chromium)
//   node tools/check-text-fit.mjs --fast     (fewer widths)
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {chromium} from 'playwright-core';

const root = path.resolve('dist');
const pages = ['index.html', 'contacto.html', 'nosotros.html', 'privacidad.html', '404.html'];
const fast = process.argv.includes('--fast');
const widths = [];
for (let w = 320; w <= 1920; w += fast ? 40 : (w < 1000 ? 5 : 10)) widths.push(w);
const heights = fast ? [800] : [640, 800, 1000];

const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json'};
const server = createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try { res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'}).end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/`;

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const dirs = existsSync(cache) ? readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().reverse() : [];
  for (const d of dirs) { const p = path.join(cache, d, 'chrome-linux64/chrome'); if (existsSync(p)) return p; }
  return undefined;
}

// Runs in the page: returns the issues visible at the current viewport.
function scan() {
  const out = [];
  const visible = el => {
    if (el.closest('details:not([open]) > :not(summary), .ghost, .bigword, script, style, svg')) return false;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    return el.getClientRects().length > 0;
  };
  const name = el => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !visible(el)) continue;
    const re = /[^\s]+/g;
    for (let m; (m = re.exec(n.nodeValue));) {
      if (m[0].length < 2) continue;
      const range = document.createRange();
      range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
      const tops = [...range.getClientRects()].filter(r => r.width > .5).map(r => r.top);
      if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 4)
        out.push({kind: 'split word', text: m[0].replace(/­/g, '-'), at: name(el)});
    }
  }
  for (const h of document.querySelectorAll('h1,h2,h3')) {
    if (!visible(h)) continue;
    const lines = new Map();
    const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      if (!visible(n.parentElement)) continue;
      const re = /[^\s]+/g;
      for (let m; (m = re.exec(n.nodeValue));) {
        const range = document.createRange();
        range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length);
        const rect = [...range.getClientRects()].find(r => r.width > .5);
        if (!rect) continue;
        const key = Math.round(rect.top / 6);
        (lines.get(key) || lines.set(key, []).get(key)).push(m[0]);
      }
    }
    if (lines.size < 2) continue;
    for (const words of lines.values())
      if (words.length === 1 && words[0].replace(/[^\p{L}\p{N}]/gu, '').length <= 3)
        out.push({kind: 'stranded word', text: words[0], at: name(h)});
  }
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,li,button,strong,b,span,figcaption,summary')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.overflowX !== 'visible' || !el.clientWidth) continue;
    if (el.scrollWidth > el.clientWidth + 1) out.push({kind: 'overflow', text: el.textContent.trim().slice(0, 40), at: name(el)});
  }
  return out;
}

// Playwright hides scrollbars by default; real desktop browsers lose ~15px to them, so keep them.
const browser = await chromium.launch({executablePath: chromePath(), ignoreDefaultArgs: ['--hide-scrollbars']});
const found = new Map();
for (const page of pages) {
  const tab = await browser.newPage({viewport: {width: 1440, height: 900}});
  await tab.goto(base + page, {waitUntil: 'networkidle'});
  await tab.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
  for (const h of heights) for (const w of widths) {
    await tab.setViewportSize({width: w, height: h});
    await tab.waitForTimeout(20);
    for (const x of await tab.evaluate(scan)) {
      const key = `${page}  ${x.kind}  ${x.at}  "${x.text}"`;
      (found.get(key) || found.set(key, []).get(key)).push(`${w}x${h}`);
    }
  }
  await tab.close();
}
await browser.close();
server.close();

for (const [key, at] of found) {
  const ws = [...new Set(at.map(s => +s.split('x')[0]))].sort((a, b) => a - b);
  console.log(`FAIL ${key} at ${ws.length > 6 ? `${ws[0]}–${ws.at(-1)} px (${ws.length} widths)` : ws.join(', ') + ' px'}`);
}
console.log(found.size ? `${found.size} text-fit issue(s)` : `PASS text fit: ${pages.length} pages, ${widths.length} widths x ${heights.length} heights`);
process.exit(found.size ? 1 : 0);
