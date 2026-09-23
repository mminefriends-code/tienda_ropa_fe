import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import { cutoutImage, type CutoutProgress } from '../../services/backgroundRemoval';
import toast from 'react-hot-toast';
import type { ArModel, ProductVariant } from '../../types';

interface ArModelManagerProps {
  productId: string;
  variants: ProductVariant[];
}

interface EditableArModel {
  id?: string;
  name: string;
  variantId: string;
  overlayImage: string;
  overlayScale: number;
  overlayOffsetY: number;
  isActive: boolean;
}

const emptyModel = (): EditableArModel => ({
  name: '',
  variantId: '',
  overlayImage: '',
  overlayScale: 1,
  overlayOffsetY: 0,
  isActive: true,
});

const getErrorMessage = (error: any, fallback: string) => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  if (msg) return msg;
  return fallback;
};

const toEditable = (model: ArModel): EditableArModel => ({
  id: model.id,
  name: model.name,
  variantId: model.variantId || '',
  overlayImage: model.overlayImage || '',
  overlayScale: model.overlayScale ?? 1,
  overlayOffsetY: model.overlayOffsetY ?? 0,
  isActive: model.isActive !== false,
});

export function ArModelManager({ productId, variants }: ArModelManagerProps) {
  const queryClient = useQueryClient();
  const [models, setModels] = useState<EditableArModel[]>([]);
  const [processingIdx, setProcessingIdx] = useState<number | null>(null);
  const [cutoutProgress, setCutoutProgress] = useState<CutoutProgress | null>(null);

  const { isFetching } = useQuery({
    queryKey: ['admin-ar-models', productId],
    queryFn: async () => {
      const response = await adminApi.getArModels(productId);
      setModels(response.data.map(toEditable));
      return response.data;
    },
    enabled: !!productId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-ar-models', productId] });
    queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
  };

  const createModel = useMutation({
    mutationFn: (payload: any) => adminApi.createArModel(payload),
    onSuccess: () => {
      toast.success('Recorte AR creado');
      refresh();
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al crear el recorte AR')),
  });

  const updateModel = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateArModel(id, data),
    onSuccess: () => {
      toast.success('Recorte AR actualizado');
      refresh();
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al actualizar el recorte AR')),
  });

  const deleteModel = useMutation({
    mutationFn: (id: string) => adminApi.deleteArModel(id),
    onSuccess: () => {
      toast.success('Recorte AR eliminado');
      refresh();
    },
    onError: (error: any) => toast.error(getErrorMessage(error, 'Error al eliminar el recorte AR')),
  });

  const addModel = () => {
    setModels([...models, emptyModel()]);
  };

  const updateRow = (index: number, patch: Partial<EditableArModel>) => {
    setModels((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const handleFile = (index: number, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateRow(index, { overlayImage: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIaFile = async (index: number, file?: File) => {
    if (!file) return;
    if (index < 0 || index >= models.length) {
      toast.error('Crea un modelo primero');
      return;
    }
    setProcessingIdx(index);
    setCutoutProgress({ stage: 'loading-model', percent: 0 });
    try {
      const result = await cutoutImage(file, setCutoutProgress);
      updateRow(index, { overlayImage: result, name: models[index].name || file.name.replace(/\.\w+$/, '') });
      toast.success('Fondo recortado con IA');
    } catch (err) {
      toast.error('No se pudo recortar la imagen con IA');
    } finally {
      setProcessingIdx(null);
      setCutoutProgress(null);
    }
  };

  const saveRow = async (index: number) => {
    const model = models[index];
    if (!model.name.trim()) {
      toast.error('Escribe un nombre para el recorte');
      return;
    }
    if (!model.overlayImage) {
      toast.error('Sube una imagen o usa el recorte con IA');
      return;
    }
    const payload = {
      productId,
      name: model.name.trim(),
      variantId: model.variantId || undefined,
      overlayImage: model.overlayImage,
      overlayScale: Number(model.overlayScale) || 1,
      overlayOffsetY: Number(model.overlayOffsetY) || 0,
      isActive: model.isActive,
    };
    try {
      if (model.id) {
        await updateModel.mutateAsync({ id: model.id, data: payload });
      } else {
        await createModel.mutateAsync(payload);
      }
    } catch {
      // El error ya se muestra via toast (onError de la mutación)
    }
  };

  const removeRow = (index: number) => {
    const model = models[index];
    if (!model) return;
    if (model.id && !window.confirm('¿Eliminar este recorte AR?')) return;
    if (model.id) deleteModel.mutate(model.id);
    setModels(models.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Prueba AR (recorte 2D)</h2>
          <p className="text-sm text-gray-500">
            Sube una imagen de la prenda — usa "Recortar con IA" para quitar el fondo automáticamente.
          </p>
        </div>
        <button type="button" onClick={addModel} className="btn btn-secondary text-sm">
          + Nuevo recorte
        </button>
      </div>

      {isFetching && models.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Cargando recortes...</p>
      )}

      {!isFetching && models.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          Sin recortes AR. Pulsa "+ Nuevo recorte" y usa el botón de IA para recortar automáticamente.
        </p>
      )}

      {processingIdx !== null && cutoutProgress && (
        <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm font-medium text-primary-800">
              {cutoutProgress.stage === 'loading-model' ? 'Descargando modelo de IA...' : 'Recortando imagen con IA...'}
            </span>
            <span className="text-xs text-primary-600">{cutoutProgress.percent}%</span>
          </div>
          <div className="w-full bg-primary-100 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${cutoutProgress.percent}%` }} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {models.map((model, index) => (
          <div key={model.id || `new-${index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div className="flex gap-4">
              <div
                className="w-24 h-28 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white"
                style={{
                  backgroundImage:
                    'repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%)',
                  backgroundSize: '16px 16px',
                }}
              >
                {model.overlayImage ? (
                  <img src={model.overlayImage} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-2">
                    Sin imagen
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                  <input
                    value={model.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    className="input text-sm py-2"
                    placeholder="Vestido Noche"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Aplica a variante (opcional)</label>
                  <select
                    value={model.variantId}
                    onChange={(e) => updateRow(index, { variantId: e.target.value })}
                    className="input text-sm py-2"
                  >
                    <option value="">Todas las variantes</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.color} / {v.size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Escala</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={model.overlayScale}
                  onChange={(e) => updateRow(index, { overlayScale: Number(e.target.value) })}
                  className="input text-sm py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Offset Y</label>
                <input
                  type="number"
                  step="0.05"
                  value={model.overlayOffsetY}
                  onChange={(e) => updateRow(index, { overlayOffsetY: Number(e.target.value) })}
                  className="input text-sm py-2"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={model.isActive}
                    onChange={(e) => updateRow(index, { isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <label className="btn btn-secondary text-sm flex-1 cursor-pointer">
                {model.overlayImage ? 'Cambiar imagen' : 'Subir PNG'}
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleFile(index, e.target.files?.[0])}
                />
              </label>
              <label className={`btn text-sm flex-1 cursor-pointer flex items-center justify-center gap-1 ${
                model.overlayImage ? 'btn-outline text-gray-600' : 'btn-primary'
              } ${processingIdx === index ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {model.overlayImage ? 'Re-recortar IA' : 'Recortar con IA'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={processingIdx === index}
                  onChange={(e) => {
                    handleIaFile(index, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              <button type="button" onClick={() => saveRow(index)} className="btn btn-primary text-sm">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                aria-label="Eliminar recorte"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
