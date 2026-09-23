import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOrder } from '../../hooks/useQueries';
import { ordersApi } from '../../services/endpoints';
import type { OrderStatus } from '../../types';

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-100 text-gray-800',
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useOrder(id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      await ordersApi.uploadReceipt(id, file);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Error al subir el comprobante');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-main py-8">
        <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-main py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido no encontrado</h2>
        <Link to="/cuenta/pedidos" className="btn btn-primary mt-4 inline-block">Volver a mis pedidos</Link>
      </div>
    );
  }

  const statusSteps: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'RETURNED';

  return (
    <div className="container-main py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/cuenta/pedidos" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
              ← Volver a mis pedidos
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Pedido {order.orderNumber}</h1>
          </div>
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>

        {!isCancelled && (
          <div className="mb-8">
            <div className="relative">
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200" />
              <div className="relative flex justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step} className="relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors ${
                        index <= currentStepIndex
                          ? 'bg-primary-600 text-white border-4 border-primary-600'
                          : 'bg-white text-gray-400 border-4 border-gray-200'
                      }`}
                    >
                      {index <= currentStepIndex ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs text-center font-medium ${index <= currentStepIndex ? 'text-primary-600' : 'text-gray-500'}`}>
                      {statusLabels[step]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                      {item.variant.images[0]?.url || item.product.images[0]?.url ? (
                        <img src={item.variant.images[0]?.url || item.product.images[0]?.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/productos/${item.product.slug}`} className="font-medium text-gray-900 hover:text-primary-600">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500">{item.variant.color} / {item.variant.size}</p>
                      <p className="text-sm text-gray-900">{item.quantity} x {item.price.toFixed(2)}$</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.total.toFixed(2)}$</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pagos</h2>
              <div className="space-y-3">
                {order.payments.length > 0 ? (
                  order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{payment.provider}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{payment.amount.toFixed(2)}$</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay pagos registrados</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comprobante de pago</h2>
              {order.receiptUrl ? (
                <div>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mb-3 ${
                    order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus === 'PAID' ? 'Pago aprobado' : 'Comprobante en revisión'}
                  </span>
                  <p className="text-sm text-gray-500 mb-3">Tu comprobante fue enviado correctamente.</p>
                  <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Ver comprobante enviado
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    {order.paymentMethod === 'qr'
                      ? 'Adjunta el comprobante de tu pago por QR para que lo revisemos.'
                      : 'Este pedido se paga contra entrega, no requiere comprobante.'}
                  </p>
                  {order.paymentMethod === 'qr' && order.paymentStatus !== 'PAID' && (
                    <label className="btn btn-secondary inline-block cursor-pointer">
                      {isUploading ? 'Subiendo...' : 'Subir comprobante'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleReceiptUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                  {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">{order.subtotal.toFixed(2)}$</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Envío</dt>
                  <dd className="font-medium text-gray-900">{order.shipping.toFixed(2)}$</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">IVA (21%)</dt>
                  <dd className="font-medium text-gray-900">{order.tax.toFixed(2)}$</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <dt>Descuento</dt>
                    <dd className="font-medium">-{order.discount.toFixed(2)}$</dd>
                  </div>
                )}
              </dl>
              <hr className="my-4 border-gray-100" />
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd>{order.total.toFixed(2)}$</dd>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección de envío</h2>
              <address className="text-gray-600 not-italic space-y-1">
                <p className="font-medium text-gray-900">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.state}</p>
                <p>{order.shippingAddress.country}</p>
                <p>{order.shippingAddress.phone}</p>
              </address>
            </div>

            {order.billingAddress && order.shippingAddress.street !== order.billingAddress.street && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dirección de facturación</h2>
                <address className="text-gray-600 not-italic space-y-1">
                  <p className="font-medium text-gray-900">{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                  <p>{order.billingAddress.street}</p>
                  <p>{order.billingAddress.postalCode} {order.billingAddress.city}</p>
                  <p>{order.billingAddress.state}</p>
                  <p>{order.billingAddress.country}</p>
                </address>
              </div>
            )}

            {order.notes && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}