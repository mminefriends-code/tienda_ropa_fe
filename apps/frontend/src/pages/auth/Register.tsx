import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  terms: boolean;
}

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: {
      terms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });
      toast.success('¡Cuenta creada correctamente!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-main py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary-600">ModaFem</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Crear cuenta</h1>
          <p className="text-gray-500 mt-2">Únete a ModaFem y disfruta de ventajas exclusivas</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input {...register('firstName', { required: true, minLength: 2 })} className="input" disabled={isLoading} />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">Mínimo 2 caracteres</p>}
            </div>
            <div>
              <label className="label">Apellidos *</label>
              <input {...register('lastName', { required: true, minLength: 2 })} className="input" disabled={isLoading} />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">Mínimo 2 caracteres</p>}
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
              className="input"
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">Email inválido</p>}
          </div>

          <div>
            <label className="label">Teléfono</label>
            <input type="tel" {...register('phone')} className="input" disabled={isLoading} />
          </div>

          <div>
            <label className="label">Contraseña *</label>
            <input
              type="password"
              {...register('password', {
                required: true,
                minLength: 8,
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              })}
              className="input"
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo</p>}
          </div>

          <div>
            <label className="label">Confirmar contraseña *</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: true,
                validate: (value) => value === password || 'Las contraseñas no coinciden',
              })}
              className="input"
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms', { required: true, value: true })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded mt-0.5"
              />
              <span className="text-sm text-gray-600">
                Acepto los <Link to="/terminos" className="text-primary-600 hover:underline">Términos y condiciones</Link> y la <Link to="/privacidad" className="text-primary-600 hover:underline">Política de privacidad</Link> *
              </span>
            </label>
            {errors.terms && <p className="text-red-500 text-sm mt-1">Debes aceptar los términos</p>}
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3">
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-center text-gray-500">
            ¿Ya tienes cuenta? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}