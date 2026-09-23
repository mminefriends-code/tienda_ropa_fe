import { Link } from 'react-router-dom';
import { useFeaturedProducts, useCategories } from '../hooks/useQueries';
import { ProductCard } from '../components/product/ProductCard';
import { CategoryCard } from '../components/product/CategoryCard';

export function Home() {
  const { data: featuredProducts } = useFeaturedProducts(8);
  const { data: categories } = useCategories();

  return (
    <div className="py-12">
      <section className="container-main mb-16">
        <div className="relative rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 p-8 md:p-16 text-white overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Nueva colección primavera-verano
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-md">
              Descubre las últimas tendencias en moda femenina. Diseños exclusivos, calidad premium y tallas para todas.
            </p>
            <Link to="/productos" className="btn bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-3">
              Comprar ahora
            </Link>
          </div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22white%22 stroke-width=%220.5%22 opacity=%220.1%22/%3E%3C/svg%3E')] opacity-50" />
        </div>
      </section>

      <section className="container-main mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Categorías populares</h2>
          <Link to="/productos" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.slice(0, 4).map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="container-main">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Productos destacados</h2>
          <Link to="/productos" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-main mt-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Envío gratis</h3>
            <p className="text-gray-600 text-sm">En pedidos superiores a 100$</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pago seguro</h3>
            <p className="text-gray-600 text-sm">Protección total en tus compras</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Devoluciones fáciles</h3>
            <p className="text-gray-600 text-sm">30 días para cambiar de opinión</p>
          </div>
        </div>
      </section>
    </div>
  );
}