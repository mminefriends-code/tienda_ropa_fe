import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, useCategories, useProductFilters } from '../hooks/useQueries';
import { ProductCard } from '../components/product/ProductCard';
import { FilterDrawer } from '../components/product/FilterDrawer';
import type { ProductFilters } from '../types';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categorySlug = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;

  const filters: ProductFilters = {
    categoryId: categorySlug,
    search,
    sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    colors: selectedColors.length > 0 ? selectedColors : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined,
    sortBy,
    sortOrder,
  };

  const { data: productsResponse, isLoading } = useProducts(filters);
  const products = productsResponse?.data || [];
  const { data: categories } = useCategories();
  const { data: availableFilters } = useProductFilters(categorySlug);

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      } else {
        params.delete(key);
      }
    });
    params.set('page', '1');
    setSearchParams(params);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 500]);
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = selectedSizes.length > 0 || selectedColors.length > 0 || priceRange[0] > 0 || priceRange[1] < 500;

  return (
    <div className="container-main py-8">
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        categorySlug={categorySlug}
        selectedSizes={selectedSizes}
        selectedColors={selectedColors}
        priceRange={priceRange}
        availableFilters={availableFilters}
        onCategoryChange={(slug) => handleFilterChange({ categoryId: slug })}
        onToggleSize={toggleSize}
        onToggleColor={toggleColor}
        onPriceRangeChange={setPriceRange}
        onApplyPrice={() => handleFilterChange({ minPrice: priceRange[0] > 0 ? priceRange[0] : undefined, maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined })}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Categorías</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleFilterChange({ categoryId: undefined })}
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
                      onClick={() => handleFilterChange({ categoryId: cat.slug })}
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
              <h3 className="font-semibold text-gray-900 mb-4">Tallas</h3>
              <div className="flex flex-wrap gap-2">
                {availableFilters?.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
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
              <h3 className="font-semibold text-gray-900 mb-4">Colores</h3>
              <div className="flex flex-wrap gap-2">
                {availableFilters?.colors?.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.name)}
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
              <h3 className="font-semibold text-gray-900 mb-4">Precio</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{priceRange[0]}$</span>
                  <span>{priceRange[1]}$</span>
                </div>
                <button
                  onClick={() => handleFilterChange({ minPrice: priceRange[0] > 0 ? priceRange[0] : undefined, maxPrice: priceRange[1] < 500 ? priceRange[1] : undefined })}
                  className="btn btn-secondary w-full text-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-outline w-full text-sm">
                Limpiar filtros
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden btn btn-secondary flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {selectedSizes.length + selectedColors.length + (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0)}
                </span>
              )}
            </button>
            <div className="relative max-w-xs w-full">
              <input
                type="search"
                placeholder="Buscar productos..."
                defaultValue={search}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search: e.currentTarget.value })}
                className="input pl-10"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Ordenar:</label>
              <select
                value={`${sortBy},${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split(',');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                className="input py-2 w-auto"
              >
                <option value="createdAt,desc">Más recientes</option>
                <option value="name,asc">Nombre (A-Z)</option>
                <option value="name,desc">Nombre (Z-A)</option>
                <option value="basePrice,asc">Precio: menor a mayor</option>
                <option value="basePrice,desc">Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="flex justify-center gap-2">
                <button className="btn btn-secondary" disabled>Anterior</button>
                <button className="btn btn-primary">1</button>
                <button className="btn btn-secondary">2</button>
                <button className="btn btn-secondary">3</button>
                <button className="btn btn-secondary">Siguiente</button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-gray-500 mb-4">Intenta ajustar tus filtros o busca con otros términos</p>
              <button onClick={clearFilters} className="btn btn-primary">Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}