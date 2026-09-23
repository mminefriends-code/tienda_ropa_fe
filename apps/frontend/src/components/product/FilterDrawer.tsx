import { useEffect } from 'react';
import type { Category } from '../../types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[] | undefined;
  categorySlug: string | undefined;
  selectedSizes: string[];
  selectedColors: string[];
  priceRange: [number, number];
  availableFilters: { sizes?: string[]; colors?: { name: string; hex: string }[] } | undefined;
  onCategoryChange: (slug: string | undefined) => void;
  onToggleSize: (size: string) => void;
  onToggleColor: (color: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onApplyPrice: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterDrawer({
  isOpen,
  onClose,
  categories,
  categorySlug,
  selectedSizes,
  selectedColors,
  priceRange,
  availableFilters,
  onCategoryChange,
  onToggleSize,
  onToggleColor,
  onPriceRangeChange,
  onApplyPrice,
  onClear,
  hasActiveFilters,
}: FilterDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Cerrar filtros">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Categorías</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => onCategoryChange(undefined)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !categorySlug ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Todas las categorías
                </button>
              </li>
              {categories?.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onCategoryChange(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      categorySlug === cat.slug ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name} ({cat._count?.products || 0})
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Tallas</h3>
            <div className="flex flex-wrap gap-2">
              {availableFilters?.sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => onToggleSize(size)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedSizes.includes(size)
                      ? 'border-primary-600 bg-primary-50 text-primary-600'
                      : 'border-gray-300 text-gray-600 hover:border-primary-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Colores</h3>
            <div className="flex flex-wrap gap-2">
              {availableFilters?.colors?.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onToggleColor(color.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                    selectedColors.includes(color.name)
                      ? 'border-primary-600 scale-110'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={color.name}
                >
                  {selectedColors.includes(color.name) && (
                    <svg className="absolute inset-0 m-auto w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Precio</h3>
            <div className="space-y-3">
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[0]}
                onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <input
                type="range"
                min="0"
                max="500"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{priceRange[0]}$</span>
                <span>{priceRange[1]}$</span>
              </div>
              <button onClick={onApplyPrice} className="btn btn-secondary w-full text-sm">
                Aplicar precio
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={onClear} className="btn btn-outline w-full text-sm">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button onClick={onClose} className="btn btn-primary w-full">
            Ver resultados
          </button>
        </div>
      </div>
    </div>
  );
}
