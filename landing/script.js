/* Source artboard interactions, translated to native DOM controls. */
'use strict';
const diagnosticData = {"desktop": [{"num": "01", "title": "Pantalla", "symptom": "Vidrio roto, manchas o sin imagen.", "time": "Desde 30 min", "zone": {"top": "4px", "left": "4px", "w": "158px", "h": "328px", "r": "26px"}}, {"num": "02", "title": "Batería", "symptom": "Se descarga rápido o no carga.", "time": "Desde 20 min", "zone": {"top": "110px", "left": "30px", "w": "106px", "h": "170px", "r": "12px"}}, {"num": "03", "title": "Vidrio trasero", "symptom": "Roto o con fisuras.", "time": "Entre 1 y 3 h según el modelo", "zone": {"top": "-8px", "left": "-8px", "w": "182px", "h": "352px", "r": "36px"}}, {"num": "04", "title": "Carga", "symptom": "No carga, carga lento o se corta.", "time": "Consultá por WhatsApp", "zone": {"top": "300px", "left": "55px", "w": "56px", "h": "38px", "r": "10px"}}, {"num": "05", "title": "Cámara", "symptom": "Fotos borrosas o no funciona.", "time": "Consultá por WhatsApp", "zone": {"top": "14px", "left": "14px", "w": "70px", "h": "70px", "r": "18px"}}, {"num": "06", "title": "Equipo mojado", "symptom": "No enciende o presenta fallas. Apagalo y traelo cuanto antes.", "time": "Consultá por WhatsApp", "zone": {"top": "60px", "left": "20px", "w": "126px", "h": "250px", "r": "50%"}}], "mobile": [{"num": "01", "title": "Pantalla", "symptom": "Vidrio roto, manchas o sin imagen.", "time": "Desde 30 min", "zone": {"top": "3px", "left": "3px", "w": "120px", "h": "250px", "r": "20px"}}, {"num": "02", "title": "Batería", "symptom": "Se descarga rápido o no carga.", "time": "Desde 20 min", "zone": {"top": "84px", "left": "23px", "w": "80px", "h": "130px", "r": "9px"}}, {"num": "03", "title": "Vidrio trasero", "symptom": "Roto o con fisuras.", "time": "Entre 1 y 3 h según el modelo", "zone": {"top": "-7px", "left": "-7px", "w": "140px", "h": "270px", "r": "28px"}}, {"num": "04", "title": "Carga", "symptom": "No carga, carga lento o se corta.", "time": "Consultá por WhatsApp", "zone": {"top": "228px", "left": "42px", "w": "42px", "h": "30px", "r": "8px"}}, {"num": "05", "title": "Cámara", "symptom": "Fotos borrosas o no funciona.", "time": "Consultá por WhatsApp", "zone": {"top": "10px", "left": "10px", "w": "54px", "h": "54px", "r": "14px"}}, {"num": "06", "title": "Equipo mojado", "symptom": "No enciende o presenta fallas. Apagalo y traelo cuanto antes.", "time": "Lo antes posible", "zone": {"top": "46px", "left": "15px", "w": "96px", "h": "190px", "r": "50%"}}]};
// Main WhatsApp (Belgrano). Repair buttons add the selected service to the message.
const whatsappLink = text => 'https://wa.me/5491156327284?text=' + encodeURIComponent(text);
function syncConsultLinks(service) {
  document.querySelectorAll('[data-consult]').forEach(link => { link.href = whatsappLink(`Hola, me estoy comunicando desde la web de FixNow. Quiero consultar por: ${service}.`); });
}
let selectedIssue = 0;
let selectedCamera = 'rear';
function selectIssue(index) {
  selectedIssue = index;
  const root = document.getElementById('diagnostico');
  const variant = window.matchMedia('(min-width: 900px)').matches ? 'desktop' : 'mobile';
  const issue = {...diagnosticData[variant][index]};
  if (index === 4) {
    issue.title = selectedCamera === 'front' ? 'Cámara frontal' : 'Cámara trasera';
    issue.symptom = selectedCamera === 'front' ? 'Selfies borrosas o cámara frontal sin imagen.' : 'Fotos borrosas o cámara trasera sin imagen.';
  }
  root.querySelector('.camera-options').hidden = index !== 4;
  root.querySelectorAll('[data-camera-view]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.cameraView === selectedCamera));
  });
  root.querySelectorAll('[data-issue]').forEach(button => {
    const selected = Number(button.dataset.issue) === index;
    button.classList.toggle('on', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  root.querySelectorAll('[data-service-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.servicePanel) !== index; });
  const panel = root.querySelector(`[data-service-panel="${index}"]`);
  panel.querySelectorAll('[data-detail]').forEach(field => { field.textContent = issue[field.dataset.detail]; });
  syncConsultLinks(issue.title);
  updateExplodedPhone(root, index, issue.title);
  syncRepairReplay();
  scheduleWhatsAppPosition();
}
function syncRepairReplay() {
  const root = document.getElementById('diagnostico');
  const button = root.querySelector('[data-repair-replay]');
  const failed = root.querySelector('.phone3d-failed');
  button.hidden = ![0, 2].includes(selectedIssue) || Boolean(failed);
  // While the 3D phone loads, keep the button's space so the card does not grow when it appears.
  button.style.visibility = root.querySelector('.phone3d-ready') ? '' : 'hidden';
}
syncConsultLinks(diagnosticData.mobile[0].title);
document.querySelectorAll('[data-issue]').forEach(button => {
  button.addEventListener('click', () => selectIssue(Number(button.dataset.issue)));
});
document.querySelectorAll('[data-camera-view]').forEach(button => {
  button.addEventListener('click', () => { selectedCamera = button.dataset.cameraView; selectIssue(4); });
});
document.querySelector('[data-repair-replay]').addEventListener('click', () => selectIssue(selectedIssue));
const menu = document.getElementById('mobile-menu');
const opener = document.querySelector('[data-menu-open]');
const closer = document.querySelector('[data-menu-close]');
let previousOverflow = '';
const menuOutsideState = new Map();
function makeMenuOutsideInert(active) {
  if (active) {
    for (const element of document.body.children) if (element !== menu) {
      menuOutsideState.set(element, element.inert); element.inert = true;
    }
  } else {
    for (const [element, previous] of menuOutsideState) element.inert = previous;
    menuOutsideState.clear();
  }
}
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  makeMenuOutsideInert(false);
  opener.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = previousOverflow;
  opener.focus();
}
opener.addEventListener('click', () => {
  previousOverflow = document.body.style.overflow;
  menu.hidden = false;
  opener.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  closer.focus();
  makeMenuOutsideInert(true);
});
closer.addEventListener('click', closeMenu);
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (menu.hidden) return;
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
  if (event.key === 'Tab') {
    const items = [...menu.querySelectorAll('button, a[href]')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(min-width: 900px)').addEventListener('change', event => { if (event.matches) closeMenu(); selectIssue(selectedIssue); });


// Original conceptual phone layers share the diagnostic buttons as their only controls.
const selectedLayers = [['glass', 'screen'], ['battery'], ['back'], ['board'], ['back'], ['glass', 'screen', 'battery', 'board', 'back']];
function updateExplodedPhone(root, index, title) {
  const visual = root.querySelector('.phone-exploded');
  const opens = ![0, 2, 4].includes(index);
  visual.classList.toggle('is-revealed', opens);
  visual.classList.toggle('is-settled', opens);
  visual.dataset.fallbackIssue = String(index === 4 ? selectedCamera === 'front' ? 0 : 2 : index);
  const highlighted = index === 4 ? [selectedCamera === 'front' ? 'screen' : 'back'] : selectedLayers[index];
  visual.querySelectorAll('[data-layer]').forEach(layer => {
    layer.classList.toggle('is-selected', highlighted.includes(layer.dataset.layer));
  });
  visual.querySelector('.phone-caption').textContent = title;
  const posters = ['assets/phone-fallback-d0.webp', 'assets/phone-fallback-d1.webp', 'assets/phone-fallback-d2.webp', 'assets/phone-fallback-d3.webp', 'assets/phone-fallback-d4-rear.webp', 'assets/phone-fallback-d5.webp'];
  const poster = visual.querySelector('.phone-poster');
  const nextPoster = index === 4 && selectedCamera === 'front' ? 'assets/phone-fallback-d4-front.webp' : posters[index];
  // Decode before changing the visible still, so slow switches never show a blank box.
  const token = visual._posterToken = (visual._posterToken || 0) + 1;
  const image = new Image(); image.src = nextPoster;
  image.decode().then(() => { if (visual._posterToken === token) poster.src = nextPoster; }).catch(() => {});
  visual.dataset.selectedIssue = String(index);
  visual.dataset.cameraSide = selectedCamera;
  visual.dispatchEvent(new CustomEvent('phone-selection', {detail: {index, cameraSide: selectedCamera}}));
}
const phoneVisuals = document.querySelectorAll('.phone-exploded');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (![0, 2].includes(Number(entry.target.dataset.fallbackIssue ?? 0))) entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.2});
  phoneVisuals.forEach(visual => observer.observe(visual));
} else {
  phoneVisuals.forEach(visual => { if (![0, 2].includes(Number(visual.dataset.fallbackIssue ?? 0))) visual.classList.add('is-revealed'); });
}

// Keep the floating contact button off text and controls: lift it to the nearest free spot
// above its resting place, or tuck it away until the content under it has scrolled past.
const whatsappFloat = document.querySelector('.whatsapp-float');
const FLOAT_GAP = 10, FLOAT_MAX_LIFT = 260, FLOAT_STEP = 4;
const decorative = '.whatsapp-float, .bigword, .s58, .s162, .site-header, .menu-dialog';
function coversContent(x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest(decorative)) continue;
    if (el.closest('a, button, input, select, textarea, [role="button"]')) return true;
    for (const node of el.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
  }
  return false;
}
function positionWhatsApp() {
  whatsappFloat.style.setProperty('--wa-lift', '0px');
  const home = whatsappFloat.getBoundingClientRect();
  const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
  const xs = [home.left - 6, home.left + 6, home.left + home.width / 2, home.right - 4];
  // Mark each sampled row of the column above the button as free or blocked.
  const rows = [];
  for (let y = home.bottom + FLOAT_GAP; y >= home.top - FLOAT_MAX_LIFT - FLOAT_GAP; y -= FLOAT_STEP) {
    rows.push({y, blocked: y < headerBottom || xs.some(x => coversContent(x, y))});
  }
  let lift = null;
  for (let l = 0; l <= FLOAT_MAX_LIFT; l += FLOAT_STEP) {
    const top = home.top - l - FLOAT_GAP, bottom = home.bottom - l + FLOAT_GAP;
    if (!rows.some(row => row.blocked && row.y >= top && row.y <= bottom)) { lift = l; break; }
  }
  const tucked = lift === null;
  whatsappFloat.classList.toggle('is-tucked', tucked);
  whatsappFloat.tabIndex = tucked ? -1 : 0;
  whatsappFloat.style.setProperty('--wa-lift', (tucked ? 0 : lift) + 'px');
}
// Measure after scrolling settles (including the mobile snap), not on every frame.
let floatTimer = 0;
function scheduleWhatsAppPosition() {
  clearTimeout(floatTimer);
  floatTimer = setTimeout(() => requestAnimationFrame(positionWhatsApp), 90);
}
window.addEventListener('scroll', scheduleWhatsAppPosition, {passive: true});
window.addEventListener('scrollend', scheduleWhatsAppPosition);
// Reveal animations move text after a scroll settles; measure again once they finish.
document.addEventListener('transitionend', scheduleWhatsAppPosition, {passive: true});
document.addEventListener('animationend', scheduleWhatsAppPosition, {passive: true});
if ('ResizeObserver' in window) new ResizeObserver(scheduleWhatsAppPosition).observe(document.body);
window.addEventListener('resize', scheduleWhatsAppPosition);
window.addEventListener('load', scheduleWhatsAppPosition);
if (document.fonts) document.fonts.ready.then(scheduleWhatsAppPosition);
scheduleWhatsAppPosition();


