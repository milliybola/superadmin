import apiClient from '@/core/api/client';
import { ENDPOINTS } from '@/core/config/constants';
import { createResource } from '@/shared/api/resource';
import { createResourceHooks } from '@/shared/hooks/useResource';

export interface Category {
  uuid: string;
  name: string;
  partner_type: 'RESTAURANT' | 'SHOP';
  category_type: 'main' | 'extra';
  description: string | null;
  is_active: boolean;
  logo: string | null;
  partners_count: number;
  created_at: string;
}

export interface ProductListItem {
  uuid: string;
  name: string;
  partner: { uuid: string; name: string; type: string } | null;
  category: string | null;
  image: string | null;
  price: number;
  sale_price: number | null;
  discount: number;
  unit: 'PIECE' | 'KG';
  kind: 'SINGLE' | 'SET';
  brand: string;
  status: 'PENDING' | 'ACTIVE' | 'DELETED';
  is_active: boolean;
  is_available: boolean;
  created_at: string;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  barcode: string;
  sku: string;
  step: number;
  min_quantity: number;
  images: { url: string; is_main: boolean; is_active: boolean }[];
  packagings: { name: string; multiplier: number; price: number; is_active: boolean }[];
  option_groups: { name: string; min_select: number; max_select: number; options: { name: string; price_delta: number; is_available: boolean }[] }[];
  set_items: { product: string; quantity: number }[];
  stock: { filial: string; quantity: number; price: number; is_available: boolean }[];
}

export const categoriesApi = createResource<Category>(ENDPOINTS.ADMIN.CATEGORIES);
export const productsApi = createResource<ProductListItem, ProductDetail>(ENDPOINTS.ADMIN.PRODUCTS);

export const getProductsMeta = async (): Promise<{ status_counts: Record<string, number> }> =>
  (await apiClient.get(`${ENDPOINTS.ADMIN.PRODUCTS}meta/`)).data;

export const categoryHooks = createResourceHooks('categories', categoriesApi);
export const productHooks = createResourceHooks('products', productsApi);

export const PRODUCT_STATUS: Record<string, { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  PENDING: { label: 'Tekshiruvda', tone: 'warning' },
  ACTIVE: { label: 'Tasdiqlangan', tone: 'success' },
  DELETED: { label: "Rad etilgan / o'chirilgan", tone: 'danger' },
};
