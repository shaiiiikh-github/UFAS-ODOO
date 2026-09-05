import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import type { ProductInput, ProductFilters } from '@/types/product';
import { toast } from 'sonner';

export const PRODUCTS_QUERY_KEY = 'products';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) => productService.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      toast.success('Product created successfully.');
    },
    onError: () => {
      toast.error('Failed to create product.');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
      productService.updateProduct(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY, updated.id] });
      toast.success('Product updated successfully.');
    },
    onError: () => {
      toast.error('Failed to update product.');
    },
  });
};