// The hero and diagnostic card share assets, but have separate animation roles.
let phone3DModule;
const sceneHosts = document.querySelectorAll('.hero-phone, #diagnostico .phone-exploded');
const phone3DHosts = new WeakSet();
let phoneScenesStarted = false;
let nearObserver;
function webGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    return {canvas, gl};
  } catch { return false; }
}
let firstWebGLProbe = webGL2Available();
const canUseWebGL2 = Boolean(firstWebGLProbe);
function offer3D(visual) {
  if (visual._optInButton) return;
  const button = document.createElement('button');
  button.className = 'phone-opt-in'; button.type = 'button'; button.textContent = 'Ver en 3D';
  visual._optInButton = button;
  button.addEventListener('click', () => { button.remove(); loadPhoneScene(visual, true); });
  if (visual.matches('.hero-phone')) { visual.setAttribute('role', 'group'); visual.append(button); }
  else visual.closest('#diagnostico').querySelector('.diagnostic-detail').append(button);
}
// Percentage readout shown while the 3D files download; sits in the same box the phone will fill.
function showPhoneLoading(visual) {
  const box = visual.querySelector('.phone-scene') || visual;
  let el = box.querySelector('.phone-loading');
  if (!el) {
    el = document.createElement('div');
    el.className = 'phone-loading';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="phone-loading-pct">0%</span><span class="phone-loading-bar"><i></i></span><span class="phone-loading-label">Cargando modelo 3D</span>';
    box.append(el);
  }
  const pct = el.querySelector('.phone-loading-pct');
  return p => { pct.textContent = Math.round(p * 100) + '%'; el.style.setProperty('--p', p); };
}
async function loadPhoneScene(visual, optedIn = false) {
  if (!visual.clientWidth || !visual.clientHeight || phone3DHosts.has(visual)) return;
  if (!phoneScenesStarted || !canUseWebGL2) { if (!canUseWebGL2) visual.classList.add('phone3d-failed'); return; }
  if (navigator.connection?.saveData && !optedIn) { offer3D(visual); return; }
  phone3DHosts.add(visual);
  nearObserver?.unobserve(visual);
  try {
    phone3DModule ||= import('./assets/phone3d.js?v=20261015181305');
    const loader = showPhoneLoading(visual);
    const module = await phone3DModule;
    // mountPhone3D returns null when WebGL2 is unavailable.
    const probe = firstWebGLProbe; firstWebGLProbe = null;
    if (!await module.mountPhone3D(visual, {onProgress: loader, probe})) throw new Error('3D unavailable');
    visual.addEventListener('phone-selection-error', syncRepairReplay);
    syncRepairReplay();
    scheduleWhatsAppPosition();
  } catch {
    // Stop the loader and retain the selected phone poster.
    visual.classList.remove('phone3d-ready');
    visual.classList.add('phone3d-failed');
    visual.querySelector('.phone3d-stage')?.remove();
    syncRepairReplay();
  }
}
// The 3D assets are heavy: start only after the page has loaded and the browser is idle,
// so text, images and first paint are never delayed. Each phone then loads when it nears the viewport.
function startPhoneScenes() {
  if (phoneScenesStarted) return;
  phoneScenesStarted = true;
  if ('IntersectionObserver' in window) {
    nearObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) loadPhoneScene(entry.target); });
    }, {rootMargin: '0px'});
    sceneHosts.forEach(host => nearObserver.observe(host));
  } else { sceneHosts.forEach(host => loadPhoneScene(host)); }
}
const whenIdle = window.requestIdleCallback ? cb => requestIdleCallback(cb, {timeout: 1500}) : cb => setTimeout(cb, 200);
if (document.readyState === 'complete') whenIdle(startPhoneScenes);
else window.addEventListener('load', () => whenIdle(startPhoneScenes), {once: true});
window.addEventListener('resize', () => {
  if (!phoneScenesStarted) return;
  sceneHosts.forEach(host => {
    const rect = host.getBoundingClientRect();
    if (rect.bottom >= 0 && rect.top <= innerHeight) loadPhoneScene(host);
  });
});

