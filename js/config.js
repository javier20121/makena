export const TN_STORE_ID = '7599760';
export const TN_BASE_URL = 'https://makenashop1.mitiendanube.com/';
export const WHATSAPP_NUMBER = '5493757000000';

export const PAGE_SIZE = 8;
export const API_PAGE_SIZE = 100;
export const LOAD_MORE_END_MESSAGE = 'Se van a cargar más productos pronto.';

export const EMPTY_MESSAGES = {
  error: 'No pudimos cargar los productos. Intentá de nuevo más tarde.',
  comingSoon: '¡Próximamente! Los productos están en camino.',
  noResults: 'No encontramos productos con ese criterio.',
};

export const CATEGORY_MAPPING = {
  '38337422': 'Perfumería',
  '38357189': 'Perfumería',
  '38356862': 'Perfumería',
  '38337358': 'Bazar',
  '38337614': 'Bazar',
  '38337299': 'Hogar',
  '38337374': 'Cotillón',
  '38348340': 'Térmicos',
};

export const CATEGORY_CONFIG = {
  agro: { emoji: '🌾', label: 'Agro', cssClass: 'agro', keywords: ['agro', 'campo', 'jardin', 'huerta', 'semilla'] },
  bazar: { emoji: '🏠', label: 'Bazar', cssClass: 'bazar', keywords: ['bazar', 'hogar', 'cocina', 'limpieza', 'articulos'] },
  papeleria: { emoji: '📎', label: 'Papelería', cssClass: 'papeleria', keywords: ['papel', 'libreria', 'oficina', 'escolar'] },
  perfumeria: { emoji: '✨', label: 'Perfumería', cssClass: 'rosado', keywords: ['perfum', 'maquillaje', 'belleza', 'cuidado', 'peluqueria'] },
  cotillon: { emoji: '🎉', label: 'Cotillón', cssClass: 'celeste', keywords: ['cotillon', 'fiesta'] },
  termicos: { emoji: '☕', label: 'Térmicos', cssClass: 'lila', keywords: ['termo', 'stanley', 'termico'] },
  default: { emoji: '📦', label: 'General', cssClass: '', keywords: [] },
};

function normalizeCategoryName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getCategoryConfig(categoryName = '') {
  const normalized = normalizeCategoryName(categoryName);

  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (key === 'default') continue;
    if (config.keywords.some((keyword) => normalized.includes(keyword))) {
      return config;
    }
  }

  return CATEGORY_CONFIG.default;
}
