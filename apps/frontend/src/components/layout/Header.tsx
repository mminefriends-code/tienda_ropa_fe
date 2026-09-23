import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

export function Header() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const cartCount = getTotalItems();

  const navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/productos', label: 'Productos' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <nav className="container-main" aria-label="Navegación principal">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-600" aria-label="ModaFem - Inicio">
            ModaFem
          </Link>

          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Panel Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/productos" className="text-sm font-medium text-gray-700 hover:text-primary-600 hidden sm:block">
              Novedades
            </Link>

            <Link to="/carrito" className="relative p-2 text-gray-700 hover:text-primary-600" aria-label={`Carrito: ${cartCount} artículos`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2v-5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9l14 0" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 text-gray-700 hover:text-primary-600" aria-expanded="false" aria-haspopup="true">
                  <span className="hidden sm:block font-medium">{user.firstName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/cuenta/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mi cuenta</Link>
                  <Link to="/cuenta/pedidos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mis pedidos</Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Cerrar sesión</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-secondary text-sm">Iniciar sesión</Link>
                <Link to="/registro" className="btn btn-primary text-sm">Registrarse</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}