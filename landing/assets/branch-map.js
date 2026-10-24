// Interactive branch map for the "Ver todas en el mapa" dialog (MapLibre GL + OpenFreeMap "Liberty").
// Bundled by tools/build.mjs and loaded only when the dialog opens. FixNow blue accents: water,
// main avenues and the pins; everything else keeps the detailed Liberty look. Street names in Spanish.
import maplibregl from 'maplibre-gl';
// Resolved by an esbuild alias in tools/build.mjs (no file extension, so the asset scanner skips it).
import css from 'maplibre-gl-css';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function brand(map) {
  // Road colours by class: motorway / trunk+primary / secondary+tertiary, for road, tunnel and bridge layers.
  const roads = [
    [/motorway(?!_link)/, '#8fb3f5', '#5d8de6'],
    [/motorway_link/, '#a9c5f8', '#6f9be9'],
    [/trunk_primary/, '#c3d7fb', '#8eb0ee'],
    [/secondary_tertiary/, '#ffffff', '#c4d4ef']
  ];
  for (const layer of map.getStyle().layers) {
    const {id, type} = layer;
    if (type === 'fill' && id === 'water') map.setPaintProperty(id, 'fill-color', '#cddffc');
    if (type === 'line' && /^waterway/.test(id)) map.setPaintProperty(id, 'line-color', '#a9c6f5');
    if (type === 'line' && /^(road|tunnel|bridge)_/.test(id)) {
      const match = roads.find(([pattern]) => pattern.test(id));
      if (match) map.setPaintProperty(id, 'line-color', /casing/.test(id) ? match[2] : match[1]);
    }
    // Spanish names first (OpenStreetMap "name:es"), then the local name.
    if (type === 'symbol' && map.getLayoutProperty(id, 'text-field')) {
      map.setLayoutProperty(id, 'text-field', ['coalesce', ['get', 'name:es'], ['get', 'name'], ['get', 'name_en']]);
    }
  }
}

export function mountBranchMap(container, branches, {onPick, initial = 0, bottomPadding = 0} = {}) {
  if (!document.getElementById('maplibre-css')) {
    const style = document.createElement('style');
    style.id = 'maplibre-css'; style.textContent = css;
    document.head.append(style);
  }
  const map = new maplibregl.Map({
    container, style: STYLE, center: branches[initial].lngLat, zoom: 12.4,
    attributionControl: {compact: true}, dragRotate: false, pitchWithRotate: false, touchPitch: false,
    cooperativeGestures: false
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({showCompass: false}), 'top-left');
  const markers = branches.map((branch, i) => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'bm-pin'; el.dataset.branch = i;
    el.setAttribute('aria-label', branch.name);
    el.innerHTML = `<span class="bm-pin-dot">${i + 1}</span><span class="bm-pin-label">${branch.name}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); onPick?.(i); });
    return new maplibregl.Marker({element: el, anchor: 'top', offset: [0, -23]}).setLngLat(branch.lngLat).addTo(map);
  });
  // Ready once the branded map has fully drawn (first "idle"), so the loader never reveals blank tiles.
  const ready = new Promise(resolve => map.once('load', () => {
    brand(map);
    // Keep the map credits collapsed to the small (i) button so they don't cover the map on phones.
    container.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
    map.resize();
    map.once('idle', resolve);
  }));
  const all = () => {
    const bounds = new maplibregl.LngLatBounds();
    branches.forEach(b => bounds.extend(b.lngLat));
    return bounds;
  };
  return {
    ready,
    markers: markers.map(m => m.getElement()),
    // Room for the pin labels (they extend ~60px each side of the dot and ~30px below it).
    overview() {
      const side = Math.min(110, container.clientWidth * .22);
      map.fitBounds(all(), {padding: {top: 70, left: side, right: side, bottom: bottomPadding + 80}, duration: 0});
    },
    focus(i, {animate = true} = {}) {
      // Smooth pan at the current zoom (no zooming out): the map slides straight to the branch.
      // The first focus (dialog open) still sets street-level zoom.
      const zoom = map.getZoom() < 14 ? 15 : map.getZoom();
      map.easeTo({center: branches[i].lngLat, zoom, padding: {bottom: bottomPadding, top: 0, left: 0, right: 0}, duration: animate ? 700 : 0, easing: t => 1 - Math.pow(1 - t, 3), essential: true});
    },
    resize() { map.resize(); }
  };
}
