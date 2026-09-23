import { Link } from 'react-router-dom';
import type { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link to={`/productos?category=${category.slug}`} className="card group relative aspect-square overflow-hidden">
      {category.image ? (
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary-600">{category.name.charAt(0)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-semibold text-lg">{category.name}</h3>
        <p className="text-xs text-primary-100">{category._count?.products || 0} productos</p>
      </div>
    </Link>
  );
}