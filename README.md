# Tienda Ropa - Monorepo

Tienda de moda femenina online con funcionalidad de prueba virtual (AR Try-On).

## Stack Tecnológico

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend Web**: React + Vite + TailwindCSS + TanStack Query
- **Mobile**: React Native (pendiente)
- **Base de datos**: PostgreSQL
- **Despliegue**: Azure (pendiente)

## Características Principales

- 🛍️ Catálogo completo: productos, variantes (talla/color), categorías jerárquicas
- 👗 **AR Try-On**: Prueba virtual con cámara del dispositivo (WebXR)
- 👤 Autenticación JWT con refresh tokens
- 🛒 Carrito persistente + Checkout completo
- 📦 Gestión de pedidos y pagos
- 📏 Medidas corporales para recomendaciones de talla
- 🎨 Diseño responsive con TailwindCSS

## Estructura del Proyecto

```
tienda_ropa_fe/
├── apps/
│   ├── backend/          # NestJS API
│   ├── frontend/         # React Web App
│   └── mobile/           # React Native (pendiente)
├── packages/
│   └── shared/           # Tipos y utilidades compartidas
├── docker-compose.yml
└── README.md
```

## Inicio Rápido

### Prerrequisitos

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (si no usas Docker)

### Con Docker (Recomendado)

```bash
# Clonar e iniciar servicios
docker-compose up -d

# El backend estará en http://localhost:3000
# Swagger docs en http://localhost:3000/api/docs
# Frontend en http://localhost:5173
```

### Desarrollo Local (Sin Docker)

#### Backend

```bash
cd apps/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Generar cliente Prisma y crear BD
npm run db:generate
npm run db:push

# Iniciar en modo desarrollo
npm run start:dev
```

#### Frontend

```bash
cd apps/frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Scripts Disponibles

### Root (Monorepo)

```bash
npm run dev:backend    # Inicia backend en modo dev
npm run dev:frontend   # Inicia frontend en modo dev
npm run build:all      # Build de todos los workspaces
npm run db:generate    # Genera Prisma Client
npm run db:push        # Sincroniza schema con BD
npm run db:studio      # Abre Prisma Studio
```

### Backend

```bash
npm run start:dev      # Modo desarrollo con watch
npm run build          # Compila para producción
npm run start:prod     # Inicia versión compilada
npm run lint           # ESLint
npm run test           # Tests
npm run db:studio      # Prisma Studio (GUI para BD)
```

### Frontend

```bash
npm run dev            # Servidor dev Vite
npm run build          # Build producción
npm run preview        # Preview build
npm run lint           # ESLint
```

## Modelo de Datos Principal

- **User**: Clientes y admins
- **Category**: Categorías jerárquicas (ej: Ropa > Vestidos > Verano)
- **Product**: Productos base con variantes
- **ProductVariant**: Talla + Color + Stock + Precio
- **ArModel**: Modelos 3D para AR (GLTF/GLB/USDZ)
- **ArSession**: Sesiones de prueba AR del usuario
- **Order**: Pedidos con items, pagos, direcciones
- **BodyMeasurement**: Medidas corporales del usuario

## AR Try-On (Realidad Aumentada)

La funcionalidad diferenciadora del proyecto:

1. **Backend**: Almacena modelos 3D (GLTF/GLB/USDZ) por producto/variante
2. **Frontend**: Usa `navigator.mediaDevices.getUserMedia()` para cámara
3. **WebXR**: Renderiza modelo 3D superpuesto al video de la cámara
4. **Tracking**: Guarda duración, capturas, rating y feedback

### Formatos Soportados

- **GLB/GLTF**: Web estándar, recomendado
- **USDZ**: iOS Safari nativo
- **OBJ**: Básico (sin animaciones)

### Integración Modelo 3D

```bash
# Subir modelo via API (admin)
POST /api/ar/models
{
  "productId": "uuid",
  "variantId": "uuid",  // opcional
  "name": "Vestido floral M",
  "modelUrl": "https://cdn.ejemplo.com/modelos/vestido-floral-m.glb",
  "format": "GLB",
  "scale": 1.0
}
```

## Despliegue en Azure (Pendiente)

### Backend
- Azure Container Apps o App Service
- Azure Database for PostgreSQL
- Azure Key Vault para secrets
- Application Insights para monitoring

### Frontend
- Azure Static Web Apps
- CDN para assets estáticos

### CI/CD
- GitHub Actions para build/test/deploy
- Staging y Production environments

## Desarrollo Futuro (2do Parcial - .NET)

- Migrar backend a ASP.NET Core
- Mantener mismo contrato de API
- Entity Framework Core en lugar de Prisma
- Blazor WebAssembly como alternativa frontend

## Licencia

MIT