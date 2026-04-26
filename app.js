/* ============================================================
   MAKENA — app.js (VERSIÓN CORREGIDA)
   Tiendanube via Vercel Proxy
   ============================================================ */

// ─── CREDENCIALES ───────────────────────────────────────────
const TN_STORE_ID = '7599760';
const TN_BASE_URL = 'https://makenashop1.mitiendanube.com/';
const WHATSAPP_NUMBER = '5493757000000'; // No olvides verificar si este número sigue siendo el mismo

// ─── CONFIG ─────────────────────────────────────────────────
const PAGE_SIZE = 12;
const CATEGORY_EMOJIS = { agro: '🌾', bazar: '🏠', papeleria: '📎', default: '📦' };
const EMPTY_MESSAGES = {
  error: 'No pudimos cargar los productos. Intentá de nuevo más tarde.',
  comingSoon: '¡Próximamente! Los productos están en camino.',
  noResults: 'No encontramos productos con ese criterio.',
};

// ─── ASOCIACIONES SEMÁNTICAS (búsqueda inteligente) ─────────
const SEARCH_ASSOCIATIONS = {
  // — BAZAR / Cocina (más extensa) —
  'olla': ['cacerola', 'sarten', 'paila', 'menaje', 'cocina', 'bazar', 'hervir', 'acero', 'aluminio'],
  'sarten': ['olla', 'cacerola', 'plancha', 'antiadherente', 'cocina', 'bazar', 'freir'],
  'cacerola': ['olla', 'sarten', 'menaje', 'cocina', 'bazar', 'hervir'],
  'cubierto': ['tenedor', 'cuchara', 'cuchillo', 'vajilla', 'mesa', 'bazar', 'comer'],
  'vajilla': ['plato', 'cubierto', 'vaso', 'taza', 'bazar', 'mesa', 'servir'],
  'plato': ['vajilla', 'cubierto', 'mesa', 'cocina', 'bazar', 'comida'],
  'vaso': ['taza', 'jarra', 'termo', 'botella', 'bazar', 'beber'],
  'taza': ['vaso', 'jarra', 'cafe', 'te', 'desayuno', 'bazar'],
  'jarra': ['vaso', 'taza', 'botella', 'agua', 'bazar'],
  'cocina': ['olla', 'sarten', 'cubierto', 'plato', 'menaje', 'bazar', 'comida', 'utensilio', 'vajilla', 'batidora', 'licuadora', 'pava', 'cafetera', 'tostadora', 'jarra', 'taza', 'vaso', 'repuesto', 'accesorios cocina'],
  'menaje': ['olla', 'sarten', 'vajilla', 'cocina', 'bazar', 'utensilios'],
  'utensilio': ['cocina', 'bazar', 'menaje', 'herramienta', 'olla', 'sarten', 'cubierto'],
  'termo': ['mate', 'bombilla', 'botella', 'bazar', 'agua caliente', 'acero'],
  'mate': ['termo', 'bombilla', 'yerba', 'bazar', 'infusion'],
  'bombilla': ['mate', 'termo', 'yerba', 'bazar', 'acero'],
  'botella': ['termo', 'vaso', 'jarra', 'bazar', 'agua', 'hidratacion'],
  'colador': ['cocina', 'utensilio', 'menaje', 'bazar', 'escurrir', 'pasta'],
  'tabla': ['cocina', 'utensilio', 'picar', 'bazar', 'madera', 'plastico'],
  'fuente': ['horno', 'cocina', 'vajilla', 'bazar', 'bandeja'],
  'escurridor': ['cocina', 'vajilla', 'plato', 'bazar', 'secar'],
  'tazon': ['bol', 'ensalada', 'vajilla', 'bazar', 'desayuno'],
  'bol': ['tazon', 'ensalada', 'vajilla', 'bazar', 'mezclar'],

  // — BAZAR / Hogar (más extensa) —
  'limpieza': ['escoba', 'trapo', 'detergente', 'higiene', 'bazar', 'lavar', 'limpiar'],
  'escoba': ['limpieza', 'trapeador', 'higiene', 'bazar', 'barrer'],
  'balde': ['limpieza', 'trapo', 'higiene', 'bazar', 'agua'],
  'cesto': ['canasto', 'organizador', 'baño', 'bazar', 'basura'],
  'canasto': ['cesto', 'organizador', 'lavanderia', 'bazar', 'ropa'],
  'percha': ['ropa', 'placard', 'organizador', 'bazar', 'colgar'],
  'toalla': ['baño', 'higiene', 'tela', 'bazar', 'secar'],
  'sabana': ['cama', 'ropa de cama', 'almohada', 'bazar', 'dormir'],
  'almohada': ['cama', 'sabana', 'descanso', 'bazar', 'dormir'],
  'mantel': ['mesa', 'cocina', 'comedor', 'bazar', 'proteccion'],
  'repasador': ['cocina', 'trapo', 'menaje', 'bazar', 'secar'],
  'organizador': ['cajones', 'cesto', 'canasto', 'orden', 'bazar', 'guardar'],
  'lampara': ['luz', 'iluminacion', 'hogar', 'bazar', 'led'],
  'velador': ['lampara', 'luz', 'dormitorio', 'bazar', 'mesa de luz'],
  'adorno': ['decoracion', 'hogar', 'figura', 'bazar', 'estetica'],
  'espejo': ['hogar', 'baño', 'decoracion', 'bazar', 'reflejo'],

  // — AGRO (más extensa) —
  'semilla': ['siembra', 'huerta', 'campo', 'cultivo', 'agro', 'plantar'],
  'plantin': ['semilla', 'huerta', 'jardin', 'agro', 'crecimiento'],
  'fertilizante': ['abono', 'nutricion', 'huerta', 'campo', 'agro', 'nutrir'],
  'abono': ['fertilizante', 'compost', 'huerta', 'agro', 'organico'],
  'herbicida': ['maleza', 'quimico', 'campo', 'agro', 'eliminar'],
  'fungicida': ['hongo', 'tratamiento', 'planta', 'agro', 'proteccion'],
  'insecticida': ['plaga', 'quimico', 'campo', 'agro', 'insectos'],
  'veneno': ['plaga', 'insecticida', 'raticida', 'agro', 'control'],
  'poda': ['tijera', 'jardin', 'arbol', 'agro', 'corte'],
  'tijera': ['poda', 'corte', 'herramienta', 'agro', 'afilado'],
  'manguera': ['riego', 'agua', 'jardin', 'agro', 'regar'],
  'riego': ['manguera', 'aspersor', 'jardin', 'agro', 'agua'],
  'aspersor': ['riego', 'manguera', 'agro', 'agua'],
  'pala': ['herramienta', 'campo', 'tierra', 'agro', 'excavar'],
  'azada': ['pala', 'herramienta', 'cultivo', 'agro', 'remover'],
  'rastrillo': ['jardin', 'herramienta', 'campo', 'agro', 'juntar'],
  'mochila': ['fumigadora', 'riego', 'agro', 'espalda'],
  'fumigadora': ['mochila', 'insecticida', 'agro', 'aplicar'],
  'jardin': ['planta', 'flor', 'tierra', 'maceta', 'agro', 'verde'],
  'maceta': ['planta', 'flor', 'jardin', 'tierra', 'agro', 'decoracion'],
  'tierra': ['sustrato', 'maceta', 'huerta', 'jardin', 'agro', 'suelo'],
  'sustrato': ['tierra', 'maceta', 'planta', 'agro', 'nutrientes'],
  'huerta': ['semilla', 'plantin', 'cultivo', 'agro', 'organico'],
  'campo': ['agro', 'semilla', 'fertilizante', 'herramienta', 'rural'],
  'gallinero': ['aves', 'pollo', 'campo', 'agro', 'granja'],
  'alambrado': ['campo', 'cerco', 'agro', 'limite'],
  'tranquera': ['campo', 'alambrado', 'agro', 'entrada'],
  'bolsa': ['changuito', 'acarreo', 'agro', 'semilla', 'carga'],

  // — PAPELERÍA (más extensa) —
  'cuaderno': ['libreta', 'anotador', 'escolar', 'lapiz', 'birome', 'papeleria', 'escribir'],
  'libreta': ['cuaderno', 'anotador', 'escolar', 'papeleria', 'notas'],
  'anotador': ['cuaderno', 'libreta', 'nota', 'papeleria', 'apuntar'],
  'agenda': ['calendario', 'planificador', 'papeleria', 'organizar'],
  'lapiz': ['lapicera', 'birome', 'marcador', 'escolar', 'papeleria', 'escribir'],
  'lapicera': ['lapiz', 'birome', 'boligrafo', 'escolar', 'papeleria', 'tinta'],
  'birome': ['lapiz', 'lapicera', 'boligrafo', 'escolar', 'papeleria', 'tinta'],
  'boligrafo': ['birome', 'lapicera', 'lapiz', 'papeleria', 'tinta'],
  'marcador': ['resaltador', 'lapiz', 'escolar', 'papeleria', 'color'],
  'resaltador': ['marcador', 'lapiz', 'escolar', 'papeleria', 'subrayar'],
  'fibra': ['marcador', 'pintura', 'escolar', 'papeleria', 'color'],
  'carpeta': ['archivo', 'escolar', 'folio', 'papeleria', 'guardar'],
  'archivo': ['carpeta', 'folio', 'oficina', 'papeleria', 'guardar'],
  'folio': ['carpeta', 'archivo', 'papeleria', 'plastico'],
  'resma': ['hoja', 'papel', 'impresora', 'oficina', 'papeleria', 'imprimir'],
  'hoja': ['resma', 'papel', 'cuaderno', 'papeleria', 'escribir'],
  'papel': ['resma', 'hoja', 'impresora', 'papeleria', 'imprimir'],
  'escolar': ['cuaderno', 'lapiz', 'mochila', 'papeleria', 'colegio'],
  'oficina': ['carpeta', 'archivo', 'lapicera', 'resma', 'papeleria', 'trabajo'],
  'sello': ['tinta', 'oficina', 'papeleria', 'marcar'],
  'pegamento': ['cola', 'tijera', 'manualidades', 'papeleria', 'pegar'],
  'cola': ['pegamento', 'manualidades', 'papeleria', 'adhesivo'],
  'tijera': ['corte', 'papeleria', 'manualidades', 'cortar'],
  'cinta': ['scotch', 'adhesivo', 'papeleria', 'pegar'],
  'scotch': ['cinta', 'adhesivo', 'papeleria', 'pegar'],
  'engrapadora': ['abrochadora', 'grampa', 'oficina', 'papeleria', 'unir'],
  'abrochadora': ['engrapadora', 'grampa', 'oficina', 'papeleria', 'unir'],
  'calculadora': ['matematica', 'oficina', 'escolar', 'papeleria', 'numeros'],
  'regla': ['escolar', 'geometria', 'papeleria', 'medir'],
  'compas': ['geometria', 'escolar', 'papeleria', 'circulo'],
  'cartuchera': ['lapiz', 'escolar', 'estuche', 'papeleria', 'guardar'],
  'mochila': ['escolar', 'cartuchera', 'papeleria', 'transporte'],
  'globo': ['fiesta', 'decoracion', 'papeleria', 'inflar', 'set'],
  'papel regalo': ['fiesta', 'envolver', 'papeleria', 'regalo'],
  'vinilo': ['adhesivo', 'decoracion', 'papeleria', 'stickers']
};

