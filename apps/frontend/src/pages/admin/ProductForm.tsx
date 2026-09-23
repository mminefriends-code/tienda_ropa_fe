import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, type ProductPayload } from '../../services/adminApi';
import { categoriesApi } from '../../services/endpoints';
import { ArModelManager } from '../../components/admin/ArModelManager';
import toast from 'react-hot-toast';
import type { Category } from '../../types';

interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  sku: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface VariantForm {
  size: string;
  color: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

const getErrorMessage = (error: any, fallback: string) => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  if (msg) return msg;
  return fallback;
};

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>();
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: () => categoriesApi.getAll(true).then((r) => r.data),
  });

  const { data: product } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.getProduct(id!).then((r) => r.data),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        sku: product.sku,
        categoryId: product.categoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
      setVariants(
        product.variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
          sku: v.sku,
        })),
      );
      setImageUrls(product.images.map((img) => img.url));
    }
  }, [product, reset]);

  const saveMutation = useMutation({
    mutationFn: (payload: ProductPayload) => {
      if (isEditing) {
        return adminApi.updateProduct(id!, payload);
      }
      return adminApi.createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado');
      navigate('/admin/productos');
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al guardar producto')),
  });

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', colorHex: '#000000', price: 0, stock: 0, sku: '' }]);
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | number) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setImageUrls([...imageUrls, url]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ProductFormData) => {
    const payload: ProductPayload = {
      name: data.name,
      description: data.description,
      basePrice: Number(data.basePrice),
      sku: data.sku,
      categoryId: data.categoryId,
      isFeatured: !!data.isFeatured,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
      variants: variants.map((v) => ({
        size: v.size.trim(),
        color: v.color.trim(),
        colorHex: v.colorHex.trim(),
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : undefined,
        stock: Number(v.stock) || 0,
        sku: v.sku.trim(),
      })),
      images: imageUrls.length > 0 ? imageUrls.map((url, index) => ({ url, position: index, isMain: index === 0 })) : undefined,
    };
    saveMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Información del producto</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Nombre</label>
              <input {...register('name', { required: true })} className="input" />
              {errors.name && <p className="text-red-500 text-sm mt-1">Requerido</p>}
            </div>
            <div className="md:col-span-2">
              <label className="label">Descripción</label>
              <textarea {...register('description', { required: true })} rows={4} className="input" />
              {errors.description && <p className="text-red-500 text-sm mt-1">Requerido</p>}
            </div>
            <div>
              <label className="label">Precio base ($)</label>
              <input type="number" step="0.01" {...register('basePrice', { required: true, min: 0 })} className="input" />
              {errors.basePrice && <p className="text-red-500 text-sm mt-1">Requerido</p>}
            </div>
            <div>
              <label className="label">SKU</label>
              <input {...register('sku', { required: true })} className="input" />
              {errors.sku && <p className="text-red-500 text-sm mt-1">Requerido</p>}
            </div>
            <div>
              <label className="label">Categoría</label>
              <select {...register('categoryId', { required: true })} className="input">
                <option value="">Seleccionar...</option>
                {categories?.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-sm mt-1">Requerido</p>}
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isFeatured')} className="w-4 h-4 text-primary-600 border-gray-300 rounded" />
                <span className="text-sm text-gray-700">Destacado</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Imágenes (URLs)</h2>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="input text-sm py-2 w-72"
              />
              <button type="button" onClick={addImageUrl} className="btn btn-secondary text-sm">
                + Añadir
              </button>
            </div>
          </div>
          {imageUrls.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Sin imágenes. Añade URLs de imágenes (https://...) para el producto.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Variantes (Talla / Color)</h2>
            <button type="button" onClick={addVariant} className="btn btn-secondary text-sm">
              + Añadir variante
            </button>
          </div>
          {variants.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay variantes. Añade al menos una variante con talla, color y stock.
            </p>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-gray-500 mb-1 block">Talla</label>
                    <input
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="input text-sm py-2"
                      placeholder="XS, S, M, L..."
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-gray-500 mb-1 block">Color</label>
                    <input
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="input text-sm py-2"
                      placeholder="Negro, Rojo..."
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-xs text-gray-500 mb-1 block">Hex</label>
                    <input
                      type="color"
                      value={variant.colorHex}
                      onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                      className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <label className="text-xs text-gray-500 mb-1 block">Precio ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                      className="input text-sm py-2"
                    />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <label className="text-xs text-gray-500 mb-1 block">Stock</label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                      className="input text-sm py-2"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs text-gray-500 mb-1 block">SKU</label>
                    <input
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      className="input text-sm py-2"
                      placeholder="SKU variante"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {isEditing && id ? (
            <ArModelManager productId={id} variants={product?.variants || []} />
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Prueba AR (recorte 2D)</h2>
              <p className="text-sm text-gray-500">
                Guarda primero el producto. Después podrás subir el recorte PNG de la prenda para el probador virtual.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/admin/productos')} className="btn btn-secondary px-8">
            Cancelar
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary px-8">
            {saveMutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar producto' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  );
}