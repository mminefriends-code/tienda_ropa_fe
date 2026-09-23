import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const statusOptions = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function OrderDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminApi.getOrder(id!).then((r) => r.data),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateOrderStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const paymentMutation = useMutation({
    mutationFn: (paymentStatus: string) => adminApi.updatePaymentStatus(id!, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Estado de pago actualizado');
    },
    onError: () => toast.error('Error al actualizar pago'),
  });

  const confirmWithPayment = () => {
    statusMutation.mutateAsync('CONFIRMED').then(() => paymentMutation.mutate('PAID'));
  };

  const paymentStatusReached = order?.paymentStatus === 'PAID' || order?.paymentStatus === 'FAILED';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h2>
        <Link to="/admin/pedidos" className="text-primary-600 hover:text-primary-700">Volver a pedidos</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/admin/pedidos" className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Estado del pedido</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Estado</label>
              <select
                value={order.status}
                onChange={(e) => statusMutation.mutate(e.target.value)}
                disabled={statusMutation.isPending}
                className="input"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Estado del pago</label>
              <select
                value={order.paymentStatus}
                onChange={(e) => paymentMutation.mutate(e.target.value)}
                disabled={paymentMutation.isPending}
                className="input"
              >
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Pagado</option>
                <option value="FAILED">Fallido</option>
                <option value="REFUNDED">Reembolsado</option>
              </select>
            </div>
            <button
              onClick={() => confirmWithPayment()}
              disabled={paymentStatusReached}
              className="btn btn-primary w-full justify-center"
            >
              Aprobar y confirmar envío
            </button>
            <button
              onClick={() => paymentMutation.mutate('FAILED')}
              disabled={paymentStatusReached}
              className="btn btn-secondary w-full justify-center"
            >
              Rechazar pago y devolver stock
            </button>
            {order.paymentStatus === 'PAID' && (
              <p className="text-xs text-green-600 font-medium">Pago aprobado: envío confirmado y stock reservado.</p>
            )}
            {order.paymentStatus === 'FAILED' && (
              <p className="text-xs text-red-600 font-medium">Pago rechazado: stock devuelto al catálogo.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900 mb-2">Datos del cliente</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p><span className="text-gray-500">Teléfono:</span> {order.shippingAddress.phone}</p>
            <p><span className="text-gray-500">Pago:</span> {order.paymentMethod === 'qr' ? 'Pago por QR' : 'Efectivo (contra entrega)'}</p>
            <p><span className="text-gray-500">Items:</span> {order.items.reduce((n, i) => n + i.quantity, 0)} · Total <span className="font-medium text-gray-900">{order.total.toFixed(2)}$</span></p>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Dirección de envío</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.state}, {order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Comprobante de pago</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${
            order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
            order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {order.paymentStatus === 'PAID' ? 'Pago aprobado' : order.paymentStatus === 'FAILED' ? 'Pago rechazado' : 'Pendiente de revisión'}
          </span>
        </div>

        {order.receiptUrl ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <img
                src={order.receiptUrl}
                alt="Comprobante de pago"
                className="max-w-full max-h-96 rounded-lg border border-gray-200 bg-white object-contain"
              />
              <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver comprobante en tamaño completo
              </a>
            </div>
            {order.stockReleased && (
              <p className="text-xs text-gray-500">
                Stock devuelto al catálogo (pedido rechazado o cancelado).
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">El cliente aún no ha adjuntado un comprobante de pago.</p>
            <p className="text-xs text-gray-400">
              {order.paymentMethod === 'qr'
                ? 'Revisa la transferencia/QR y aprueba manualmente el pedido para confirmar el envío.'
                : 'Pago contra entrega: confirma la orden para iniciar el envío.'}
            </p>
            {order.stockReleased && (
              <p className="text-xs text-gray-500">Stock devuelto al catálogo (pedido rechazado o cancelado).</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Productos</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product.images[0] ? (
                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500">
                  {item.variant.color} · {item.variant.size} · SKU: {item.variant.sku}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{item.total.toFixed(2)}$</p>
                <p className="text-xs text-gray-500">x{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{order.subtotal.toFixed(2)}$</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Envío</span>
            <span>{order.shipping.toFixed(2)}$</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento</span>
              <span>-{order.discount.toFixed(2)}$</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{order.total.toFixed(2)}$</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Notas del cliente</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