// ─── ESTADO ─────────────────────────────────────────────────
let allProducts = [];
let filteredProducts = [];
let lenis = null; // ✅ Variable global para control
let cart = [];
let currentFilter = 'all';
let currentPage = 1;
let hasNextPage = false;
let connectionState = 'idle';
let isLoading = false;  // ✅ PREVIENE BUCLE INFINITO

// ─── DOM ────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const productsGrid = $('productsGrid');
const loadingState = $('loadingState');
const emptyState = $('emptyState');
const loadMoreRow = $('loadMoreRow');
const loadMoreBtn = $('loadMoreBtn');
const cartBtn = $('cartBtn');
const cartBadge = $('cartBadge');
const cartDrawer = $('cartDrawer');
const cartCloseBtn = $('cartCloseBtn');
const cartBody = $('cartBody');
const cartEmpty = $('cartEmpty');
const cartFooter = $('cartFooterPanel');
const cartSubtotal = $('cartSubtotal');
const cartCountLabel = $('cartCountLabel');
const checkoutBtn = $('checkoutBtn');
const checkoutTNBtn = $('checkoutTNBtn');
const overlay = $('overlay');
const toast = $('toast');
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const searchToggle = $('searchToggle');
const searchExpand = $('searchExpand');
const chips = document.querySelectorAll('.chip');
const catBtns = document.querySelectorAll('.btn-cat-link');
const hamburger = $('hamburger');
const navLinks = $('navLinks');
const navbar = $('navbar');
const hfcCards = document.querySelectorAll('.hfc');

