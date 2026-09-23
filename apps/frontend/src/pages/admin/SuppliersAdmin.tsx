import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import type { Supplier, ReorderAlert, RestockOrder } from '../../services/adminApi';
import toast from 'react-hot-toast';

type Tab = 'proveedores' | 'alertas' | 'pedidos';

const tabs: { id: Tab; label: string }[] = [
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'alertas', label: 'Alertas de stock' },
  { id: 'pedidos', label: 'Pedidos de reposición' },
];

const restockStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ORDERED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const restockStatusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ORDERED: 'Pedido',
  RECEIVED: 'Recibido',
  CANCELLED: 'Cancelado',
};

interface RestockLine {
  variantId: string;
  quantity: number;
}

interface SupplierForm {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
  categoryIds: string[];
}

const emptySupplierForm: SupplierForm = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
  categoryIds: [],
};

export function SuppliersAdmin() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('proveedores');

  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptySupplierForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [restockFormOpen, setRestockFormOpen] = useState(false);
  const [restockSupplierId, setRestockSupplierId] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [restockLines, setRestockLines] = useState<RestockLine[]>([]);

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => adminApi.suppliers.getAll().then((r) => r.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['admin-reorder-alerts'],
    queryFn: () => adminApi.getReorderAlerts().then((r) => r.data),
  });

  const { data: restockOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-restock-orders'],
    queryFn: () => adminApi.getRestockOrders().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-supplier-categories'],
    queryFn: () => adminApi.getCategories(true).then((r) => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-supplier-products'],
    queryFn: () => adminApi.getProducts({ limit: 100, isActive: true }).then((r) => r.data),
  });

  const allVariants = (productsData?.data || []).flatMap((p) =>
    p.variants.filter((v) => v.isActive).map((v) => ({ ...v, productName: p.name })),
  );

  const createSupplierMutation = useMutation({
    mutationFn: (data: typeof emptySupplierForm) => adminApi.suppliers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reorder-alerts'] });
      toast.success('Proveedor registrado');
      closeForm();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al registrar proveedor'));
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof emptySupplierForm> }) =>
      adminApi.suppliers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reorder-alerts'] });
      toast.success('Proveedor actualizado');
      closeForm();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al actualizar proveedor'));
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => adminApi.suppliers.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reorder-alerts'] });
      toast.success('Proveedor eliminado');
      setDeleteId(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al eliminar proveedor'));
    },
  });

  const createRestockMutation = useMutation({
    mutationFn: (data: { supplierId: string; notes?: string; items: RestockLine[] }) =>
      adminApi.createRestockOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restock-orders'] });
      toast.success('Pedido de reposición creado');
      closeRestockForm();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al crear el pedido'));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateRestockOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-restock-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reorder-alerts'] });
      toast.success('Pedido de reposición actualizado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al actualizar el pedido'));
    },
  });

  const openNewForm = () => {
    setEditingSupplier(null);
    setForm(emptySupplierForm);
    setFormOpen(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      notes: supplier.notes || '',
      categoryIds: supplier.categories.map((c) => c.categoryId),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingSupplier(null);
    setForm(emptySupplierForm);
  };

  const toggleCategory = (id: string) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data: form });
    } else {
      createSupplierMutation.mutate(form);
    }
  };

  const openRestockFromAlert = (alert: ReorderAlert) => {
    const supplierId = alert.suppliers[0]?.id || '';
    setRestockSupplierId(supplierId);
    const suggested = Math.max(alert.reorderPoint * 2 - alert.currentStock, alert.reorderPoint);
    setRestockLines([{ variantId: alert.variantId, quantity: suggested }]);
    setRestockNotes(alert.productName);
    setRestockFormOpen(true);
    setTab('pedidos');
  };

  const closeRestockForm = () => {
    setRestockFormOpen(false);
    setRestockSupplierId('');
    setRestockNotes('');
    setRestockLines([]);
  };

  const addRestockLine = () => {
    setRestockLines((lines) => [...lines, { variantId: '', quantity: 1 }]);
  };

  const updateRestockLine = (index: number, patch: Partial<RestockLine>) => {
    setRestockLines((lines) => lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeRestockLine = (index: number) => {
    setRestockLines((lines) => lines.filter((_, i) => i !== index));
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = restockLines.filter((l) => l.variantId && l.quantity > 0);
    if (!restockSupplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (validLines.length === 0) {
      toast.error('Añade al menos un artículo con cantidad válida');
      return;
    }
    createRestockMutation.mutate({ supplierId: restockSupplierId, notes: restockNotes || undefined, items: validLines });
  };

  const variantLabel = (variantId: string) => {
    const v = allVariants.find((x) => x.id === variantId);
    return v ? `${v.productName} · Talla ${v.size} · ${v.color} (stock ${v.stock})` : '';
  };

  const markReceived = (order: RestockOrder) => {
    if (order.status === 'PENDING' && !window.confirm('Marcar como recibido incrementará el stock automáticamente. ¿Continuar?')) return;
    updateStatusMutation.mutate({ id: order.id, status: 'RECEIVED' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
              {t.id === 'alertas' && (alerts?.length || 0) > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                  {alerts?.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'proveedores' && (
          <button onClick={openNewForm} className="btn btn-primary">
            + Nuevo proveedor
          </button>
        )}
        {tab === 'pedidos' && (
          <button
            onClick={() => { setRestockFormOpen(true); setTab('pedidos'); }}
            className="btn btn-primary"
          >
            + Nuevo pedido
          </button>
        )}
      </div>

      {formOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Persona de contacto</label>
                <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Dirección</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Categorías que suministra (¿qué ropa te vende?)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {categories?.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-700 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {cat.name}
                  </label>
                ))}
                {categories?.length === 0 && (
                  <p className="text-sm text-gray-500">Crea categorías en "Categorías" para asignarlas a proveedores.</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Notas</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={closeForm} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending} className="btn btn-primary">
                {createSupplierMutation.isPending || updateSupplierMutation.isPending ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Registrar proveedor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'proveedores' && (
        suppliersLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-48" />
                <div className="flex-1" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3">Proveedor</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3">Categorías</th>
                    <th className="px-6 py-3 text-center">Pedidos</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No hay proveedores registrados. Regístrate uno con sus categorías para saber a quién pedir cuando el stock baje.
                      </td>
                    </tr>
                  )}
                  {suppliers?.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-xs text-gray-500">{supplier.city || supplier.address || supplier.country}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{supplier.contactName || '—'}</p>
                        <p className="text-xs text-gray-500">{supplier.email || supplier.phone || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {supplier.categories.length === 0 && <span className="text-xs text-gray-400">Sin asignar</span>}
                          {supplier.categories.map((c) => (
                            <span key={c.id} className="inline-flex px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                              {c.category.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{supplier._count?.restockOrders || 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openEditForm(supplier)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Editar</button>
                          <button onClick={() => setDeleteId(supplier.id)} className="text-sm text-red-600 hover:text-red-700 font-medium">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {tab === 'alertas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900">Stock bajo</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cuando una variante esté por debajo de su punto de pedido, aquí verás a qué proveedor pedir según la categoría que suministra.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Variante</th>
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Proveedor recomendado</th>
                    <th className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alerts?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Sin alertas: todo el stock está por encima de su punto de pedido.
                      </td>
                    </tr>
                  )}
                  {alerts?.map((alert) => (
                    <tr key={alert.variantId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{alert.productName}</p>
                        <p className="text-xs text-gray-500">{alert.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">Talla {alert.size} · {alert.color}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          {alert.currentStock} / {alert.reorderPoint}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{alert.categoryName}</td>
                      <td className="px-6 py-4">
                        {alert.suppliers.length === 0 ? (
                          <span className="text-xs text-gray-400">
                            Sin proveedor para esta categoría — regístralo en "Proveedores".
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {alert.suppliers.map((s) => (
                              <div key={s.id}>
                                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-500">{s.email || s.phone || ''}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openRestockFromAlert(alert)}
                          disabled={!alert.suppliers.length}
                          className="btn btn-primary text-xs py-1.5"
                        >
                          Crear pedido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'pedidos' && (
        <div className="space-y-6">
          {restockFormOpen && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo pedido de reposición</h2>
              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Proveedor *</label>
                    <select
                      value={restockSupplierId}
                      onChange={(e) => setRestockSupplierId(e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">Selecciona un proveedor</option>
                      {suppliers?.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Notas</label>
                    <input value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)} className="input" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Artículos a pedir</label>
                    <button type="button" onClick={addRestockLine} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      + Añadir artículo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {restockLines.map((line, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-2 items-center">
                        <select
                          value={line.variantId}
                          onChange={(e) => updateRestockLine(index, { variantId: e.target.value })}
                          className="input"
                        >
                          <option value="">Selecciona variante</option>
                          {allVariants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {variantLabel(v.id)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity || ''}
                          placeholder="Cantidad"
                          onChange={(e) => updateRestockLine(index, { quantity: Math.max(1, Number(e.target.value) || 0) })}
                          className="input"
                        />
                        <button type="button" onClick={() => removeRestockLine(index)} className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Quitar
                        </button>
                      </div>
                    ))}
                    {restockLines.length === 0 && (
                      <p className="text-sm text-gray-400">Añade artículos al pedido.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closeRestockForm} className="btn btn-secondary">Cancelar</button>
                  <button type="submit" disabled={createRestockMutation.isPending} className="btn btn-primary">
                    {createRestockMutation.isPending ? 'Creando...' : 'Crear pedido de reposición'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {ordersLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="flex-1" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {restockOrders?.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
                  Aún no hay pedidos de reposición. Créalos desde las alertas de stock bajo.
                </div>
              )}
              {restockOrders?.map((order) => (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {order.supplier?.name} · {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${restockStatusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {restockStatusLabels[order.status] || order.status}
                      </span>
                      {(order.status === 'PENDING' || order.status === 'ORDERED') && (
                        <button onClick={() => markReceived(order)} disabled={updateStatusMutation.isPending} className="btn btn-outline text-xs py-1.5 text-green-600 border-green-200 hover:bg-green-50">
                          Marcar recibido
                        </button>
                      )}
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'CANCELLED' })}
                          disabled={updateStatusMutation.isPending}
                          className="btn btn-outline text-xs py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-3 text-sm text-gray-700">
                              {item.variant?.product?.name || 'Producto'}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-500">
                              {item.variant ? `Talla ${item.variant.size} · ${item.variant.color}` : ''}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">x {item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {order.notes && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                      {order.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar proveedor</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro? Solo se puede eliminar si no tiene pedidos de reposición.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn btn-secondary">Cancelar</button>
              <button onClick={() => deleteSupplierMutation.mutate(deleteId)} disabled={deleteSupplierMutation.isPending} className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                {deleteSupplierMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}