// Reserve the replay button space from the first paint.
syncRepairReplay();

// Keep anchor jumps landing exactly below the sticky header, whatever its height on this device.
function syncHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (header) document.documentElement.style.setProperty('--header-h', Math.round(header.getBoundingClientRect().height) + 'px');
}
syncHeaderHeight();
window.addEventListener('resize', syncHeaderHeight);

// "Ver todas en el mapa": overview of the four branches in a modal dialog.
const branchMap = document.getElementById('branch-map');
if (branchMap && branchMap.showModal) {
  document.querySelectorAll('[data-open-map]').forEach(button => button.addEventListener('click', () => { const overview = branchMap.querySelector('img[data-src]'); if (overview && !overview.hasAttribute('src')) overview.src = overview.dataset.src; branchMap.showModal(); }));
  branchMap.querySelector('[data-close-map]').addEventListener('click', () => branchMap.close());
  // Clicking the dimmed backdrop closes it too.
  branchMap.addEventListener('click', event => { if (event.target === branchMap) branchMap.close(); });
} else {
  document.querySelectorAll('[data-open-map]').forEach(button => { button.hidden = true; });
}

const reviewsPause = document.querySelector('[data-reviews-pause]');
reviewsPause.addEventListener('click', () => {
  const paused = reviewsPause.getAttribute('aria-pressed') !== 'true';
  reviewsPause.setAttribute('aria-pressed', String(paused));
  reviewsPause.textContent = paused ? 'Reanudar reseñas' : 'Pausar reseñas';
  document.querySelector('.review-track').classList.toggle('is-paused', paused);
});