// ─── UTILIDADES ─────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

function esc(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

let _toastTimer;
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── NORMALIZAR TEXTO (quita acentos para comparar) ─────────
function norm(s = '') {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function detectCategory(p) {
  const tags = norm(p.tags || '');

  // Prioridad 1: tags explícitos en Tiendanube
  if (tags.includes('papeleria')) return 'papeleria';
  if (tags.includes('agro')) return 'agro';
  if (tags.includes('bazar')) return 'bazar';

  // Prioridad 2: categorías asignadas en Tiendanube
  const catNames = (p.categories || []).map(c => norm(c.name?.es || c.name?.[Object.keys(c.name || {})[0]] || ''));
  const catJoined = catNames.join(' ');
  if (/papeleria|escolar|oficina|libreria/.test(catJoined)) return 'papeleria';
  if (/agro|campo|huerta|jardin|veterinaria|semilla|fertiliz/.test(catJoined)) return 'agro';
  if (/bazar|cocina|hogar|menaje|limpieza|decoracion|textil/.test(catJoined)) return 'bazar';

  // Prioridad 3: palabras clave en nombre y descripción
  const name = norm(p.name?.es || p.name?.[Object.keys(p.name || {})[0]] || '');
  const desc = norm(p.description?.es || '');
  const text = `${name} ${desc} ${catJoined}`;

  // AGRO — palabras clave expandidas
  const agroRx = /\b(agro|campo|semilla|fertiliz|herbicida|fungicida|insecticida|plaguicida|fitosanitario|poda|jardin|huerta|siembra|cultivo|manguera|aspersor|riego|rastrillo|azada|pala|fumigadora|mochila fumig|alambrado|tranquera|gallinero|granja|bovino|porcino|aviar|ovino|caprino|veterinari|agroquimico|abono|compost|sustrato|tierra para maceta|maceta|plantin|trebol|maiz|soja|trigo|girasol|mani|tabaco|yerba mate|te de campo)\b/;

  // PAPELERÍA — palabras clave expandidas
  const papelRx = /\b(papeleria|escolar|cuaderno|libreta|anotador|agenda|lapiz|lapicera|birome|boligrafo|marcador|resaltador|fibra|carpeta|archivo|folio|resma|hoja|papel|sello|pegamento|cola vinilica|tijera de papel|cinta adhesiva|scotch|engrapadora|abrochadora|grampa|calculadora|regla|compas|cartuchera|mochila escolar|globos?|fiesta|cotillon|cumpleanos|papel regalo|vinilo|cartulina|afiche|bloc|block|portafolio|bibliorato|separador|index|post.?it|nota adhesiva|corrector|tipex|bicolor|multicolor)\b/;

  // BAZAR — palabras clave expandidas
  const bazarRx = /\b(bazar|cocina|olla|cacerola|sarten|wok|paila|cubierto|vajilla|plato|taza|vaso|jarra|jarro|tazon|bol|fuente|escurridor|colador|tabla de picar|cuchillo|utensilio|menaje|mate|termo|botella|botellon|hidratacion|limpieza|escoba|trapeador|trapo|balde|cesto|canasto|organizador|percha|toalla|sabana|almohada|funda|mantel|repasador|lampara|velador|adorno|espejo|decoracion|hogar|cortina|ropa de cama|textil|bano|detergente|higiene)\b/;

  if (agroRx.test(text)) return 'agro';
  if (papelRx.test(text)) return 'papeleria';
  if (bazarRx.test(text)) return 'bazar';

  // Prioridad 4: scoring por densidad de términos
  const agroScore = (text.match(/\b(campo|cultivo|planta|tierra|jardin|herramienta|agro)\b/g) || []).length;
  const papelScore = (text.match(/\b(hoja|papel|escolar|oficina|escribir|anotar|fiesta|regalo|globo|globos)\b/g) || []).length;
  const bazarScore = (text.match(/\b(cocina|hogar|casa|decorar|limpiar|mesa|cama)\b/g) || []).length;

  if (agroScore > papelScore && agroScore > bazarScore) return 'agro';
  if (papelScore > bazarScore) return 'papeleria';

  // Fallback final: bazar (el más amplio)
  return 'bazar';
}

// ─── TIENDANUBE PROXY ───────────────────────────────────────
async function tnFetch(params = {}) {
  const url = new URL('/api/products', window.location.origin);
  url.searchParams.set('storeId', TN_STORE_ID);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  console.log('[tnFetch] URL:', url.toString());

  const res = await fetch(url);

  // ✅ VALIDAR RESPUESTA
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error('[tnFetch] Error HTTP:', res.status, errorData);
    throw new Error(`HTTP ${res.status}: ${errorData.error || 'Error desconocido'}`);
  }

  const data = await res.json();

  // ✅ VALIDAR QUE DATA SEA ARRAY
  if (!Array.isArray(data)) {
    console.error('[tnFetch] Data no es array:', data);
    throw new Error('La respuesta de la API no es un array válido');
  }

  return { data, total: res.headers.get('X-Total-Count') };
}

// ─── CARGAR PRODUCTOS ───────────────────────────────────────
async function loadProducts(filter = 'all', page = 1, append = false) {
  // ✅ PREVENIR BUCLE INFINITO
  if (isLoading) {
    console.log('[loadProducts] Ya hay una carga en progreso, saltando...');
    return;
  }

  isLoading = true;
  setLoading(true);

  try {
    const isSearch = searchInput.value.trim().length > 0;
    const isFiltered = filter !== 'all';
    const params = {
      page,
      per_page: (isSearch || isFiltered) ? 80 : PAGE_SIZE
    };
    if (isSearch) params.q = searchInput.value.trim();

    console.log('[loadProducts] Cargando:', { filter, page, append, params });

    const { data, total } = await tnFetch(params);

    connectionState = 'connected';
    const totalCount = parseInt(total || 0);
    hasNextPage = (page * PAGE_SIZE) < totalCount;
    currentPage = page;

    const products = Array.isArray(data) ? data.map(p => {
      const v = (p.variants && p.variants.length > 0) ? p.variants[0] : {};

      return {
        id: String(p.id),
        variantId: v.id ? String(v.id) : '',
        title: p.name?.es || p.name?.[Object.keys(p.name || {})[0]] || 'Producto',
        description: stripHtml(p.description?.es || ''),
        price: parseFloat(v.promotional_price || v.price || 0),
        comparePrice: parseFloat(v.price || 0),
        image: p.images?.[0]?.src || null,
        imageAlt: p.name?.es || 'Imagen de producto',
        available: v.stock !== 0 && !!v.id,
        category: detectCategory(p),
        permalink: p.canonical_url || (typeof p.permalink === 'object' ? p.permalink?.es : p.permalink) || null,
        images: p.images || [],
        fullDescription: p.description?.es || '',
        allVariants: p.variants || [],
        tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(t => t !== '') : []
      };
    }) : [];

    allProducts = append ? [...allProducts, ...products] : products;
    filteredProducts = logicFilter(allProducts, currentFilter, searchInput.value);

    const toRender = append
      ? logicFilter(products, currentFilter, searchInput.value)
      : filteredProducts;

    if (!append && filter === 'all' && !searchInput.value.trim() && allProducts.length === 0) {
      renderProducts([], false, EMPTY_MESSAGES.comingSoon);
    } else {
      const hasQuery = searchInput.value.trim() || currentFilter !== 'all';
      renderProducts(toRender, append, EMPTY_MESSAGES.noResults, hasQuery);
    }

    loadMoreRow.hidden = !hasNextPage || allProducts.length === 0;

  } catch (err) {
    console.error('🔴 Error detallado de carga:', err.message);
    connectionState = 'error';
    hasNextPage = false;
    currentPage = 1;
    loadMoreRow.hidden = true;
    if (!append) renderProducts([], false, EMPTY_MESSAGES.error);
    else showToast('Error al cargar más productos.');
  } finally {
    isLoading = false;
    setLoading(false);
  }
}

function logicFilter(products, filter, search = '') {
  let r = Array.isArray(products) ? products : [];
  if (filter !== 'all') r = r.filter(p => p.category === filter);

  const query = search.toLowerCase().trim();
  if (!query) return r;

  const qNorm = norm(query);
  const words = qNorm.split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return r;

  // Armar términos relacionados
  let relatedTerms = [];
  words.forEach(w => {
    for (const key in SEARCH_ASSOCIATIONS) {
      if (key === w || key.includes(w)) {
        relatedTerms = [...relatedTerms, ...SEARCH_ASSOCIATIONS[key]];
      }
    }
  });
  relatedTerms = [...new Set(relatedTerms)];

  return r.map(p => {
    const title = norm(p.title || '');
    const desc = norm(p.description || '');
    const tags = norm((p.tags || []).join(' '));

    let score = 0;

    // Coincidencia de palabras clave originales
    words.forEach(w => {
      if (new RegExp(`\\b${w}\\b`).test(title)) score += 20;
      else if (title.includes(w)) score += 10;

      if (new RegExp(`\\b${w}\\b`).test(desc)) score += 6;
      else if (desc.includes(w)) score += 3;

      if (tags.includes(w)) score += 8;
      if (title.startsWith(w)) score += 5;
    });

    // Coincidencia de términos relacionados
    relatedTerms.forEach(rt => {
      if (title.includes(rt)) score += 3;
      if (desc.includes(rt)) score += 1;
      if (tags.includes(rt)) score += 2;
    });

    return { ...p, _score: score };
  })
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score);
}

