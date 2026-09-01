const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Eco POS Database Seeding...');

  // 1. Create Main Branch
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'BR-COLOMBO-01' },
    update: {},
    create: {
      name: 'EcoLife Colombo Main Branch',
      code: 'BR-COLOMBO-01',
      address: '123 Green Street, Colombo 03, Sri Lanka',
      phone: '+94 11 234 5678',
      isMain: true,
    },
  });

  console.log(`✅ Branch Created: ${mainBranch.name}`);

  // 2. Create Default Users (Admin, Manager, Cashier)
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashManager = await bcrypt.hash('Manager@123', 10);
  const passwordHashCashier = await bcrypt.hash('Cashier@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecopos.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ecopos.com',
      passwordHash: passwordHashAdmin,
      name: 'System Admin',
      role: 'ADMIN',
      branchId: mainBranch.id,
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@ecopos.com' },
    update: {},
    create: {
      username: 'manager',
      email: 'manager@ecopos.com',
      passwordHash: passwordHashManager,
      name: 'Sarah De Silva (Manager)',
      role: 'MANAGER',
      branchId: mainBranch.id,
      status: 'ACTIVE',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@ecopos.com' },
    update: {},
    create: {
      username: 'cashier',
      email: 'cashier@ecopos.com',
      passwordHash: passwordHashCashier,
      name: 'Kamal Fernando (Cashier)',
      role: 'CASHIER',
      branchId: mainBranch.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Default Users Created: Admin, Manager, Cashier');

  // 3. Create Categories
  const categoriesData = [
    { name: 'Bamboo & Wooden Goods', description: 'Sustainable bamboo cutlery, toothbrushes & wooden wares' },
    { name: 'Plastic-Free Personal Care', description: 'Zero-waste shampoos, soaps & natural skincare' },
    { name: 'Reusable Containers & Bottles', description: 'Stainless steel bottles, glass jars & lunchboxes' },
    { name: 'Organic Bulk Pantry', description: 'Grains, nuts, seeds & superfoods packaged plastic-free' },
    { name: 'Eco Household & Cleaning', description: 'Plant-based detergent sheets, sponges & loofahs' },
  ];

  const categoriesMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoriesMap[cat.name] = created.id;
  }

  console.log('✅ Categories Created');

  // 4. Create Products
  const productsData = [
    {
      name: 'Bamboo Toothbrush Set (4 Pack)',
      sku: 'ECO-001',
      barcode: '89010001',
      categoryName: 'Bamboo & Wooden Goods',
      costPrice: 450.0,
      sellingPrice: 850.0,
      taxRate: 8.0,
      stockQuantity: 45,
      minStockThreshold: 10,
      unit: 'pack',
      imageUrl: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Stainless Steel Flask (750ml)',
      sku: 'ECO-002',
      barcode: '89010002',
      categoryName: 'Reusable Containers & Bottles',
      costPrice: 1800.0,
      sellingPrice: 3200.0,
      taxRate: 8.0,
      stockQuantity: 24,
      minStockThreshold: 5,
      unit: 'pcs',
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Organic Cotton Produce Bag (Set of 3)',
      sku: 'ECO-003',
      barcode: '89010003',
      categoryName: 'Bamboo & Wooden Goods',
      costPrice: 600.0,
      sellingPrice: 1100.0,
      taxRate: 8.0,
      stockQuantity: 30,
      minStockThreshold: 8,
      unit: 'set',
      imageUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Solid Shampoo Bar - Lavender',
      sku: 'ECO-004',
      barcode: '89010004',
      categoryName: 'Plastic-Free Personal Care',
      costPrice: 700.0,
      sellingPrice: 1450.0,
      taxRate: 8.0,
      stockQuantity: 4, // Low stock on purpose for testing!
      minStockThreshold: 10,
      unit: 'pcs',
      imageUrl: 'https://images.unsplash.com/photo-1607006482140-52d3d9501c65?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Beeswax Food Wraps (3 Sizes)',
      sku: 'ECO-005',
      barcode: '89010005',
      categoryName: 'Reusable Containers & Bottles',
      costPrice: 1200.0,
      sellingPrice: 2200.0,
      taxRate: 8.0,
      stockQuantity: 18,
      minStockThreshold: 5,
      unit: 'set',
      imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Eco Laundry Detergent Sheets (60 Sheets)',
      sku: 'ECO-006',
      barcode: '89010006',
      categoryName: 'Eco Household & Cleaning',
      costPrice: 1500.0,
      sellingPrice: 2600.0,
      taxRate: 8.0,
      stockQuantity: 12,
      minStockThreshold: 5,
      unit: 'box',
      imageUrl: 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Bulk Organic Whole Rolled Oats (1kg)',
      sku: 'ECO-007',
      barcode: '89010007',
      categoryName: 'Organic Bulk Pantry',
      costPrice: 650.0,
      sellingPrice: 1150.0,
      taxRate: 0.0, // Tax free food item
      stockQuantity: 60,
      minStockThreshold: 15,
      unit: 'kg',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Coconut Shell Bowl & Spoon Set',
      sku: 'ECO-008',
      barcode: '89010008',
      categoryName: 'Bamboo & Wooden Goods',
      costPrice: 550.0,
      sellingPrice: 990.0,
      taxRate: 8.0,
      stockQuantity: 25,
      minStockThreshold: 5,
      unit: 'set',
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Glass Storage Jar with Bamboo Lid (1.5L)',
      sku: 'ECO-009',
      barcode: '89010009',
      categoryName: 'Reusable Containers & Bottles',
      costPrice: 900.0,
      sellingPrice: 1650.0,
      taxRate: 8.0,
      stockQuantity: 3, // Low stock alert test
      minStockThreshold: 8,
      unit: 'pcs',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Natural Loofah Exfoliating Sponge',
      sku: 'ECO-010',
      barcode: '89010010',
      categoryName: 'Eco Household & Cleaning',
      costPrice: 200.0,
      sellingPrice: 450.0,
      taxRate: 8.0,
      stockQuantity: 50,
      minStockThreshold: 10,
      unit: 'pcs',
      imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80',
    },
  ];

  for (const prod of productsData) {
    const { categoryName, ...productFields } = prod;
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: {
        ...productFields,
        categoryId: categoriesMap[categoryName],
      },
    });
  }

  console.log('✅ Products Created');

  // 5. Create Customers
  await prisma.customer.upsert({
    where: { phone: '0000000000' },
    update: {},
    create: {
      name: 'Walk-in Customer',
      phone: '0000000000',
      email: 'walkin@ecopos.com',
      loyaltyPoints: 0,
      totalSpent: 0.0,
    },
  });

  await prisma.customer.upsert({
    where: { phone: '0771234567' },
    update: {},
    create: {
      name: 'Kusal Perera',
      phone: '0771234567',
      email: 'kusal@example.com',
      address: '45 Havelock Road, Colombo 05',
      loyaltyPoints: 150,
      totalSpent: 15000.0,
    },
  });

  await prisma.customer.upsert({
    where: { phone: '0719876543' },
    update: {},
    create: {
      name: 'Nimesha Silva',
      phone: '0719876543',
      email: 'nimesha@example.com',
      address: '12 Kandy Road, Kiribathgoda',
      loyaltyPoints: 85,
      totalSpent: 8500.0,
    },
  });

  console.log('✅ Sample Customers Created');

  // 6. Create Suppliers
  await prisma.supplier.createMany({
    data: [
      {
        name: 'Ceylon Eco Goods Ltd',
        contactPerson: 'Dinesh Wickramasinghe',
        phone: '+94 11 456 7890',
        email: 'supply@ceylonecogoods.lk',
        address: '88 Industrial Zone, Kaduwela',
      },
      {
        name: 'GreenEarth Products Global',
        contactPerson: 'Anusha Ranasinghe',
        phone: '+94 33 221 4455',
        email: 'info@greenearth.lk',
        address: '14 Commerce Ave, Gampaha',
      },
    ],
  });

  console.log('✅ Suppliers Created');

  // 7. Create Expense Categories
  const expenseCats = ['Rent & Lease', 'Electricity & Water', 'Eco Packaging & Paper', 'Staff Salaries', 'Transport & Delivery'];
  for (const catName of expenseCats) {
    await prisma.expenseCategory.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
  }

  console.log('✅ Expense Categories Created');

  // 8. Create Default Shop Settings
  const existingSettings = await prisma.shopSettings.findFirst();
  if (!existingSettings) {
    await prisma.shopSettings.create({
      data: {
        shopName: 'EcoLife Plastic-Free Market',
        tagline: 'Sustainable & Eco-Friendly Goods',
        address: '123 Green Street, Colombo 03, Sri Lanka',
        phone: '+94 11 234 5678',
        email: 'contact@ecolifemarket.lk',
        taxNumber: 'VAT-987654321',
        currencySymbol: 'Rs.',
        currencyCode: 'LKR',
        receiptFooterText: 'Thank you for shopping green! Every step counts.',
        defaultTaxRate: 8.0,
        enableLoyalty: true,
      },
    });
  }

  console.log('✅ Default Shop Settings Configured');
  console.log('🎉 Seeding Complete Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
