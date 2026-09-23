import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../hooks/useQueries';
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

export function Orders() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders(page, 10);

  return (
    <div className="container-main py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis pedidos</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 9l14 0" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes pedidos aún</h2>
            <p className="text-gray-500 mb-6">Cuando realices tu primera compra, aparecerá aquí</p>
            <Link to="/productos" className="btn btn-primary inline-block">Ir a comprar</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data?.data.map((order) => (
                <Link
                  key={order.id}
                  to={`/cuenta/pedidos/${order.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {order.items[0]?.variant.images[0]?.url || order.items[0]?.product.images[0]?.url ? (
                          <img src={order.items[0]?.variant.images[0]?.url || order.items[0]?.product.images[0]?.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{order.items.length} artículo{order.items.length > 1 ? 's' : ''}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right sm:text-left">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{order.total.toFixed(2)}$</p>
                        <p className="text-xs text-gray-500">{order.paymentStatus === 'PAID' ? 'Pagado' : 'Pendiente'}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Anterior
                </button>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg font-medium ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(data!.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="btn btn-secondary"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}