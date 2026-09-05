import type { Product, ProductInput, ProductFilters } from '@/types/product';

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Office Desk',
    type: 'goods',
    category: 'Office Furniture',
    salesPrice: 25000,
    costPrice: 18000,
  },
  {
    id: '2',
    name: 'Ergonomic Chair',
    type: 'goods',
    category: 'Seating',
    salesPrice: 12000,
    costPrice: 8500,
  },
  {
    id: '3',
    name: 'Interior Design Consultation',
    type: 'service',
    category: 'Services',
    salesPrice: 5000,
    costPrice: 0,
  },
  {
    id: '4',
    name: 'Modular Wardrobe Set',
    type: 'combo',
    category: 'Storage',
    salesPrice: 45000,
    costPrice: 32000,
  },
  {
    id: '5',
    name: 'Conference Table',
    type: 'goods',
    category: 'Office Furniture',
    salesPrice: 38000,
    costPrice: 27000,
  },
  {
    id: '6',
    name: 'Installation Service',
    type: 'service',
    category: 'Services',
    salesPrice: 2000,
    costPrice: 0,
  },
];

const products = [...mockProducts];
let nextId = products.length + 1;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  getProducts: async (filters?: ProductFilters): Promise<Product[]> => {
    await delay(500);
    let result = [...products];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.type && filters.type !== 'ALL') {
      result = result.filter(p => p.type === filters.type);
    }

    return result;
  },

  getProduct: async (id: string): Promise<Product | undefined> => {
    await delay(300);
    return products.find(p => p.id === id);
  },

  createProduct: async (input: ProductInput): Promise<Product> => {
    await delay(600);
    const newProduct: Product = {
      ...input,
      id: String(nextId++),
    };
    products.push(newProduct);
    return newProduct;
  },

  updateProduct: async (id: string, input: Partial<ProductInput>): Promise<Product> => {
    await delay(600);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    const updated = { ...products[index], ...input };
    products[index] = updated;
    return updated;
  },
};
