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
function selectIssue(index, options = {}) {
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
  updateExplodedPhone(root, index, issue.title, options);
  syncRepairReplay();
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
  button.addEventListener('click', () => selectIssue(Number(button.dataset.issue), {animate: true}));
});
document.querySelectorAll('[data-camera-view]').forEach(button => {
  button.addEventListener('click', () => { selectedCamera = button.dataset.cameraView; selectIssue(4, {animate: true}); });
});
document.querySelector('[data-repair-replay]').addEventListener('click', () => selectIssue(selectedIssue, {animate: true}));
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
let menuAnimations = [];
let menuTransition = 0;
let menuClosing = false;
function cancelMenuAnimations() {
  menuAnimations.forEach(animation => animation.cancel());
  menuAnimations = [];
}
function closeMenu({immediate = false} = {}) {
  if (menu.hidden || (menuClosing && !immediate)) return;
  const transition = ++menuTransition;
  cancelMenuAnimations();
  menuClosing = true;
  const finish = () => {
    if (transition !== menuTransition) return;
    menu.hidden = true;
    menuClosing = false;
    cancelMenuAnimations();
    makeMenuOutsideInert(false);
    opener.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    // Keep an anchor link's destination in view when the closing fade finishes.
    if (opener.getClientRects().length) opener.focus({preventScroll: true});
  };
  if (immediate || typeof menu.animate !== 'function') { finish(); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animation = menu.animate([
    {clipPath: 'inset(0 0 0 0)', opacity: 1},
    {clipPath: reduced ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)', opacity: reduced ? 0 : 1}
  ], {duration: reduced ? 100 : 320, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'both'});
  menuAnimations.push(animation);
  animation.finished.then(finish).catch(() => {});
  // Safety net: finish even if the browser throttles animations (e.g. a background tab).
  setTimeout(finish, (reduced ? 100 : 320) + 120);
}
opener.addEventListener('click', () => {
  if (!menu.hidden && !menuClosing) return;
  const wasHidden = menu.hidden;
  ++menuTransition;
  cancelMenuAnimations();
  menuClosing = false;
  if (wasHidden) {
    previousOverflow = document.body.style.overflow;
    menu.hidden = false;
    makeMenuOutsideInert(true);
  }
  opener.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  closer.focus();
  if (typeof menu.animate !== 'function') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  menuAnimations.push(menu.animate([
    {clipPath: reduced ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)', opacity: reduced ? 0 : 1},
    {clipPath: 'inset(0 0 0 0)', opacity: 1}
  ], {duration: reduced ? 120 : 420, easing: 'cubic-bezier(.77,0,.175,1)', fill: 'both'}));
  if (!reduced) menu.querySelectorAll('.mlink, .s212').forEach((link, index) => {
    menuAnimations.push(link.animate([
      {opacity: 0, transform: 'translateY(18px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 360, delay: 160 + index * 45, easing: 'ease-out', fill: 'both'}));
  });
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
window.matchMedia('(min-width: 900px)').addEventListener('change', event => { if (event.matches) closeMenu({immediate: true}); selectIssue(selectedIssue); });


// Original conceptual phone layers share the diagnostic buttons as their only controls.
const selectedLayers = [['glass', 'screen'], ['battery'], ['back'], ['board'], ['back'], ['glass', 'screen', 'battery', 'board', 'back']];
function updateExplodedPhone(root, index, title, options = {}) {
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
  visual.dataset.playRequested = String(options.animate === true);
  visual.dispatchEvent(new CustomEvent('phone-selection', {detail: {index, cameraSide: selectedCamera, animate: options.animate === true}}));
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

// The hero has its own WhatsApp button; the floating one shows everywhere else.
const whatsappFloat = document.querySelector('.whatsapp-float');
const inlineWhatsApp = document.querySelectorAll('.real-hero .hero-cta-primary');
if (whatsappFloat && inlineWhatsApp.length && 'IntersectionObserver' in window) {
  const onScreen = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) onScreen.add(entry.target); else onScreen.delete(entry.target); });
    const hide = onScreen.size > 0;
    whatsappFloat.classList.toggle('is-hero', hide);
    whatsappFloat.tabIndex = hide ? -1 : 0;
  });
  inlineWhatsApp.forEach(cta => observer.observe(cta));
}

// The real-photo hero needs no WebGL. Only the service illustration loads a 3D scene.
let phone3DModule;
const sceneHosts = document.querySelectorAll('#diagnostico .phone-exploded');
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
let firstWebGLProbe;
let canUseWebGL2;
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
  if (!phoneScenesStarted) return;
  if (navigator.connection?.saveData && !optedIn) { offer3D(visual); return; }
  if (canUseWebGL2 === undefined) { firstWebGLProbe = webGL2Available(); canUseWebGL2 = Boolean(firstWebGLProbe); }
  if (!canUseWebGL2) { visual.classList.add('phone3d-failed'); return; }
  phone3DHosts.add(visual);
  nearObserver?.unobserve(visual);
  // Mount at the start of the repair instead of the finished result. The scene only advances
  // while it is on screen, so the repair plays once when the visitor reaches it, not off screen.
  // It is a single bounded playback (like the replay button), so it also runs with reduced motion.
  if (!visual.dataset.playRequested) visual.dataset.playRequested = 'true';
  try {
    phone3DModule ||= import('./assets/phone3d.js?v=20261015181305');
    const loader = showPhoneLoading(visual);
    const module = await phone3DModule;
    // mountPhone3D returns null when WebGL2 is unavailable.
    const probe = firstWebGLProbe; firstWebGLProbe = null;
    if (!await module.mountPhone3D(visual, {onProgress: loader, probe})) throw new Error('3D unavailable');
    visual.addEventListener('phone-selection-error', syncRepairReplay);
    syncRepairReplay();
  } catch {
    // Stop the loader and retain the selected phone poster.
    visual.classList.remove('phone3d-ready');
    visual.classList.add('phone3d-failed');
    visual.querySelector('.phone3d-stage')?.remove();
    syncRepairReplay();
  }
}
// The 3D assets are heavy: start only after the page has loaded and the browser is idle,
// so text, images and first paint are never delayed. Then preload the repair scene right away,
// so it is ready (no poster, no loader) by the time the visitor scrolls to it.
// On very slow connections it still waits until the phone nears the viewport.
function startPhoneScenes() {
  if (phoneScenesStarted) return;
  phoneScenesStarted = true;
  if (!/2g/.test(navigator.connection?.effectiveType || '')) sceneHosts.forEach(host => loadPhoneScene(host));
  if ('IntersectionObserver' in window) {
    nearObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) loadPhoneScene(entry.target); });
    }, {rootMargin: '0px', threshold: 0.15});
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

