export const fmt = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);

export function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripHtml(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function norm(value = '') {
  if (!value) return '';

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

export function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function readLocalizedValue(value, fallback = '') {
  if (typeof value === 'string') return value || fallback;

  if (Array.isArray(value)) {
    return value.map((entry) => readLocalizedValue(entry, '')).find(Boolean) || fallback;
  }

  if (value && typeof value === 'object') {
    if (typeof value.es === 'string' && value.es) return value.es;
    if (typeof value.en === 'string' && value.en) return value.en;
    return Object.values(value).map((entry) => readLocalizedValue(entry, '')).find(Boolean) || fallback;
  }

  return fallback;
}

export function sanitizeHtml(html = '') {
  if (!html) return '';

  const template = document.createElement('template');
  template.innerHTML = String(html);

  template.content.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());

  template.content.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const { name, value } = attribute;

      if (/^on/i.test(name)) {
        element.removeAttribute(name);
        return;
      }

      if (['href', 'src', 'xlink:href'].includes(name) && /^javascript:/i.test(value)) {
        element.removeAttribute(name);
      }
    });
  });

  return template.innerHTML.trim();
}

export function fisherYates(array) {
  const shuffled = array.slice();

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
