import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useUserMeasurements, useUpdateMeasurements } from '../../hooks/useQueries';
import toast from 'react-hot-toast';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
}

interface MeasurementForm {
  height?: number;
  weight?: number;
  bust?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  sleeve?: number;
  inseam?: number;
  neck?: number;
}

export function Profile() {
  const { user, update: updateUser } = useAuthStore();
  const { data: measurements } = useUserMeasurements();
  const updateMeasurements = useUpdateMeasurements();

  const [activeTab, setActiveTab] = useState<'profile' | 'measurements'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerMeasurement,
    handleSubmit: handleSubmitMeasurement,
  } = useForm<MeasurementForm>({
    values: measurements ? {
      height: measurements.height,
      weight: measurements.weight,
      bust: measurements.bust,
      waist: measurements.waist,
      hips: measurements.hips,
      shoulder: measurements.shoulder,
      sleeve: measurements.sleeve,
      inseam: measurements.inseam,
      neck: measurements.neck,
    } : undefined,
  });

  const onSubmitProfile = async (data: ProfileForm) => {
    setIsUpdating(true);
    try {
      await updateUser(data);
      toast.success('Perfil actualizado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  const onSubmitMeasurements = async (data: MeasurementForm) => {
    setIsUpdating(true);
    try {
      await updateMeasurements.mutateAsync(data);
      toast.success('Medidas actualizadas');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar medidas');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container-main py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi cuenta</h1>

        <div className="flex gap-8">
          <aside className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'profile' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('measurements')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'measurements' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Mis medidas
              </button>
              <a href="/cuenta/pedidos" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Mis pedidos
              </a>
              <a href="/deseos" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Lista de deseos
              </a>
              <a href="/cuenta/direcciones" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Direcciones
              </a>
            </nav>
          </aside>

          <div className="flex-1 bg-white rounded-xl border border-gray-100 p-6 lg:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Información personal</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Nombre *</label>
                    <input {...register('firstName', { required: true, minLength: 2 })} className="input" />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">Mínimo 2 caracteres</p>}
                  </div>
                  <div>
                    <label className="label">Apellidos *</label>
                    <input {...register('lastName', { required: true, minLength: 2 })} className="input" />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">Mínimo 2 caracteres</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={user?.email} readOnly className="input bg-gray-50" />
                  <p className="text-sm text-gray-500 mt-1">El email no se puede cambiar</p>
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input type="tel" {...register('phone')} className="input" />
                </div>
                <button type="submit" disabled={isUpdating} className="btn btn-primary">
                  {isUpdating ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            )}

            {activeTab === 'measurements' && (
              <form onSubmit={handleSubmitMeasurement(onSubmitMeasurements)} className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Mis medidas corporales</h2>
                <p className="text-gray-600">
                  Guarda tus medidas para recibir recomendaciones de talla personalizadas y usar el probador AR.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(
                    [
                      { key: 'height', label: 'Altura (cm)', placeholder: '165' },
                      { key: 'weight', label: 'Peso (kg)', placeholder: '60' },
                      { key: 'bust', label: 'Pecho (cm)', placeholder: '90' },
                      { key: 'waist', label: 'Cintura (cm)', placeholder: '70' },
                      { key: 'hips', label: 'Caderas (cm)', placeholder: '95' },
                      { key: 'shoulder', label: 'Hombros (cm)', placeholder: '38' },
                      { key: 'sleeve', label: 'Manga (cm)', placeholder: '60' },
                      { key: 'inseam', label: 'Entrepierna (cm)', placeholder: '75' },
                      { key: 'neck', label: 'Cuello (cm)', placeholder: '34' },
                    ] as const
                  ).map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={placeholder}
                        {...registerMeasurement(key, { valueAsNumber: true })}
                        className="input"
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={isUpdating} className="btn btn-primary">
                  {isUpdating ? 'Guardando...' : 'Guardar medidas'}
                </button>
                {measurements?.updatedAt && (
                  <p className="text-sm text-gray-500">
                    Última actualización: {new Date(measurements.updatedAt).toLocaleDateString('es-ES')}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}