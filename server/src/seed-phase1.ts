import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPhase1() {
  console.log('=== Phase 1.1 种子数据播种 ===\n');

  // 1. PLM Product
  const product = await prisma.plmProduct.upsert({
    where: { productCode: 'P-2026-0001' },
    update: {},
    create: {
      productCode: 'P-2026-0001',
      productName: 'YJ4820-0028 静音电机',
      category: '循环风扇电机',
      modelNo: 'YJ4820-0028',
      specifications: '电压220V/功率60W/转速1200rpm/扭矩0.5Nm',
      description: '循环风扇用交流静音电机',
      status: 'developing',
    },
  });
  console.log(`[PLM] Product: ${product.productCode} - ${product.productName}`);

  // 2. ERP Material
  const material = await prisma.erpMaterial.upsert({
    where: { materialCode: 'M-2026-0001' },
    update: {},
    create: {
      materialCode: 'M-2026-0001',
      materialName: '漆包线',
      category: '原材料',
      spec: '直径0.35mm',
      unit: 'kg',
      safetyStock: 50,
      stock: 100,
      price: 85.5,
    },
  });
  console.log(`[ERP] Material: ${material.materialCode} - ${material.materialName}`);

  // 3. PLM BOM
  const bom = await prisma.plmBom.upsert({
    where: { bomCode: 'BOM-2026-0001' },
    update: {},
    create: {
      bomCode: 'BOM-2026-0001',
      productId: product.id,
      materialId: material.id,
      quantity: 2.5,
      unit: 'kg',
      version: 'V1.0',
    },
  });
  console.log(`[PLM] BOM: ${bom.bomCode}`);

  // 4. NPI Project
  const project = await prisma.npiProject.upsert({
    where: { projectCode: 'NPI-2026-001' },
    update: {},
    create: {
      projectCode: 'NPI-2026-001',
      projectName: 'YJ4820静音电机NPI开发',
      status: '立项',
      priority: '高',
      productId: product.id,
      startDate: new Date('2026-06-19'),
      targetDate: new Date('2026-07-26'),
      description: '新型静音循环风扇电机NPI开发项目',
    },
  });
  console.log(`[NPI] Project: ${project.projectCode} - ${project.projectName}`);

  // 5. Sampling Work Order
  const samplingOrder = await prisma.samplingWorkOrder.upsert({
    where: { orderCode: 'SO-2026-0001' },
    update: {},
    create: {
      orderCode: 'SO-2026-0001',
      productName: 'YJ4820-0028 静音电机',
      productCategory: '循环风扇电机',
      quantity: 5,
      unit: 'pcs',
      deadline: new Date('2026-07-10'),
      description: '客户美的电器需求打样5台静音电机',
      applicant: '张三',
      customerName: '美的电器',
      status: 'pending_approval',
    },
  });
  console.log(`[Sampling] Order: ${samplingOrder.orderCode}`);

  // 6. Drawing
  let drawing = await prisma.drawing.findFirst({
    where: { drawingCode: 'DWG-YJ4820-001' },
  });
  if (!drawing) {
    drawing = await prisma.drawing.create({
      data: {
      drawingCode: 'DWG-YJ4820-001',
      drawingName: 'YJ4820-0028总装图',
      productId: product.id,
      category: '装配图',
      description: '电机总装配图V1.0',
      latestVersion: 'V1.0',
      status: 'active',
      },
    });
  }
  console.log(`[Drawing] Drawing: ${drawing.drawingCode} - ${drawing.drawingName}`);

  // 6b. Drawing Version
  const existingVersion = await prisma.drawingVersion.findFirst({
    where: { drawingId: drawing.id, version: 'V1.0' },
  });
  if (!existingVersion) {
    await prisma.drawingVersion.create({
      data: {
        drawingId: drawing.id,
        version: 'V1.0',
        docType: 'pdf',
        fileName: 'DWG-YJ4820-001.pdf',
        filePath: '/uploads/DWG-YJ4820-001.pdf',
        fileSize: 2048000,
        changeNote: '初始版本',
        uploadBy: '李四',
        isLatest: true,
      },
    });
    console.log(`[Drawing] Version V1.0 added`);
  }

  // 7. ERP Work Order
  await prisma.erpWorkOrder.upsert({
    where: { orderCode: 'WO-2026-0001' },
    update: {},
    create: {
      orderCode: 'WO-2026-0001',
      productId: product.id,
      quantity: 100,
      status: 'pending',
      priority: '高',
      startDate: new Date('2026-06-19'),
    },
  });
  console.log(`[ERP] WorkOrder: WO-2026-0001`);

  // 8. Supplier
  await prisma.supplier.upsert({
    where: { supplierCode: 'S-2026-0001' },
    update: {},
    create: {
      supplierCode: 'S-2026-0001',
      supplierName: '慈溪市勘塑料厂',
      category: '辅料',
      contactPerson: '王五',
      phone: '13800001111',
      address: '浙江省慈溪市龙山镇',
      bankAccount: '6222021234567890',
      taxId: '91330282MA12345678',
      status: '潜在',
      rating: 'C',
    },
  });
  console.log(`[Supplier] Supplier: S-2026-0001`);

  console.log('\n=== Phase 1.1 种子数据播种完成 ===');
}

seedPhase1()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
