export type ProductType = 'goods' | 'service' | 'combo';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: string;
  salesPrice: number;
  costPrice: number;
}

export type ProductInput = Omit<Product, 'id'>;

export interface ProductFilters {
  search?: string;
  type?: ProductType | 'ALL';
}