window.applyFilter = function (filter) {
  if (isLoading || currentFilter === filter) return;
  currentFilter = filter;
  currentPage = 1;
  chips.forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  allProducts = [];
  loadProducts(filter, 1, false);
  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function renderProducts(products, append = false, emptyMsg = EMPTY_MESSAGES.noResults, showReset = false) {
  if (!append) {
    productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach(el => el.remove());
  }

  if (!products.length && !append) {
    emptyState.innerHTML = `${esc(emptyMsg)} ${showReset ? '<button onclick="applyFilter(\'all\');searchInput.value=\'\'" class="link-btn">Ver todos</button>' : ''}`;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  products.forEach((p, i) => productsGrid.appendChild(buildCard(p, i)));
}

function buildCard(p, i = 0) {
  const el = document.createElement('article');
  el.className = 'product-card fade-up';
  el.style.animationDelay = `${(i % 8) * 0.055}s`;
  el.dataset.productId = p.id;

  const emoji = CATEGORY_EMOJIS[p.category] || CATEGORY_EMOJIS.default;
  const tagLabel = ({ agro: 'Agro', bazar: 'Bazar', papeleria: 'Papelería' }[p.category] || 'Bazar');

  const hasSale = p.comparePrice > p.price && p.price > 0;
  const discount = hasSale ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;

  const imgHtml = p.image
    ? `<img class="product-img" src="${esc(p.image)}" alt="${esc(p.imageAlt)}" loading="lazy" decoding="async">`
    : `<div class="product-img-placeholder">${emoji}</div>`;

  const priceHtml = hasSale
    ? `<div><span class="product-compare">${fmt(p.comparePrice)}</span> <span class="product-price">${fmt(p.price)}</span></div>`
    : `<span class="product-price">${p.price > 0 ? fmt(p.price) : 'Consultar'}</span>`;
  const addBtnDisabled = !p.available || !p.variantId ? 'disabled title="Sin stock o sin variante para agregar"' : '';
  el.innerHTML = `
    <div class="product-img-wrap">
      ${imgHtml}
      <span class="product-tag ${esc(p.category)}">${tagLabel}</span>
      ${hasSale ? `<span class="badge-sale">${discount}% OFF</span>` : ''}
      <button class="wishlist-btn" aria-label="Favorito">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <div class="product-body">
      <p class="product-name">${esc(p.title)}</p>
      <p class="product-desc">${esc(p.description || '')}</p>
      <div class="product-foot">
        ${priceHtml}
        <div class="product-actions">
          ${p.permalink ? `<a class="buy-btn" href="${esc(p.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${esc(p.title)}">Ver</a>` : ''}
          <button class="add-btn" data-product-id="${esc(p.id)}" aria-label="Agregar ${esc(p.title)}" ${addBtnDisabled}>+ Carrito</button>
        </div>
      </div>
    </div>`;

  return el;
}

function setLoading(on) {
  loadingState.hidden = true;
  loadingState.style.display = 'none';
  if (on) emptyState.hidden = true;
}

// ─── CARRITO ────────────────────────────────────────────────
function addToCart(productId) {
  const p = allProducts.find(x => x.id === productId);
  if (!p) return;
  if (!p.variantId) {
    showToast(`⚠️ No se puede agregar ${p.title} a Tiendanube.`);
    return;
  }

  const ex = cart.find(x => x.id === productId);
  ex ? ex.qty++ : cart.push({ ...p, qty: 1 });

  saveCart(); updateCartUI();
  showToast(`✓ ${p.title}`);
  flyToCart(productId);

  cartBtn.classList.add('pop');
  setTimeout(() => cartBtn.classList.remove('pop'), 320);
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart(); updateCartUI();
}

function saveCart() {
  try { localStorage.setItem('mk_cart', JSON.stringify(cart.map(i => ({ id: i.id, qty: i.qty })))); } catch (e) { }
}

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('mk_cart') || '[]'); } catch (e) { cart = []; }
}

