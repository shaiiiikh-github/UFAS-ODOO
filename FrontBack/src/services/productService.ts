import type { Product, ProductInput, ProductFilters, ProductType } from '@/types/product';
import { api, num } from '@/lib/api';

interface BackendProduct {
  id: string;
  name: string;
  type: 'Goods' | 'Service' | 'Combo';
  sales_price: number | string;
  cost: number | string;
  category: string | null;
  stock_quantity: number;
  is_active: boolean;
}

const TYPE_IN: Record<BackendProduct['type'], ProductType> = { Goods: 'goods', Service: 'service', Combo: 'combo' };
const TYPE_OUT: Record<ProductType, BackendProduct['type']> = { goods: 'Goods', service: 'Service', combo: 'Combo' };

function toProduct(p: BackendProduct): Product {
  return {
    id: p.id,
    name: p.name,
    type: TYPE_IN[p.type],
    category: p.category ?? '',
    salesPrice: num(p.sales_price),
    costPrice: num(p.cost),
  };
}

function toPayload(input: Partial<ProductInput>) {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.type !== undefined) body.type = TYPE_OUT[input.type];
  if (input.category !== undefined) body.category = input.category || null;
  if (input.salesPrice !== undefined) body.sales_price = input.salesPrice;
  if (input.costPrice !== undefined) body.cost = input.costPrice;
  return body;
}

export const productService = {
  getProducts: async (filters?: ProductFilters): Promise<Product[]> => {
    let result = (await api.get<BackendProduct[]>('/api/products/')).map(toProduct);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (filters?.type && filters.type !== 'ALL') result = result.filter((p) => p.type === filters.type);
    return result;
  },
  getProduct: async (id: string): Promise<Product | undefined> => (await productService.getProducts()).find((p) => p.id === id),
  createProduct: async (input: ProductInput): Promise<Product> =>
    toProduct(await api.post<BackendProduct>('/api/products/', { ...toPayload(input), stock_quantity: 0 })),
  updateProduct: async (id: string, data: Partial<ProductInput>): Promise<Product> =>
    toProduct(await api.put<BackendProduct>(`/api/products/${id}`, toPayload(data))),
};
