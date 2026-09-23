import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export function Cart() {
  const { cart, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const items = cart?.items || [];
  const subtotal = getSubtotal();
  const shipping = subtotal > 100 ? 0 : 4.99;
  const tax = subtotal * 0.21;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container-main py-16 text-center">
        <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 9l14 0" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Añade algunos productos para empezar</p>
        <Link to="/productos" className="btn btn-primary inline-block">Continuar comprando</Link>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu carrito</h1>

      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Link to={`/productos/${item.product.slug}`} className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={item.variant.images[0]?.url || item.product.images[0]?.url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/productos/${item.product.slug}`}>
                  <h3 className="font-semibold text-gray-900 truncate">{item.product.name}</h3>
                </Link>
                <p className="text-sm text-gray-500">
                  {item.variant.color} / {item.variant.size}
                </p>
                <p className="font-semibold text-gray-900 mt-1">{item.variant.price.toFixed(2)}$</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-center min-w-[3rem]">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.variant.stock}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold text-gray-900">
                  {(item.variant.price * item.quantity).toFixed(2)}$
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} artículos)</dt>
                <dd className="font-medium text-gray-900">{subtotal.toFixed(2)}$</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Envío</dt>
                <dd className="font-medium text-gray-900">
                  {shipping === 0 ? (
                    <span className="text-green-600">Gratis</span>
                  ) : (
                    `${shipping.toFixed(2)}$`
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">IVA (21%)</dt>
                <dd className="font-medium text-gray-900">{tax.toFixed(2)}$</dd>
              </div>
              {subtotal < 100 && (
                <p className="text-xs text-primary-600 bg-primary-50 p-2 rounded">
                  Añade { (100 - subtotal).toFixed(2) }$ más para envío gratis
                </p>
              )}
            </dl>
            <hr className="my-4 border-gray-100" />
            <div className="flex justify-between text-lg font-bold">
              <dt>Total</dt>
              <dd>{total.toFixed(2)}$</dd>
            </div>
            <Link to="/checkout" className="btn btn-primary w-full mt-4 py-3">
              Proceder al pago
            </Link>
            <p className="text-xs text-gray-500 text-center mt-4">
              Incluye IVA. Los gastos de envío se calculan en el checkout.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/productos" className="text-primary-600 hover:text-primary-700 font-medium">
          ← Seguir comprando
        </Link>
      </div>
    </div>
  );
}