function reconcileCart() {
  cart = cart.reduce((acc, s) => {
    const p = allProducts.find(x => x.id === s.id);
    if (p) acc.push({ ...p, qty: s.qty });
    return acc;
  }, []);
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((a, i) => a + i.qty, 0);
  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);

  cartBadge.textContent = total;
  cartBadge.hidden = total === 0;
  cartSubtotal.textContent = fmt(subtotal);
  if (cartCountLabel) cartCountLabel.textContent = `${total} ${total === 1 ? 'item' : 'items'}`;

  if (!cart.length) {
    cartEmpty.hidden = false;
    cartFooter.hidden = true;
    cartBody.innerHTML = '';
    cartBody.appendChild(cartEmpty);
    return;
  }

  cartEmpty.hidden = true;
  cartFooter.hidden = false;

  cartBody.innerHTML = cart.map(item => {
    const emoji = CATEGORY_EMOJIS[item.category] || '📦';
    const imgHtml = item.image
      ? `<img class="ci-img" src="${esc(item.image)}" alt="${esc(item.title)}" loading="lazy">`
      : `<div class="ci-placeholder">${emoji}</div>`;
    return `
      <div class="cart-item-row">
        ${imgHtml}
        <div class="ci-info">
          <p class="ci-name">${esc(item.title)}</p>
          <p class="ci-price">${fmt(item.price * item.qty)}</p>
        </div>
        <div class="ci-controls">
          <button class="qty-btn" data-action="dec" data-id="${esc(item.id)}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${esc(item.id)}">+</button>
        </div>
      </div>`;
  }).join('');
}

