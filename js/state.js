import { PAGE_SIZE } from './config.js';

export const state = {
  allProducts: [],
  filteredProducts: [],
  categories: [],
  lenis: null,
  cart: [],
  currentFilter: 'all',
  currentCategoryId: null,
  visibleCount: PAGE_SIZE,
  currentPage: 1,
  hasNextPage: false,
  connectionState: 'idle',
  isLoading: false,
  activeModalProductId: null,
  activeVariantId: null,
};

export function resetVisibleCount() {
  state.visibleCount = PAGE_SIZE;
}

export function resetCatalogPagination() {
  state.currentPage = 1;
  state.hasNextPage = false;
  resetVisibleCount();
}

export function setLenis(instance) {
  state.lenis = instance;
}
