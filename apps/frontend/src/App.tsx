import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Profile } from './pages/account/Profile';
import { Orders } from './pages/account/Orders';
import { OrderDetail } from './pages/account/OrderDetail';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { ProductsAdmin } from './pages/admin/ProductsAdmin';
import { ProductForm } from './pages/admin/ProductForm';
import { StockManager } from './pages/admin/StockManager';
import { OrdersAdmin } from './pages/admin/OrdersAdmin';
import { OrderDetailAdmin } from './pages/admin/OrderDetailAdmin';
import { CategoriesAdmin } from './pages/admin/CategoriesAdmin';
import { UsersAdmin } from './pages/admin/UsersAdmin';
import { SuppliersAdmin } from './pages/admin/SuppliersAdmin';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/productos/:slug" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route
            path="/cuenta/*"
            element={
              <ProtectedRoute>
                <Routes>
                  <Route path="perfil" element={<Profile />} />
                  <Route path="pedidos" element={<Orders />} />
                  <Route path="pedidos/:id" element={<OrderDetail />} />
                  <Route path="*" element={<Navigate to="/cuenta/perfil" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={
            <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<ProductsAdmin />} />
            <Route path="productos/nuevo" element={<ProductForm />} />
            <Route path="productos/:id/editar" element={<ProductForm />} />
            <Route path="stock" element={<StockManager />} />
            <Route path="pedidos" element={<OrdersAdmin />} />
            <Route path="pedidos/:id" element={<OrderDetailAdmin />} />
            <Route path="categorias" element={<CategoriesAdmin />} />
            <Route path="proveedores" element={<SuppliersAdmin />} />
            <Route path="usuarios" element={<UsersAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;