function openCart() { cartDrawer.classList.add('open'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); }
function closeCart() { cartDrawer.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = ''; if (lenis) lenis.start(); }

function sendWhatsApp() {
  if (!cart.length) return;
  let msg = '¡Hola Makena! Quiero hacer un pedido:\n\n';
  cart.forEach(i => msg += `• ${i.qty}x ${i.title} — ${fmt(i.price * i.qty)}\n`);
  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  msg += `\n*Total productos:* ${fmt(total)}`;
  msg += '\n\n¿Me podés confirmar disponibilidad y coordinar el envío?';
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

function sendToTiendaNube() {
  if (!cart.length) return;
  const validItems = cart.filter(i => i.permalink);
  if (validItems.length === 1) {
    window.open(validItems[0].permalink, '_blank', 'noopener,noreferrer');
  } else {
    showToast('🛍️ Abriendo tu tienda para completar la compra…', 3000);
    setTimeout(() => window.open(TN_BASE_URL, '_blank', 'noopener,noreferrer'), 500);
  }
}

function doSearch() {
  const q = searchInput.value.trim();
  currentPage = 1;
  allProducts = [];
  loadProducts(currentFilter, 1, false);
  if (q) {
    const productsEl = document.getElementById('productos');
    if (productsEl) window.scrollTo({ top: productsEl.offsetTop - 100, behavior: 'smooth' });
  }
}

// ─── NAVBAR & UI ────────────────────────────────────────────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  const sections = ['inicio', 'categorias', 'productos', 'nosotros', 'contacto'];
  let current = 'inicio';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}, { passive: true });

searchToggle.addEventListener('click', () => {
  const open = searchExpand.classList.toggle('open');
  if (open) setTimeout(() => searchInput.focus(), 50);
});
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) searchExpand.classList.remove('open');
});

