import { PrismaClient, Role, AddressType, ArFormat } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.arSession.deleteMany();
  await prisma.arModel.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.bodyMeasurement.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const customerPassword = await bcrypt.hash('Cliente123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@tiendaropa.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'maria@ejemplo.com',
      password: customerPassword,
      firstName: 'María',
      lastName: 'González',
      phone: '+34 612 345 678',
      role: Role.CUSTOMER,
      isActive: true,
      emailVerified: true,
      addresses: {
        create: {
          type: AddressType.HOME,
          firstName: 'María',
          lastName: 'González',
          phone: '+34 612 345 678',
          street: 'Gran Vía 42, 3º B',
          city: 'Madrid',
          state: 'Madrid',
          postalCode: '28013',
          country: 'ES',
          isDefault: true,
        },
      },
      measurements: {
        create: {
          height: 168.0,
          weight: 58.5,
          bust: 88.0,
          waist: 68.0,
          hips: 94.0,
          shoulder: 39.0,
          sleeve: 59.0,
          inseam: 76.0,
          neck: 33.0,
        },
      },
    },
  });

  console.log(`👤 Users created: ${admin.email}, ${customer.email}`);

  // Create Categories
  const catVestidos = await prisma.category.create({
    data: {
      name: 'Vestidos',
      slug: 'vestidos',
      description: 'Vestidos elegantes, casuales y de fiesta para cada ocasión',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
    },
  });

  const catTops = await prisma.category.create({
    data: {
      name: 'Tops & Blusas',
      slug: 'tops-y-blusas',
      description: 'Blusas sofisticadas, camisas de lino y tops modernos',
      image: 'https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&q=80',
    },
  });

  const catPantalones = await prisma.category.create({
    data: {
      name: 'Pantalones & Faldas',
      slug: 'pantalones-y-faldas',
      description: 'Jeans de tiro alto, faldas midi y pantalones de vestir',
      image: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80',
    },
  });

  const catChaquetas = await prisma.category.create({
    data: {
      name: 'Chaquetas & Abrigos',
      slug: 'chaquetas-y-abrigos',
      description: 'Blazers oversize, gabardinas clásicas y chaquetas acolchadas',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80',
    },
  });

  console.log('📂 Categories created');

  // Create Products
  // 1. Vestido Midi Floral
  await prisma.product.create({
    data: {
      name: 'Vestido Midi Seda Floral',
      slug: 'vestido-midi-seda-floral',
      description: 'Exclusivo vestido midi de corte envolvente confeccionado en satén suave con estampado botánico en tonos pastel. Cuello en V elegante, mangas fluidas 3/4 y lazo ajustable a la cintura para realzar la silueta femenina.',
      basePrice: 79.99,
      compareAtPrice: 99.99,
      sku: 'VES-FLOR-001',
      isActive: true,
      isFeatured: true,
      categoryId: catVestidos.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
            alt: 'Vestido Midi Seda Floral frente',
            position: 1,
            isMain: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
            alt: 'Vestido detalle tela',
            position: 2,
            isMain: false,
          },
        ],
      },
      variants: {
        create: [
          { size: 'S', color: 'Verde Salvia', colorHex: '#8DA399', sku: 'VES-FLOR-S-SAL', price: 79.99, compareAtPrice: 99.99, stock: 12, isActive: true },
          { size: 'M', color: 'Verde Salvia', colorHex: '#8DA399', sku: 'VES-FLOR-M-SAL', price: 79.99, compareAtPrice: 99.99, stock: 15, isActive: true },
          { size: 'L', color: 'Verde Salvia', colorHex: '#8DA399', sku: 'VES-FLOR-L-SAL', price: 79.99, compareAtPrice: 99.99, stock: 8, isActive: true },
          { size: 'S', color: 'Rosa Empolvado', colorHex: '#D4A5A5', sku: 'VES-FLOR-S-ROS', price: 79.99, compareAtPrice: 99.99, stock: 10, isActive: true },
          { size: 'M', color: 'Rosa Empolvado', colorHex: '#D4A5A5', sku: 'VES-FLOR-M-ROS', price: 79.99, compareAtPrice: 99.99, stock: 6, isActive: true },
        ],
      },
      arModels: {
        create: [
          {
            name: 'Vestido 3D Try-On',
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenCloth/glTF-Binary/SheenCloth.glb',
            thumbnailUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80',
            overlayImage: '/overlays/vestido-floral.svg',
            overlayScale: 1.15,
            overlayOffsetY: -0.05,
            format: ArFormat.GLB,
            scale: 1.0,
            isActive: true,
          },
        ],
      },
    },
  });

  // 2. Blazer Oversize
  await prisma.product.create({
    data: {
      name: 'Blazer Sastre Estructurado',
      slug: 'blazer-sastre-estructurado',
      description: 'Blazer contemporáneo de inspiración masculina con solapas de muesca y hombreras sutiles. Cierre frontal con botones de carey, bolsillos con solapa y forro interior satinado. Perfecto para outfits de oficina o looks casuales.',
      basePrice: 89.95,
      compareAtPrice: 119.00,
      sku: 'BLA-SAST-002',
      isActive: true,
      isFeatured: true,
      categoryId: catChaquetas.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
            alt: 'Blazer sastre camel',
            position: 1,
            isMain: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80',
            alt: 'Blazer detalle',
            position: 2,
            isMain: false,
          },
        ],
      },
      variants: {
        create: [
          { size: 'S', color: 'Camel', colorHex: '#C19A6B', sku: 'BLA-SAST-S-CAM', price: 89.95, compareAtPrice: 119.00, stock: 10, isActive: true },
          { size: 'M', color: 'Camel', colorHex: '#C19A6B', sku: 'BLA-SAST-M-CAM', price: 89.95, compareAtPrice: 119.00, stock: 14, isActive: true },
          { size: 'L', color: 'Camel', colorHex: '#C19A6B', sku: 'BLA-SAST-L-CAM', price: 89.95, compareAtPrice: 119.00, stock: 5, isActive: true },
          { size: 'S', color: 'Negro Azabache', colorHex: '#1A1A1A', sku: 'BLA-SAST-S-NEG', price: 89.95, compareAtPrice: 119.00, stock: 20, isActive: true },
          { size: 'M', color: 'Negro Azabache', colorHex: '#1A1A1A', sku: 'BLA-SAST-M-NEG', price: 89.95, compareAtPrice: 119.00, stock: 18, isActive: true },
        ],
      },
      arModels: {
        create: [
          {
            name: 'Blazer 3D Try-On',
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenCloth/glTF-Binary/SheenCloth.glb',
            thumbnailUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80',
            overlayImage: '/overlays/blazer-camel.svg',
            overlayScale: 1.18,
            overlayOffsetY: 0.0,
            format: ArFormat.GLB,
            scale: 1.0,
            isActive: true,
          },
        ],
      },
    },
  });

  // 3. Blusa de Lino
  await prisma.product.create({
    data: {
      name: 'Blusa Fluida 100% Lino Orgánico',
      slug: 'blusa-fluida-lino-organico',
      description: 'Prenda ligera y transpirable confeccionada en lino europeo premium. Escote barco suave, corte recto relajado y botones de nácar en la espalda. Frescura natural y elegancia minimalista.',
      basePrice: 45.00,
      compareAtPrice: 55.00,
      sku: 'BLU-LINO-003',
      isActive: true,
      isFeatured: true,
      categoryId: catTops.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=800&q=80',
            alt: 'Blusa de lino blanca',
            position: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          { size: 'XS', color: 'Blanco Crudo', colorHex: '#FDFBF7', sku: 'BLU-LINO-XS-BLA', price: 45.00, compareAtPrice: 55.00, stock: 7, isActive: true },
          { size: 'S', color: 'Blanco Crudo', colorHex: '#FDFBF7', sku: 'BLU-LINO-S-BLA', price: 45.00, compareAtPrice: 55.00, stock: 15, isActive: true },
          { size: 'M', color: 'Blanco Crudo', colorHex: '#FDFBF7', sku: 'BLU-LINO-M-BLA', price: 45.00, compareAtPrice: 55.00, stock: 12, isActive: true },
          { size: 'M', color: 'Azul Celeste', colorHex: '#A2C4D9', sku: 'BLU-LINO-M-AZU', price: 45.00, compareAtPrice: 55.00, stock: 9, isActive: true },
        ],
      },
      arModels: {
        create: [
          {
            name: 'Blusa Lino AR',
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenCloth/glTF-Binary/SheenCloth.glb',
            thumbnailUrl: 'https://images.unsplash.com/photo-1564257631407-4deb129f042b?w=400&q=80',
            overlayImage: '/overlays/blusa-lino.svg',
            overlayScale: 1.12,
            overlayOffsetY: -0.02,
            format: ArFormat.GLB,
            scale: 1.0,
            isActive: true,
          },
        ],
      },
    },
  });

  // 4. Pantalón Palazzo
  await prisma.product.create({
    data: {
      name: 'Pantalón Palazzo Tiro Alto',
      slug: 'pantalon-palazzo-tiro-alto',
      description: 'Pantalón de pernera ancha con caída impecable. Cintura alta con trabillas finas, pinzas delanteras para mayor amplitud y bolsillos laterales invisibles. Tejido elástico y confortable.',
      basePrice: 59.90,
      sku: 'PAN-PAL-004',
      isActive: true,
      isFeatured: true,
      categoryId: catPantalones.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80',
            alt: 'Pantalón Palazzo beige',
            position: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          { size: '36', color: 'Beige Arena', colorHex: '#E1D3C1', sku: 'PAN-PAL-36-BEI', price: 59.90, stock: 10, isActive: true },
          { size: '38', color: 'Beige Arena', colorHex: '#E1D3C1', sku: 'PAN-PAL-38-BEI', price: 59.90, stock: 16, isActive: true },
          { size: '40', color: 'Beige Arena', colorHex: '#E1D3C1', sku: 'PAN-PAL-40-BEI', price: 59.90, stock: 11, isActive: true },
          { size: '38', color: 'Terracota', colorHex: '#B85D43', sku: 'PAN-PAL-38-TER', price: 59.90, stock: 8, isActive: true },
        ],
      },
      arModels: {
        create: [
          {
            name: 'Pantalón Palazzo AR',
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenCloth/glTF-Binary/SheenCloth.glb',
            thumbnailUrl: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400&q=80',
            overlayImage: '/overlays/pantalon-palazzo.svg',
            overlayScale: 1.15,
            overlayOffsetY: 0.45,
            format: ArFormat.GLB,
            scale: 1.0,
            isActive: true,
          },
        ],
      },
    },
  });

  // 5. Vestido de Noche Escote Espalda
  await prisma.product.create({
    data: {
      name: 'Vestido Largo Gala Escote Espalda',
      slug: 'vestido-largo-gala-escote-espalda',
      description: 'Deslumbrante vestido largo confeccionado en crepé fluido. Diseño ceñido que realza las curvas, apertura lateral pronunciada y espectacular escote cruzado en la espalda con tirantes ajustables.',
      basePrice: 129.00,
      compareAtPrice: 159.00,
      sku: 'VES-GALA-005',
      isActive: true,
      isFeatured: true,
      categoryId: catVestidos.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80',
            alt: 'Vestido largo noche rojo burdeos',
            position: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          { size: 'XS', color: 'Rojo Borgoña', colorHex: '#6B1D2F', sku: 'VES-GALA-XS-BOR', price: 129.00, compareAtPrice: 159.00, stock: 5, isActive: true },
          { size: 'S', color: 'Rojo Borgoña', colorHex: '#6B1D2F', sku: 'VES-GALA-S-BOR', price: 129.00, compareAtPrice: 159.00, stock: 8, isActive: true },
          { size: 'M', color: 'Rojo Borgoña', colorHex: '#6B1D2F', sku: 'VES-GALA-M-BOR', price: 129.00, compareAtPrice: 159.00, stock: 7, isActive: true },
          { size: 'S', color: 'Negro Satén', colorHex: '#141414', sku: 'VES-GALA-S-NEG', price: 129.00, compareAtPrice: 159.00, stock: 12, isActive: true },
        ],
      },
      arModels: {
        create: [
          {
            name: 'Vestido Noche 3D AR',
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenCloth/glTF-Binary/SheenCloth.glb',
            thumbnailUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&q=80',
            overlayImage: '/overlays/vestido-gala.svg',
            overlayScale: 1.15,
            overlayOffsetY: -0.05,
            format: ArFormat.GLB,
            scale: 1.0,
            isActive: true,
          },
        ],
      },
    },
  });

  // 6. Chaqueta Biker Cuero Vegano
  await prisma.product.create({
    data: {
      name: 'Cazadora Biker Cuero Vegano Premium',
      slug: 'cazadora-biker-cuero-vegano',
      description: 'Chaqueta biker con cremalleras asimétricas plateadas, cuello campero con botones a presión y cinturón con hebilla metálica. Textura suave idéntica al cuero con tratamiento hidrófugo.',
      basePrice: 95.00,
      sku: 'CHA-BIKE-006',
      isActive: true,
      isFeatured: true,
      categoryId: catChaquetas.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
            alt: 'Cazadora biker negra',
            position: 1,
            isMain: true,
          },
        ],
      },
      variants: {
        create: [
          { size: 'S', color: 'Negro', colorHex: '#1B1B1B', sku: 'CHA-BIKE-S-NEG', price: 95.00, stock: 14, isActive: true },
          { size: 'M', color: 'Negro', colorHex: '#1B1B1B', sku: 'CHA-BIKE-M-NEG', price: 95.00, stock: 18, isActive: true },
          { size: 'L', color: 'Negro', colorHex: '#1B1B1B', sku: 'CHA-BIKE-L-NEG', price: 95.00, stock: 9, isActive: true },
        ],
      },
      arModels: {
        create: [
          {
            name: 'Cazadora Biker AR',
            modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenCloth/glTF-Binary/SheenCloth.glb',
            thumbnailUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
            overlayImage: '/overlays/cazadora-biker.svg',
            overlayScale: 1.2,
            overlayOffsetY: 0.0,
            format: ArFormat.GLB,
            scale: 1.0,
            isActive: true,
          },
        ],
      },
    },
  });

  console.log('👗 Products and variants created successfully');
  console.log('✅ Database seeded complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