// Desktop header is transparent over the hero photo and gets its background once the page scrolls.
const siteHeader = document.querySelector('.site-header');
function syncHeaderBackground() { siteHeader?.classList.toggle('is-scrolled', window.scrollY > 8); }
window.addEventListener('scroll', syncHeaderBackground, {passive: true});
syncHeaderBackground();

// Keep anchor jumps landing exactly below the sticky header, whatever its height on this device.
function syncHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (header) document.documentElement.style.setProperty('--header-h', Math.round(header.getBoundingClientRect().height) + 'px');
}
syncHeaderHeight();
window.addEventListener('resize', syncHeaderHeight);

// FAQ: animate the answer open and closed instead of the native instant jump.
document.querySelectorAll('.faq-list details').forEach(item => {
  const summary = item.querySelector('summary');
  const answer = item.querySelector('summary + p');
  if (item.open) item.classList.add('is-open');
  let animation;
  summary.addEventListener('click', event => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !answer.animate) {
      requestAnimationFrame(() => item.classList.toggle('is-open', item.open));
      return;
    }
    event.preventDefault();
    animation?.cancel();
    const opening = !item.classList.contains('is-open');
    item.classList.toggle('is-open', opening);
    if (opening) item.open = true;
    const height = answer.scrollHeight;
    const pad = getComputedStyle(answer).paddingBottom;
    const shut = {height: '0px', paddingBottom: '0px', opacity: 0}, full = {height: height + 'px', paddingBottom: pad, opacity: 1};
    animation = answer.animate(opening ? [shut, full] : [full, shut],
      {duration: opening ? 260 : 200, easing: 'cubic-bezier(.2,.7,.2,1)'}
    );
    const current = animation;
    const done = () => { if (animation !== current) return; if (!opening) item.open = false; current.cancel(); animation = null; };
    animation.onfinish = done;
    // Safety net: finish even if the browser throttles animations (e.g. a background tab).
    setTimeout(done, 400);
  });
});