// ─── EVENT LISTENERS ────────────────────────────────────────
cartBtn.addEventListener('click', openCart);
cartCloseBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', () => { closeCart(); closeProductModal(); });
checkoutBtn.addEventListener('click', sendWhatsApp);
if (checkoutTNBtn) checkoutTNBtn.addEventListener('click', sendToTiendaNube);

cartBody.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'inc') changeQty(id, 1);
  if (btn.dataset.action === 'dec') changeQty(id, -1);
});

productsGrid.addEventListener('click', e => {
  const btn = e.target.closest('.add-btn');
  if (btn) {
    if (btn.disabled) return;
    addToCart(btn.dataset.productId);
    return;
  }
  const wishBtn = e.target.closest('.wishlist-btn');
  if (wishBtn) {
    wishBtn.classList.toggle('active');
    e.stopPropagation();
    return;
  }
  if (e.target.closest('.buy-btn')) return;
  const card = e.target.closest('.product-card');
  if (card) openProductModal(card.dataset.productId);
});

const productModal = $('productModal');
const pmClose = $('pmClose');

function openProductModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  $('pmTag').textContent = ({ agro: 'Agro', bazar: 'Bazar', papeleria: 'Papelería' }[p.category] || 'Bazar');
  $('pmTitle').textContent = p.title;
  $('pmPrice').textContent = fmt(p.price);
  $('pmCompare').textContent = (p.comparePrice > p.price) ? fmt(p.comparePrice) : '';
  $('pmDescription').innerHTML = p.fullDescription || '<p>Sin descripción disponible.</p>';

  const mainImg = $('pmMainImg');
  const thumbs = $('pmThumbs');
  mainImg.src = p.image || '';

  thumbs.innerHTML = p.images.map((img, idx) => `
    <div class="pm-thumb ${idx === 0 ? 'active' : ''}" data-src="${esc(img.src)}">
      <img src="${esc(img.src)}" alt="Miniatura ${idx + 1}">
    </div>
  `).join('');

  const varContainer = $('pmVariants');
  if (p.allVariants && p.allVariants.length > 1) {
    varContainer.innerHTML = `
      <div class="pm-variant-group">
        <span class="pm-variant-label">Opciones disponibles:</span>
        <div class="pm-variant-options">
          ${p.allVariants.map(v => `<span class="pm-opt">${esc(v.values?.[0]?.es || 'Opción')}</span>`).join('')}
        </div>
      </div>
    `;
    varContainer.hidden = false;
  } else {
    varContainer.hidden = true;
  }

  $('pmAddToCart').onclick = () => { addToCart(p.id); closeProductModal(); };

  const btnBuyNow = $('pmBuyNow');
  const buyUrl = p.permalink || TN_BASE_URL;
  btnBuyNow.hidden = false;
  btnBuyNow.href = buyUrl;
  btnBuyNow.target = '_blank';
  btnBuyNow.rel = 'noopener noreferrer';
  btnBuyNow.onclick = null;

  $('pmWhatsApp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Me interesa este producto: ' + p.title + '\n' + (p.permalink || ''))}`;

  renderRelatedProducts(p);

  productModal.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();
}

function closeProductModal() {
  productModal.classList.remove('open');
  if (!cartDrawer.classList.contains('open')) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }
}

pmClose.addEventListener('click', closeProductModal);

$('pmThumbs').addEventListener('click', e => {
  const thumb = e.target.closest('.pm-thumb');
  if (!thumb) return;
  document.querySelectorAll('.pm-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  $('pmMainImg').src = thumb.dataset.src;
});

chips.forEach(c => {
  c.addEventListener('click', () => {
    const filter = c.dataset.filter;
    if (filter !== currentFilter) window.applyFilter(filter);
  });
});

catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (filter !== currentFilter) window.applyFilter(filter);
  });
});

hfcCards.forEach(card => {
  const filter = card.classList.contains('hfc-agro') ? 'agro'
    : card.classList.contains('hfc-bazar') ? 'bazar'
      : card.classList.contains('hfc-papel') ? 'papeleria' : null;
  if (filter) card.addEventListener('click', () => { if (filter !== currentFilter) window.applyFilter(filter); });
});

searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => e.key === 'Enter' && doSearch());

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim().toLowerCase();
  const resContainer = $('searchResults');
  if (!q) {
    resContainer.classList.remove('open');
    if (!searchInput.value) doSearch();
    return;
  }
  searchTimeout = setTimeout(() => {
    const results = logicFilter(allProducts, currentFilter !== 'all' ? currentFilter : 'all', q).slice(0, 6);
    if (results.length > 0) {
      resContainer.innerHTML = results.map(p => `
        <div class="search-res-item" onclick="openProductModal('${p.id}'); $('searchResults').classList.remove('open');">
          <img src="${p.image || ''}" class="search-res-img" alt="">
          <div class="search-res-info">
            <p>${esc(p.title)}</p>
            <span>${fmt(p.price)}</span>
          </div>
        </div>
      `).join('');
      resContainer.classList.add('open');
    } else {
      resContainer.classList.remove('open');
    }
  }, 250);
});

document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) $('searchResults').classList.remove('open'); });

loadMoreBtn.addEventListener('click', () => { if (!isLoading && hasNextPage) loadProducts(currentFilter, currentPage + 1, true); });

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
});
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
}));

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCart(); closeProductModal(); searchExpand.classList.remove('open'); } });

function setupObserver() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-up'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.cat-card, .contact-card, .mosaic-cell, .about-checks li, .stat-pill').forEach(el => obs.observe(el));
}

function initDraggableDeco() {
  const elements = document.querySelectorAll('.deco-el');
  elements.forEach(el => {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    const startDrag = (e) => {
      isDragging = true;
      el.classList.add('is-dragging');
      const rect = el.getBoundingClientRect();
      const parentRect = el.offsetParent.getBoundingClientRect();
      initialLeft = rect.left - parentRect.left;
      initialTop = rect.top - parentRect.top;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      startX = clientX; startY = clientY;
      el.style.left = initialLeft + 'px';
      el.style.top = initialTop + 'px';
      el.style.right = 'auto'; el.style.bottom = 'auto';
      if (e.type === 'touchstart') e.preventDefault();
    };
    const doDrag = (e) => {
      if (!isDragging) return;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;
      el.style.left = (initialLeft + dx) + 'px';
      el.style.top = (initialTop + dy) + 'px';
      if (e.type === 'touchmove') e.preventDefault();
    };
    const endDrag = () => { if (isDragging) { isDragging = false; el.classList.remove('is-dragging'); } };
    el.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', endDrag);
    el.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', endDrag);
  });
}

function initSmoothScroll() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

async function init() {
  try {
    $('currentYear').textContent = new Date().getFullYear();
    loadCart(); updateCartUI(); setupObserver();
    initSmoothScroll(); initDraggableDeco(); initLeaves();
    const announceBar = $('announceBar');
    const announceClose = $('announceClose');
    if (announceClose && announceBar) announceClose.addEventListener('click', () => announceBar.classList.add('hidden'));
    const backTop = $('backTop');
    if (backTop) {
      window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 400), { passive: true });
      backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    showSkeletons(6);
    connectionState = 'connecting';
    await loadProducts('all', 1, false);
    if (connectionState === 'connected') reconcileCart();
  } catch (e) { console.error("Falla crítica en init:", e); }
}

function showSkeletons(n) {
  productsGrid.querySelectorAll('.product-card, .skeleton-card').forEach(el => el.remove());
  for (let i = 0; i < n; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton-card';
    sk.innerHTML = `<div class="skeleton-img"></div><div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line price"></div></div>`;
    productsGrid.appendChild(sk);
  }
}

