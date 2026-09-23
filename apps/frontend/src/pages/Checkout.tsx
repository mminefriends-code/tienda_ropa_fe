import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../services/endpoints';
import type { Order } from '../types';

const BOLIVIA_DEPARTMENTS = [
  'La Paz',
  'Santa Cruz',
  'Cochabamba',
  'Oruro',
  'Potosí',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando',
];

interface CheckoutForm {
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingSameAsShipping: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingPhone: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  notes: string;
  paymentMethod: 'qr' | 'cash';
}

export function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cart, clearCart, getSubtotal } = useCartStore();
  const items = cart?.items || [];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const subtotal = getSubtotal();
  const shipping = subtotal > 100 ? 0 : 4.99;
  const tax = subtotal * 0.21;
  const total = subtotal + shipping + tax;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      shippingFirstName: user?.firstName || '',
      shippingLastName: user?.lastName || '',
      shippingPhone: user?.phone || '',
      shippingCountry: 'BO',
      billingCountry: 'BO',
      billingSameAsShipping: true,
      paymentMethod: 'qr',
    },
  });

  const billingSameAsShipping = watch('billingSameAsShipping');

  const handleBillingSameChange = (value: boolean) => {
    setValue('billingSameAsShipping', value);
    if (value) {
      setValue('billingFirstName', watch('shippingFirstName'));
      setValue('billingLastName', watch('shippingLastName'));
      setValue('billingPhone', watch('shippingPhone'));
      setValue('billingStreet', watch('shippingStreet'));
      setValue('billingCity', watch('shippingCity'));
      setValue('billingState', watch('shippingState'));
      setValue('billingPostalCode', watch('shippingPostalCode'));
      setValue('billingCountry', watch('shippingCountry'));
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      navigate('/carrito');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const shippingAddress = {
        firstName: data.shippingFirstName,
        lastName: data.shippingLastName,
        phone: data.shippingPhone,
        street: data.shippingStreet,
        city: data.shippingCity,
        state: data.shippingState,
        postalCode: data.shippingPostalCode,
        country: data.shippingCountry,
      };

      const billingAddress = data.billingSameAsShipping ? shippingAddress : {
        firstName: data.billingFirstName,
        lastName: data.billingLastName,
        phone: data.billingPhone,
        street: data.billingStreet,
        city: data.billingCity,
        state: data.billingState,
        postalCode: data.billingPostalCode,
        country: data.billingCountry,
      };

      const order = await ordersApi.create({
        shippingAddress,
        billingAddress,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
      });

      await clearCart();
      setPlacedOrder(order.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !placedOrder) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const response = await ordersApi.uploadReceipt(placedOrder.id, file);
      setPlacedOrder(response.data);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Error al subir el comprobante');
    } finally {
      setIsUploading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="container-main py-16 max-w-xl text-center">
        <div className="bg-green-100 text-green-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido realizado con éxito!</h2>
        <p className="text-gray-500 mb-1">Tu pedido <span className="font-semibold text-gray-900">{placedOrder.orderNumber}</span> ha sido registrado correctamente.</p>
        <p className="text-gray-500 mb-8">Paga con el método seleccionado y sigue el estado desde tu cuenta.</p>

        {placedOrder.paymentMethod === 'qr' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-1">Escanea el código QR para pagar</h3>
            <p className="text-sm text-gray-500 mb-4">Escanea con tu aplicación de pagos y realiza la transferencia.</p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
              <img
                src="/qr_tienda.jpeg"
                alt="QR de pago de la tienda"
                className="w-52 h-52 object-contain"
              />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/qr_tienda.jpeg"
                download="qr-tienda.jpeg"
                className="btn btn-primary inline-block"
              >
                Descargar QR
              </a>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-3">Adjunta tu comprobante de pago</h4>
              {placedOrder.receiptUrl && (
                <div className="flex items-center justify-center gap-2 mb-3 text-sm text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Comprobante enviado. Revisaremos el pago pronto.
                </div>
              )}
              <label className="btn btn-secondary inline-block cursor-pointer">
                {isUploading ? 'Subiendo...' : placedOrder.receiptUrl ? 'Reemplazar comprobante' : 'Seleccionar comprobante'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleReceiptUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Formatos permitidos: JPG, PNG, WEBP, PDF (máx 5MB)</p>
              {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
            </div>
          </div>
        )}

        {placedOrder.paymentMethod !== 'qr' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Pago contra entrega</h3>
            <p className="text-sm text-gray-500">Paga en efectivo cuando recibas tu pedido.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/productos" className="btn btn-primary inline-block">Seguir comprando</Link>
          <Link to={`/cuenta/pedidos/${placedOrder.id}`} className="btn btn-secondary inline-block">Ver mi pedido</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-main py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Carrito vacío</h2>
        <p className="text-gray-500 mb-6">Añade productos antes de proceder al pago</p>
        <a href="/productos" className="btn btn-primary inline-block">Ir a comprar</a>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar compra</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección de envío</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input {...register('shippingFirstName', { required: true })} className="input" />
                {errors.shippingFirstName && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Apellidos *</label>
                <input {...register('shippingLastName', { required: true })} className="input" />
                {errors.shippingLastName && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Teléfono *</label>
                <input type="tel" {...register('shippingPhone', { required: true })} className="input" />
                {errors.shippingPhone && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dirección *</label>
                <input {...register('shippingStreet', { required: true })} className="input" placeholder="Calle y número" />
                {errors.shippingStreet && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Ciudad *</label>
                <input {...register('shippingCity', { required: true })} className="input" />
                {errors.shippingCity && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Departamento *</label>
                <select {...register('shippingState', { required: true })} className="input">
                  {BOLIVIA_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.shippingState && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">Código postal *</label>
                <input {...register('shippingPostalCode', { required: true })} className="input" />
                {errors.shippingPostalCode && <p className="text-red-500 text-sm mt-1">Requerido</p>}
              </div>
              <div>
                <label className="label">País *</label>
                <select {...register('shippingCountry', { required: true })} className="input">
                  <option value="BO">Bolivia</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección de facturación</h2>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('billingSameAsShipping')}
                  onChange={(e) => handleBillingSameChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-gray-700">Usar la misma dirección para facturación</span>
              </label>
            </div>
            {!billingSameAsShipping && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input {...register('billingFirstName', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">Apellidos *</label>
                  <input {...register('billingLastName', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">Teléfono *</label>
                  <input type="tel" {...register('billingPhone', { required: true })} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Dirección *</label>
                  <input {...register('billingStreet', { required: true })} className="input" placeholder="Calle y número" />
                </div>
                <div>
                  <label className="label">Ciudad *</label>
                  <input {...register('billingCity', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">Departamento *</label>
                  <select {...register('billingState', { required: true })} className="input">
                    {BOLIVIA_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Código postal *</label>
                  <input {...register('billingPostalCode', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">País *</label>
                  <select {...register('billingCountry', { required: true })} className="input">
                    <option value="BO">Bolivia</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de pago</h2>
            <div className="space-y-3">
              {['qr', 'cash'].map((method) => (
                <label key={method} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300">
                  <input
                    type="radio"
                    value={method}
                    {...register('paymentMethod')}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-900 capitalize">{method === 'qr' ? 'Pago por QR' : 'Efectivo (contra entrega)'}</span>
                </label>
              ))}
            </div>
            {watch('paymentMethod') === 'qr' && (
              <p className="text-sm text-gray-500 mt-3">
                Después de confirmar el pedido podrás descargar el código QR de la tienda y adjuntar tu comprobante de pago.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas del pedido</h2>
            <textarea
              {...register('notes')}
              rows={3}
              className="input"
              placeholder="Instrucciones de entrega, horario preferido, etc."
            />
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full py-3 text-lg">
            {isSubmitting ? 'Procesando...' : `Pagar ${total.toFixed(2)}$`}
          </button>
        </div>

        <div className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.variant.images[0]?.url || item.product.images[0]?.url}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.variant.color} / {item.variant.size}</p>
                    <p className="text-sm text-gray-900">{item.quantity} x {item.variant.price.toFixed(2)}$</p>
                  </div>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-100" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-900">{subtotal.toFixed(2)}$</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Envío</dt>
                <dd className="font-medium text-gray-900">{shipping === 0 ? 'Gratis' : `${shipping.toFixed(2)}$`}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">IVA (21%)</dt>
                <dd className="font-medium text-gray-900">{tax.toFixed(2)}$</dd>
              </div>
            </dl>
            <hr className="my-4 border-gray-100" />
            <div className="flex justify-between text-lg font-bold">
              <dt>Total</dt>
              <dd>{total.toFixed(2)}$</dd>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Pago seguro con encriptación SSL
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}