// Mobile branches: one full-width card at a time. The title and the name buttons follow the card in view,
// and tapping a name scrolls to that branch.
const branchSnap = document.getElementById('branch-snap');
if (branchSnap) {
  const cards = [...branchSnap.querySelectorAll('.bcard')];
  const tabs = [...document.querySelectorAll('[data-branch-dot]')];
  const title = document.querySelector('.branch-title');
  let shown = -1;
  const current = () => Math.round(branchSnap.scrollLeft / Math.max(1, cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : branchSnap.clientWidth));
  // While a tapped name scrolls to its card, keep showing that name (not the cards slid past on the way).
  let lockTo = null, lockTimer = 0;
  const show = i => {
    if (i === shown) return;
    shown = i;
    tabs.forEach((tab, n) => tab.setAttribute('aria-pressed', String(n === i)));
    if (title) {
      title.textContent = tabs[i].textContent + '.';
      title.classList.remove('is-swapping'); void title.offsetWidth; title.classList.add('is-swapping');
    }
  };
  const sync = () => {
    const i = Math.max(0, Math.min(cards.length - 1, current()));
    if (lockTo !== null) { if (i === lockTo) lockTo = null; return; }
    show(i);
  };
  // Page position after a tap: the full title stays visible and "Cómo llegar" is on screen. It is measured
  // against the tallest card so every branch lands in exactly the same place.
  const settleY = () => {
    const section = branchSnap.closest('.mobile');
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
    const labelY = scrollY + section.querySelector('.mono').getBoundingClientRect().top - headerHeight - 18;
    const titleLimit = scrollY + section.querySelector('h2').getBoundingClientRect().top - headerHeight - 6;
    const lowest = Math.max(...cards.map(card => (card.querySelector('.branch-directions') || card).getBoundingClientRect().bottom));
    const directionsY = scrollY + lowest - innerHeight + 12;
    // When the whole section fits one screen, line it up under the header so nothing of the next section shows.
    const box = section.getBoundingClientRect();
    if (box.height <= innerHeight - headerHeight + 1) return Math.max(0, scrollY + box.top - headerHeight);
    // Otherwise never scroll past the end of the section.
    const sectionEndY = scrollY + box.bottom - innerHeight;
    return Math.max(0, Math.min(sectionEndY, titleLimit, Math.max(labelY, directionsY)));
  };
  // One eased animation moves the page and the card together (two native smooth scrolls cannot run at once).
  let tween = 0;
  tabs.forEach((tab, n) => tab.addEventListener('click', () => {
    lockTo = n;
    clearTimeout(lockTimer);
    lockTimer = setTimeout(() => { lockTo = null; sync(); }, 1500);
    show(n);
    const fromX = branchSnap.scrollLeft, toX = cards[n].offsetLeft - cards[0].offsetLeft;
    const fromY = scrollY, toY = Math.abs(settleY() - scrollY) < 4 ? scrollY : settleY();
    cancelAnimationFrame(tween);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { branchSnap.scrollLeft = toX; window.scrollTo(0, toY); lockTo = null; return; }
    const root = document.documentElement;
    root.style.scrollSnapType = 'none'; root.style.scrollBehavior = 'auto';
    branchSnap.style.scrollSnapType = 'none'; branchSnap.style.scrollBehavior = 'auto';
    const duration = 520, start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const t = Math.min(1, (now - start) / duration), e = ease(t);
      branchSnap.scrollLeft = fromX + (toX - fromX) * e;
      window.scrollTo(0, fromY + (toY - fromY) * e);
      if (t < 1) { tween = requestAnimationFrame(step); return; }
      branchSnap.style.scrollSnapType = ''; branchSnap.style.scrollBehavior = '';
      root.style.scrollSnapType = ''; root.style.scrollBehavior = '';
      lockTo = null; sync();
    };
    tween = requestAnimationFrame(step);
  }));
  branchSnap.addEventListener('scroll', sync, {passive: true});
  sync();
}