init();

(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
})();

function initLeaves() {
  const container = $('leafContainer');
  if (!container) return;
  const emojis = ['🍂', '🍁', '🍃', '🌿'];
  for (let i = 0; i < 15; i++) {
    const leaf = document.createElement('span');
    leaf.className = 'leaf';
    leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    leaf.style.left = Math.random() * 100 + '%';
    leaf.style.animationDelay = Math.random() * 12 + 's';
    leaf.style.animationDuration = (8 + Math.random() * 8) + 's';
    leaf.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    container.appendChild(leaf);
  }
}

function flyToCart(productId) {
  const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  const img = card ? card.querySelector('.product-img') : null;
  const cartBtn = document.getElementById('cartBtn');
  if (!img || !cartBtn) return;
  const clone = img.cloneNode();
  const rect = img.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();
  clone.className = 'flying-item';
  clone.style.position = 'fixed';
  clone.style.left = rect.left + 'px';
  clone.style.top = rect.top + 'px';
  clone.style.width = rect.width + 'px';
  clone.style.height = rect.height + 'px';
  clone.style.zIndex = '9999';
  clone.style.transition = 'all 0.85s cubic-bezier(0.64, 0, 0.78, 0)';
  document.body.appendChild(clone);
  const deltaX = (cartRect.left + cartRect.width / 2) - (rect.left + rect.width / 2);
  const deltaY = (cartRect.top + cartRect.height / 2) - (rect.top + rect.height / 2);
  requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.1) rotate(420deg)`;
    clone.style.opacity = '0';
  });
  clone.addEventListener('transitionend', () => clone.remove(), { once: true });
  setTimeout(() => { if (clone.parentNode) clone.remove(); }, 1000);
}

function renderRelatedProducts(currentProd) {
  const container = document.getElementById('pmRelatedGrid');
  if (!container) return;
  const related = allProducts
    .filter(p => p.category === currentProd.category && p.id !== currentProd.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  if (related.length === 0) { document.getElementById('pmRelated').hidden = true; return; }
  document.getElementById('pmRelated').hidden = false;
  container.innerHTML = related.map(p => `
    <div class="pm-rel-card" onclick="openProductModal('${p.id}')">
      <div class="pm-rel-img">
        <img src="${p.image || ''}" alt="${esc(p.title)}">
      </div>
      <p>${esc(p.title)}</p>
    </div>
  `).join('');
}
