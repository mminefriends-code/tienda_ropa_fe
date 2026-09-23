import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import toast from 'react-hot-toast';
import type { Category } from '../../types';

export function CategoriesAdmin() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories(true).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Categoría creada');
      resetForm();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al crear categoría'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description?: string }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Categoría actualizada');
      resetForm();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Error al actualizar categoría'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Categoría eliminada');
      setDeleteId(null);
    },
    onError: () => toast.error('Error al eliminar categoría'),
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, name, description: description || undefined });
    } else {
      createMutation.mutate({ name, description: description || undefined });
    }
  };

  const generateSlug = (text: string) => {
    setSlug(text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="btn btn-primary">
          + Nueva categoría
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="label">Nombre</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editingId) generateSlug(e.target.value); }}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Slug</label>
              <input
                value={slug}
                readOnly
                className="input bg-gray-50"
                title="Se genera automáticamente a partir del nombre"
              />
            </div>
            <div>
              <label className="label">Descripción (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary">
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(4)].map((_, i) => (
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
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Productos</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{cat.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cat._count?.products || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => startEdit(cat)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Editar
                        </button>
                        <button onClick={() => setDeleteId(cat.id)} className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar categoría</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro? Los productos de esta categoría quedarán sin categoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn btn-secondary">Cancelar</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 btn bg-red-600 text-white hover:bg-red-700">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
