import { CATEGORY_MAPPING, TN_STORE_ID } from './config.js';
import { readLocalizedValue, stripHtml } from './utils.js';

function toNumber(value, fallback = 0) {
  const number = parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeVariant(rawVariant = {}, fallbackLabel = 'Opción') {
  const values = Array.isArray(rawVariant.values) ? rawVariant.values : Object.values(rawVariant.values || {});
  const label = values.map((entry) => readLocalizedValue(entry, '')).filter(Boolean).join(' / ') || rawVariant.sku || fallbackLabel;

  return {
    id: rawVariant.id ? String(rawVariant.id) : '',
    label,
    price: toNumber(rawVariant.promotional_price || rawVariant.price || 0),
    comparePrice: toNumber(rawVariant.price || rawVariant.promotional_price || 0),
    available: rawVariant.stock !== 0 && !!rawVariant.id,
    stock: rawVariant.stock ?? null,
  };
}

function normalizeTags(rawTags) {
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof rawTags === 'string') {
    return rawTags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function normalizeProduct(rawProduct) {
  const title = readLocalizedValue(rawProduct.name, 'Producto');
  const categories = Array.isArray(rawProduct.categories) ? rawProduct.categories : [];
  const variants = Array.isArray(rawProduct.variants) && rawProduct.variants.length
    ? rawProduct.variants.map((variant) => normalizeVariant(variant))
    : [normalizeVariant({}, 'Única')];
  const defaultVariant = variants.find((variant) => variant.available && variant.id)
    || variants.find((variant) => variant.id)
    || variants[0];
  const rawCategoryName = readLocalizedValue(categories[0]?.name, 'General');
  const firstCategoryId = categories[0]?.id ? String(categories[0].id) : '0';
  const mappedCategory = CATEGORY_MAPPING[firstCategoryId] || rawCategoryName;

  return {
    id: String(rawProduct.id),
    title,
    description: stripHtml(readLocalizedValue(rawProduct.description, '')),
    fullDescription: readLocalizedValue(rawProduct.description, ''),
    price: defaultVariant?.price ?? 0,
    comparePrice: defaultVariant?.comparePrice ?? 0,
    image: rawProduct.images?.[0]?.src || null,
    imageAlt: title,
    available: variants.some((variant) => variant.available && variant.id),
    category: mappedCategory,
    categoriesList: categories.length
      ? categories.map((category) => CATEGORY_MAPPING[String(category.id)] || readLocalizedValue(category.name, 'General'))
      : ['General'],
    categoryIdsList: categories.length ? categories.map((category) => String(category.id)) : ['0'],
    permalink: rawProduct.canonical_url || readLocalizedValue(rawProduct.permalink, '') || null,
    images: Array.isArray(rawProduct.images) ? rawProduct.images.filter((image) => image?.src) : [],
    tags: normalizeTags(rawProduct.tags),
    variants,
    defaultVariantId: defaultVariant?.id || '',
  };
}

async function tnFetch(path, params = {}) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('storeId', TN_STORE_ID);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`HTTP ${response.status}: ${errorData.error || 'Error desconocido'}`);
  }

  const data = await response.json();
  return { data, total: response.headers.get('X-Total-Count') };
}

export async function fetchProductsPage(params = {}) {
  const { data, total } = await tnFetch('/api/products', params);

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de la API no es un array válido');
  }

  return {
    products: data.map(normalizeProduct),
    total,
  };
}

export async function fetchCategories() {
  const { data } = await tnFetch('/api/categories');

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de categorías no es válida');
  }

  return data.map((category) => ({
    id: String(category.id),
    name: readLocalizedValue(category.name, 'General'),
    count: 0,
  }));
}

export function resolveVariant(product, variantId = null) {
  if (!product?.variants?.length) return null;

  if (variantId) {
    return product.variants.find((variant) => String(variant.id) === String(variantId)) || null;
  }

  return product.variants.find((variant) => variant.available && variant.id)
    || product.variants.find((variant) => variant.id)
    || product.variants[0]
    || null;
}

export function getVariantLabel(variant) {
  return variant?.label || 'Única';
}
