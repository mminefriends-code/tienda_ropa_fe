import { Link } from 'react-router-dom';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images.find((img) => img.isMain) || product.images[0];
  const minPrice = Math.min(...product.variants.filter((v) => v.isActive).map((v) => v.price));
  const maxPrice = Math.max(...product.variants.filter((v) => v.isActive).map((v) => v.price));
  const hasDiscount = product.variants.some((v) => v.compareAtPrice && v.compareAtPrice > v.price);

  return (
    <Link to={`/productos/${product.slug}`} className="card group">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
        {mainImage && (
          <img
            src={mainImage.url}
            alt={mainImage.alt || product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{Math.round(((maxPrice - minPrice) / maxPrice) * 100)}%
          </span>
        )}
        {product.arModels.length > 0 && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-primary-600 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Prueba AR
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.category.name}</p>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">
            {minPrice === maxPrice ? `${minPrice.toFixed(2)}$` : `${minPrice.toFixed(2)}$ - ${maxPrice.toFixed(2)}$`}
          </span>
          {product.variants.some((v) => v.compareAtPrice) && (
            <span className="text-sm text-gray-400 line-through">
              {maxPrice.toFixed(2)}$
            </span>
          )}
        </div>
        <div className="flex gap-1 mt-2">
          {product.variants.filter((v) => v.isActive).slice(0, 5).map((variant) => (
            <span
              key={variant.id}
              className="w-5 h-5 rounded-full border border-gray-200"
              style={{ backgroundColor: variant.colorHex }}
              title={variant.color}
            />
          ))}
          {product.variants.filter((v) => v.isActive).length > 5 && (
            <span className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-600">
              +{product.variants.filter((v) => v.isActive).length - 5}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}