// Desktop Sucursales: hovering a branch card shows its name in the title; clicking one (buttons included) keeps it.
(() => {
  const title = document.querySelector('.branch-title-desk');
  const cards = [...document.querySelectorAll('#sucursales .desktop .bcard')];
  if (!title || !cards.length) return;
  const fallback = title.textContent;
  let pinned = null;
  const nameOf = card => card.querySelector('h3').textContent.trim();
  const show = text => {
    if (title.textContent === text) return;
    title.textContent = text;
    title.classList.remove('is-swapping'); void title.offsetWidth; title.classList.add('is-swapping');
  };
  const rest = () => show(pinned ? nameOf(pinned) + '.' : fallback);
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => show(nameOf(card) + '.'));
    card.addEventListener('mouseleave', rest);
    card.addEventListener('click', e => {
      if (e.target.closest('.bcard-mapchip, .branch-photo')) return;
      pinned = pinned === card && !e.target.closest('a') ? null : card;
      cards.forEach(c => c.classList.toggle('is-pinned', c === pinned));
      rest();
    });
  });
})();

// Branch photos open full size in a lightbox (✕, a click outside or Escape closes it).
(() => {
  const photos = document.querySelectorAll('#sucursales .branch-photo');
  if (!photos.length || !window.HTMLDialogElement) return;
  const box = document.createElement('dialog');
  box.className = 'photo-lightbox';
  box.setAttribute('aria-label', 'Foto de la sucursal');
  box.innerHTML = '<button class="photo-lightbox-close" type="button" aria-label="Cerrar foto"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img alt=""><p class="photo-lightbox-caption"></p>';
  document.body.append(box);
  const img = box.querySelector('img'), caption = box.querySelector('.photo-lightbox-caption');
  const close = () => {
    if (!box.open || box.classList.contains('is-closing')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { box.close(); return; }
    box.classList.add('is-closing');
    setTimeout(() => { box.classList.remove('is-closing'); box.close(); }, 180);
  };
  photos.forEach(photo => {
    photo.setAttribute('role', 'button');
    photo.setAttribute('tabindex', '0');
    const open = () => {
      img.src = photo.currentSrc || photo.src;
      img.alt = photo.alt;
      caption.textContent = photo.closest('.bcard')?.querySelector('h3')?.textContent.trim() || '';
      box.showModal();
    };
    photo.addEventListener('click', open);
    photo.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  box.querySelector('.photo-lightbox-close').addEventListener('click', close);
  box.addEventListener('click', e => { if (e.target === box) close(); });
  box.addEventListener('cancel', e => { e.preventDefault(); close(); });
})();

// "Ver todas en el mapa": overview of the four branches in a modal dialog.
const branchMap = document.getElementById('branch-map');
if (branchMap && branchMap.showModal) {
  // One branch is selected at a time: its pin, its row and its details (hours, WhatsApp, Cómo llegar).
  // The interactive map (MapLibre, loaded on first open) replaces the static picture; the picture stays
  // as the fallback if the map can't load (no WebGL, offline).
  const mapWrap = branchMap.querySelector('.bm-mapwrap');
  const mapStage = branchMap.querySelector('.bm-stage');
  let liveMap = null, liveLoading = null;
  const pick = (index, {center = true, smooth = true} = {}) => {
    branchMap.querySelectorAll('.bm-pin, .bm-item').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.branch) === index)));
    branchMap.querySelectorAll('.bm-detail').forEach(el => { el.hidden = Number(el.dataset.branch) !== index; });
    if (liveMap) { if (center) liveMap.focus(index, {animate: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches}); return; }
    // Static fallback: on phones the picture is wider than the screen, so slide the chosen pin to the middle.
    const pin = mapStage.querySelector(`.bm-pin[data-branch="${index}"]`);
    if (center && pin && mapWrap.scrollWidth > mapWrap.clientWidth) {
      const left = mapStage.offsetWidth * parseFloat(pin.style.left) / 100 - mapWrap.clientWidth / 2;
      mapWrap.scrollTo({left: Math.max(0, left), behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto'});
    }
  };
  // Branch coordinates come from the JSON-LD business info, so they live in one place.
  const branchPoints = () => {
    const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    return [...branchMap.querySelectorAll('.bm-item')].map(item => {
      const name = item.querySelector('b').textContent.trim();
      const node = graph.find(n => n.name === 'FixNow ' + name);
      return {name, lngLat: [node.geo.longitude, node.geo.latitude]};
    });
  };
  const startLiveMap = index => {
    if (liveLoading) return liveLoading;
    const host = document.createElement('div');
    host.className = 'bm-live';
    mapWrap.append(host);
    const phone = matchMedia('(max-width: 899px)').matches;
    liveLoading = import('./assets/branch-map.js?v=20261015181305').then(({mountBranchMap}) => {
      const map = mountBranchMap(host, branchPoints(), {initial: index, bottomPadding: phone ? 30 : 0, onPick: i => pick(i)});
      return map.ready.then(() => {
        liveMap = map;
        branchMap.classList.add('has-live-map');
        const current = Number(branchMap.querySelector('.bm-item[aria-pressed="true"]')?.dataset.branch || index);
        map.resize();
        // First view: all four branches; picking one then slides to it.
        pick(current, {center: false});
        map.overview();
      });
    }).catch(() => { host.remove(); liveLoading = null; });
    return liveLoading;
  };
  branchMap.querySelectorAll('.bm-pin, .bm-item').forEach(el => el.addEventListener('click', () => pick(Number(el.dataset.branch))));
  document.querySelectorAll('[data-open-map]').forEach(button => button.addEventListener('click', event => {
    const overview = branchMap.querySelector('img[data-src]');
    if (overview && !overview.hasAttribute('src')) overview.src = overview.dataset.src;
    branchMap.showModal();
    // Start on the branch the visitor was looking at in Sucursales (phones), otherwise the first one.
    const chosen = event.currentTarget.dataset.branch;
    const current = chosen !== undefined ? Number(chosen) : Number(document.querySelector('[data-branch-dot][aria-pressed="true"]')?.dataset.branchDot || 0);
    requestAnimationFrame(() => {
      if (liveMap) { pick(current, {center: false}); liveMap.resize(); liveMap.overview(); }
      else { pick(current, {smooth: false}); startLiveMap(current); }
    });
  }));
  // Fade and lift the dialog out before it actually closes.
  const closeMap = () => {
    if (!branchMap.open || branchMap.classList.contains('is-closing')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { branchMap.close(); return; }
    branchMap.classList.add('is-closing');
    setTimeout(() => { branchMap.classList.remove('is-closing'); branchMap.close(); }, 200);
  };
  branchMap.addEventListener('cancel', event => { event.preventDefault(); closeMap(); });
  branchMap.querySelector('[data-close-map]').addEventListener('click', closeMap);
  // Clicking the dimmed backdrop closes it too.
  branchMap.addEventListener('click', event => { if (event.target === branchMap) closeMap(); });
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
