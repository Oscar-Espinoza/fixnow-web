/* Medición de anuncios de FixNow: píxel de Meta y etiqueta de Google Ads.
   Pedido de Jhon (25/11/2026). El contador del CRM (w.js) es aparte y sigue igual.
   - Cada página: PageView en Meta y page_view en Google.
   - Toque en un botón de WhatsApp: «Contact» en Meta y la conversión de Google Ads.
   Para cambiar los códigos, solo estas tres líneas. */
(function () {
  var META_PIXEL = '1643735456136228';     // FIXNOW BELGRANO
  var GOOGLE_ADS = 'AW-806822764';         // cuenta Fix Now Argentina (809-034-3576)
  var GOOGLE_WA_LABEL = 'SbGuCOzG2uUZEOzG3IAD'; // conversión «Click Boton Flotante WhatsApp» (principal, Contactos)

  var WA = /^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\b|^whatsapp:/i;

  // Píxel de Meta (código base oficial, sin cambios de comportamiento).
  if (META_PIXEL) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }
  // Herramienta de parámetros de Meta (assets/meta-param-builder.js, pedido de Jhon 27/11): antes de
  // arrancar el píxel guarda la cookie _fbc cuando la visita llega con ?fbclid de un anuncio (o el
  // navegador de Instagram/Facebook trae el clic). El píxel lee esa cookie y manda la fbc en cada evento.
  var pixelStarted = false;
  function startPixel() {
    if (pixelStarted || !META_PIXEL || !window.fbq) return;
    pixelStarted = true;
    window.fbq('init', META_PIXEL);
    window.fbq('track', 'PageView');
  }
  if (META_PIXEL) {
    var pb = window.clientParamBuilder;
    if (pb && typeof pb.processAndCollectAllParams === 'function') {
      setTimeout(startPixel, 1500); // si tarda, el píxel arranca igual
      try { Promise.resolve(pb.processAndCollectAllParams(location.href)).then(startPixel, startPixel); } catch (err) { startPixel(); }
    } else {
      startPixel();
    }
  }

  // Etiqueta de Google (gtag.js), solo si ya está cargado el código AW-….
  if (GOOGLE_ADS) {
    var g = document.createElement('script'); g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_ADS);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ADS);
  }

  // Toque en WhatsApp = conversión (una vez por botón cada 2 segundos, para no contar dobles toques).
  var last = 0;
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return;
    if (!WA.test(a.getAttribute('href') || '')) return;
    var now = Date.now(); if (now - last < 2000) return; last = now;
    startPixel();
    try { if (window.fbq) window.fbq('track', 'Contact', { content_name: 'WhatsApp', content_category: location.pathname }); } catch (err) {}
    try {
      if (window.gtag && GOOGLE_ADS && GOOGLE_WA_LABEL) {
        window.gtag('event', 'conversion', { send_to: GOOGLE_ADS + '/' + GOOGLE_WA_LABEL, transport_type: 'beacon' });
      }
    } catch (err) {}
  }, true);
})();
