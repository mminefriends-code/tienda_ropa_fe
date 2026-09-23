import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Atención al cliente': [
      { label: 'Contacto', href: '/contacto' },
      { label: 'Preguntas frecuentes', href: '/faq' },
      { label: 'Guía de tallas', href: '/guia-tallas' },
      { label: 'Devoluciones', href: '/devoluciones' },
    ],
    'Información': [
      { label: 'Sobre nosotros', href: '/nosotros' },
      { label: 'Términos y condiciones', href: '/terminos' },
      { label: 'Política de privacidad', href: '/privacidad' },
      { label: 'Envíos', href: '/envios' },
    ],
    'Mi cuenta': [
      { label: 'Mis pedidos', href: '/cuenta/pedidos' },
      { label: 'Mi perfil', href: '/cuenta/perfil' },
      { label: 'Lista de deseos', href: '/deseos' },
      { label: 'Direcciones', href: '/cuenta/direcciones' },
    ],
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-bold text-primary-600 mb-4 block">ModaFem</Link>
            <p className="text-gray-600 text-sm mb-4">
              Tu tienda de moda femenina online. Encuentra las últimas tendencias con la mejor calidad.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-.128-.128-.537-.197-4.947-.197z" /><path d="M8.5 12c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5-3.5-1.567-3.5-3.5zm0 7c-2.333 0-4.5-1.933-4.5-4.5s1.933-4.5 4.5-4.5 4.5 1.933 4.5 4.5-1.933 4.5-4.5 4.5zm7.5-7c0 1.409-.712 2.644-1.761 3.311l.006.048c.286.14.537.315.745.525.592.6.996 1.36 1.22 2.206.116.434.159.882.159 1.337 0 .873-.589 1.599-1.599 1.599-.267 0-.54-.041-.796-.123l-.031-.013c-.372-.145-.78-.33-1.22-.58-.82-.46-1.489-1.096-1.96-1.91-.182-.304-.32-.632-.42-.981l-.01-.037c-.113-.386-.2-.796-.2-1.22 0-.423.027-.834.08-1.22.039-.282.084-.563.133-.84.086-.473.21-.958.38-1.448.285-.822.724-1.622 1.32-2.389.428-.548.91-1.063 1.46-1.556.52-.47 1.098-.94 1.714-1.453.589-.489 1.227-1.02 1.925-1.627.678-.588 1.416-1.264 2.163-2.02.193-.196.382-.397.56-.603.177-.205.35-.417.513-.63.175-.215.355-.434.53-.653.17-.21.345-.422.515-.635.148-.186.29-.37.425-.552.12-.16.234-.317.338-.468.09-.126.175-.246.247-.36.076-.117.147-.226.207-.325.06-.098.11-.185.14-.264.03-.07.05-.135.06-.19.01-.05.02-.09.02-.12 0-.04 0-.08 0-.11 0-.03 0-.06 0-.09 0 0 0 0 0 0v0z" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-600" aria-label="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} ModaFem. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>España</span>
              <span>USD $</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}