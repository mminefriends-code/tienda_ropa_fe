import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import toast from 'react-hot-toast';
import type { ProductVariant } from '../../types';

interface VariantStock extends ProductVariant {
  productName: string;
  originalStock: number;
}

export function StockManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-products-stock', search],
    queryFn: () => adminApi.getProducts({ limit: 50, search: search || undefined }).then((r) => r.data),
  });

  const products = response?.data || [];

  const allVariants: VariantStock[] = products.flatMap((product) =>
    product.variants
      .filter((v) => v.isActive)
      .map((v) => ({
        ...v,
        productName: product.name,
        originalStock: v.stock,
      }))
  );

  const changedVariants = Object.entries(stockChanges).filter(
    ([id, qty]) => allVariants.find((v) => v.id === id)?.originalStock !== qty
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      const updates = changedVariants.map(([variantId, stock]) => ({ variantId, stock }));
      return adminApi.updateStock(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-stock'] });
      setStockChanges({});
      toast.success('Stock actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar stock'),
  });

  const getStock = (variant: VariantStock) => {
    return stockChanges[variant.id] !== undefined ? stockChanges[variant.id] : variant.stock;
  };

  const updateStockLocal = (variantId: string, newStock: number) => {
    setStockChanges((prev) => ({ ...prev, [variantId]: Math.max(0, newStock) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <input
            type="search"
            placeholder="Buscar por nombre de producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {changedVariants.length > 0 && (
          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn btn-primary">
            {saveMutation.isPending ? 'Guardando...' : `Guardar cambios (${changedVariants.length})`}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-10 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Talla</th>
                  <th className="px-6 py-3">Color</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Stock actual</th>
                  <th className="px-6 py-3">Nuevo stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allVariants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron variantes
                    </td>
                  </tr>
                )}
                {allVariants.map((variant) => {
                  const currentStock = getStock(variant);
                  const hasChanged = variant.originalStock !== currentStock;
                  return (
                    <tr key={variant.id} className={`hover:bg-gray-50 ${hasChanged ? 'bg-primary-50/50' : ''}`}>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 max-w-[200px] truncate">
                        {variant.productName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{variant.size}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: variant.colorHex }} />
                          <span className="text-sm text-gray-600">{variant.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{variant.sku}</td>
                      <td className="px-6 py-3">
                        <span className={`text-sm font-medium ${variant.originalStock < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                          {variant.originalStock}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateStockLocal(variant.id, currentStock - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={currentStock}
                            onChange={(e) => updateStockLocal(variant.id, Number(e.target.value))}
                            className={`w-16 text-center border rounded py-1.5 text-sm font-medium ${hasChanged ? 'border-primary-400 bg-primary-50' : 'border-gray-300'}`}
                            min="0"
                          />
                          <button
                            onClick={() => updateStockLocal(variant.id, currentStock + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50 text-sm"
                          >
                            +
                          </button>
                          {hasChanged && (
                            <span className="text-xs text-primary-600 font-medium ml-1">
                              {currentStock > variant.originalStock ? '+' : ''}{currentStock - variant.originalStock}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
