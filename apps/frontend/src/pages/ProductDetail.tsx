import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useProduct,
  useRelatedProducts,
  useArModels,
  useCreateArSession,
  useEndArSession,
  useRecommendedSize,
  useUserMeasurements,
} from '../hooks/useQueries';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ProductCard } from '../components/product/ProductCard';
import { TryOnViewer } from '../components/ar/TryOnViewer';
import { CaptureResultModal } from '../components/ar/CaptureResultModal';
import type { ProductVariant, ArModel } from '../types';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: relatedProducts } = useRelatedProducts(product?.id || '', 4);
  const { data: arModels } = useArModels(product?.id || '');
  const { data: recommendation } = useRecommendedSize(product?.id || '');
  const { data: userMeasurements } = useUserMeasurements();
  const createArSession = useCreateArSession();
  const endArSession = useEndArSession();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showArViewer, setShowArViewer] = useState(false);
  const [selectedArModel, setSelectedArModel] = useState<ArModel | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [savedToProfile, setSavedToProfile] = useState(false);

  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants.find((v) => v.isActive) || product.variants[0]);
    }
  }, [product, selectedVariant]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    if (selectedVariant.stock < quantity) {
      alert('Stock insuficiente');
      return;
    }
    try {
      await addItem(product!.id, selectedVariant.id, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleArTryOn = (model?: ArModel) => {
    if (!model) {
      const auto: ArModel = {
        id: '__auto__',
        name: 'Recorte automático',
        modelUrl: '',
        format: 'GLTF',
        scale: 1,
        overlayImage: '',
      };
      setSelectedArModel(auto);
    } else {
      setSelectedArModel(model);
    }
    setShowArViewer(true);
  };

  const handleCapture = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setSavedToProfile(false);
    if (!user || !selectedVariant || !selectedArModel || selectedArModel.id === '__auto__') return;
    try {
      const session = await createArSession.mutateAsync({
        productId: product!.id,
        variantId: selectedVariant.id,
        arModelId: selectedArModel.id,
      });
      await endArSession.mutateAsync({
        sessionId: session.data.id,
        data: { screenshotUrl: dataUrl, duration: 30 },
      });
      setSavedToProfile(true);
    } catch (error) {
      console.error('Error saving AR session:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container-main py-8">
        <div className="animate-pulse space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="aspect-[3/4] bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-main py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
        <Link to="/productos" className="btn btn-primary mt-4 inline-block">Volver a productos</Link>
      </div>
    );
  }

  const mainImage = product.images[selectedImageIndex] || product.images[0];
  const price = selectedVariant?.price || product.basePrice;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const inStock = (selectedVariant?.stock || 0) > 0;

  return (
    <div className="container-main py-8">
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li><Link to="/" className="hover:text-primary-600">Inicio</Link></li>
          <li><span>/</span></li>
          <li><Link to="/productos" className="hover:text-primary-600">Productos</Link></li>
          <li><span>/</span></li>
          <li><span className="text-gray-900 font-medium">{product.category.name}</span></li>
          <li><span>/</span></li>
          <li><span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span></li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50">
            {mainImage && (
              <img
                src={mainImage.url}
                alt={mainImage.alt || product.name}
                className="w-full h-full object-cover"
              />
            )}
            {product.images.length > 0 && (
              <button
                onClick={() => handleArTryOn(undefined)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-primary-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:bg-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Probar con AR
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img src={image.url} alt={image.alt || `${product.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-gray-500 uppercase tracking-wide">{product.category.name}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-2xl md:text-3xl font-bold text-gray-900">{price.toFixed(2)}$</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-xl text-gray-400 line-through">{compareAtPrice.toFixed(2)}$</span>
            )}
            {recommendation?.hasMeasurements && recommendation.recommendedSize && (
              <span className="bg-primary-50 border border-primary-200 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">
                Tu talla: {recommendation.recommendedSize}
              </span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          <div>
            <label className="label">Talla</label>
            <div className="flex flex-wrap gap-2">
              {product.variants
                .filter((v) => v.color === selectedVariant?.color && v.isActive)
                .map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock === 0}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariant?.id === variant.id
                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                        : variant.stock === 0
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:border-primary-300'
                    }`}
                  >
                    {variant.size} {variant.stock < 5 && variant.stock > 0 && `(${variant.stock})`}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Map(product.variants.filter((v) => v.isActive).map((v) => [v.color, v])).values()).map(
                (variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      const sameSize = product.variants.find(
                        (v) => v.color === variant.color && v.size === selectedVariant?.size && v.isActive,
                      );
                      setSelectedVariant(sameSize || variant);
                    }}
                    className={`w-10 h-10 rounded-full border-3 transition-all relative ${
                      selectedVariant?.color === variant.color
                        ? 'border-primary-600 scale-110'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                    style={{ backgroundColor: variant.colorHex }}
                    title={variant.color}
                    aria-label={variant.color}
                  >
                    {selectedVariant?.color === variant.color && (
                      <svg className="absolute inset-0 m-auto w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-b border-gray-100 py-4">
            <label className="label mb-0">Cantidad</label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-l-lg"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                min="1"
                max={selectedVariant?.stock || 99}
                className="w-16 text-center border-x border-gray-300 focus:outline-none"
              />
              <button
                onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock || 99, q + 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-r-lg"
              >
                +
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {inStock ? `Disponible (${selectedVariant?.stock} unidades)` : 'Agotado'}
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || createArSession.isPending}
              className="btn btn-primary flex-1 py-3 text-lg"
            >
              {createArSession.isPending ? 'Añadiendo...' : 'Añadir al carrito'}
            </button>
            <button className="btn btn-secondary px-6" aria-label="Añadir a lista de deseos">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {arModels && arModels.length > 0 && (
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
              <h3 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Prueba virtual con Realidad Aumentada
              </h3>
              <p className="text-sm text-primary-700 mb-3">
                Visualiza cómo te queda esta prenda usando la cámara de tu dispositivo
              </p>
              <div className="flex flex-wrap gap-2">
                {arModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleArTryOn(model)}
                    disabled={createArSession.isPending}
                    className="btn btn-outline text-sm"
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>{'Envío gratis >100$'}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Devoluciones 30 días</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Pago seguro</span>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} to={`/productos/${relatedProduct.slug}`}>
                <ProductCard product={relatedProduct} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {showArViewer && selectedArModel && (
        <TryOnViewer
          models={product.arModels.length > 0 ? product.arModels : [selectedArModel]}
          productName={product.name}
          initialModelId={selectedArModel.id}
          fallbackImage={mainImage?.url}
          availableSizes={Array.from(new Set(product.variants.filter((v) => v.isActive).map((v) => v.size)))}
          initialHeight={userMeasurements?.height ? Number(userMeasurements.height) : undefined}
          initialWeight={userMeasurements?.weight ? Number(userMeasurements.weight) : undefined}
          onClose={() => setShowArViewer(false)}
          onCapture={handleCapture}
        />
      )}

      {capturedImage && (
        <CaptureResultModal
          dataUrl={capturedImage}
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          savedToProfile={savedToProfile}
          onLogin={() => navigate('/login', { state: { from: `/productos/${slug}` } })}
          onRegister={() => navigate('/registro', { state: { from: `/productos/${slug}` } })}
          onViewProfile={() => {
            setCapturedImage(null);
            setShowArViewer(false);
            navigate('/cuenta/perfil');
          }}
          onClose={() => setCapturedImage(null)}
        />
      )}
    </div>
  );
}