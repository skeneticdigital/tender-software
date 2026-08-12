import prisma from '../server/prisma.js';
import { db } from '../server/db.js';

async function main() {
  console.log('Starting seed...');
  
  for (const u of db.get.users) {
    await prisma.user.upsert({
      where: { id: u.id }, update: {},
      create: {
        id: u.id, name: u.name, email: u.email, passwordHash: u.passwordHash,
        role: u.role, department: u.department, phone: u.phone, status: u.status,
        accessibleModules: JSON.stringify(u.accessibleModules || []),
        createdAt: new Date(u.createdAt)
      }
    });
  }

  for (const m of db.get.materials) {
    await prisma.material.upsert({
      where: { id: m.id }, update: {},
      create: {
        id: m.id, materialCode: m.materialCode, name: m.name, category: m.category,
        unit: m.unit, specification: m.specification, minStockLevel: m.minStockLevel,
        reorderLevel: m.reorderLevel, currentStock: m.currentStock, supplierName: m.supplierName,
        unitRate: m.unitRate, remarks: m.remarks, createdAt: new Date(m.createdAt), updatedAt: new Date(m.updatedAt)
      }
    });
  }

  console.log('Seeding finished.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
