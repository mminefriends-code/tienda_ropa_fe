import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import type { DashboardStats } from '../../services/adminApi';
import toast from 'react-hot-toast';

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  const { data: reorderAlerts } = useQuery({
    queryKey: ['admin-reorder-alerts'],
    queryFn: () => adminApi.getReorderAlerts().then((r) => r.data),
    refetchInterval: 60000,
  });

  const alertNotified = useRef(false);
  useEffect(() => {
    if (reorderAlerts && reorderAlerts.length > 0 && !alertNotified.current) {
      alertNotified.current = true;
      toast(`${reorderAlerts.length} variante(s) con stock bajo — revisa a qué proveedor pedir`, { id: 'low-stock-alert' });
    }
  }, [reorderAlerts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(reorderAlerts?.length || 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div>
            <p className="font-semibold text-red-800">
              Hay {reorderAlerts?.length} variante(s) con stock por debajo del punto de pedido
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              Entra en Proveedores para ver a qué proveedor pedir según la categoría.
            </p>
          </div>
          <Link to="/admin/proveedores" className="btn btn-primary">
            Ver proveedores
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ventas hoy"
          value={`${(stats?.todaySales || 0).toFixed(2)}$`}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Ventas este mes"
          value={`${(stats?.monthSales || 0).toFixed(2)}$`}
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Pedidos pendientes"
          value={stats?.pendingOrders || 0}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          color="bg-yellow-100 text-yellow-600"
        />
        <StatCard
          label="Total usuarios"
          value={stats?.totalUsers || 0}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos recientes</h2>
            <Link to="/admin/pedidos" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-6 py-3">Pedido</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.recentOrders?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No hay pedidos recientes
                    </td>
                  </tr>
                )}
                {stats?.recentOrders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/admin/pedidos/${order.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.total.toFixed(2)}$
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Productos más vendidos</h2>
          </div>
          <div className="p-6 space-y-4">
            {stats?.topProducts?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Sin datos de ventas</p>
            )}
            {stats?.topProducts?.slice(0, 5).map((item, index) => (
              <div key={item.product.id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{item.totalSold} vendidos · {item.revenue.toFixed(2)}$</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen general</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Pedidos totales</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Productos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{(stats?.totalSales || 0).toFixed(0)}$</p>
            <p className="text-sm text-gray-500 mt-1">Ventas totales</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.pendingOrders || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Por procesar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
