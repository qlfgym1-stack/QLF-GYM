import { db } from '@/lib/db/dexie-db';
import { Role, SubscriptionType, SubscriptionStatus, PaymentMethod, Gender, MemberRole, SaleStatus } from '@/types/enums';

export async function seedDatabase() {
  const existingUsers = await db.users.toArray();
  if (existingUsers.length > 0) return;

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const adminId = crypto.randomUUID();
  await db.users.add({
    id: adminId,
    username: 'admin',
    password: 'admin123',
    role: Role.ADMIN,
    active: true,
    createdAt: now,
  });

  const receptionId = crypto.randomUUID();
  await db.users.add({
    id: receptionId,
    username: 'reception',
    password: 'reception123',
    role: Role.RECEPTION,
    active: true,
    createdAt: now,
  });

  const sampleMembers = [
    { firstName: 'Ahmed', lastName: 'Benali', gender: Gender.MALE, phone: '0555123456', email: 'ahmed@email.com', birthDate: '1990-03-15', subscriptionType: SubscriptionType.MONTHLY, subscriptionStatus: SubscriptionStatus.ACTIVE, memberRole: MemberRole.MEMBER, coach: false },
    { firstName: 'Fatima', lastName: 'Ziani', gender: Gender.FEMALE, phone: '0666123456', email: 'fatima@email.com', birthDate: '1995-07-22', subscriptionType: SubscriptionType.QUARTERLY, subscriptionStatus: SubscriptionStatus.ACTIVE, memberRole: MemberRole.MEMBER, coach: false },
    { firstName: 'Karim', lastName: 'Hadj', gender: Gender.MALE, phone: '0777123456', email: 'karim@email.com', birthDate: '1988-11-08', subscriptionType: SubscriptionType.ANNUAL, subscriptionStatus: SubscriptionStatus.ACTIVE, memberRole: MemberRole.COACH, coach: true },
    { firstName: 'Sara', lastName: 'Mokhtar', gender: Gender.FEMALE, phone: '0555987654', email: 'sara@email.com', birthDate: '2000-01-30', subscriptionType: SubscriptionType.MONTHLY, subscriptionStatus: SubscriptionStatus.ACTIVE, memberRole: MemberRole.MEMBER, coach: false },
    { firstName: 'Yacine', lastName: 'Bouaziz', gender: Gender.MALE, phone: '0666987654', email: 'yacine@email.com', birthDate: '1992-06-14', subscriptionType: SubscriptionType.SEMESTER, subscriptionStatus: SubscriptionStatus.ACTIVE, memberRole: MemberRole.MEMBER, coach: false },
  ];

  for (const data of sampleMembers) {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + { monthly: 1, quarterly: 3, semester: 6, annual: 12 }[data.subscriptionType]!);
    const memberId = crypto.randomUUID();
    await db.members.add({
      id: memberId,
      ...data,
      memberNumber: `QLF${String(Math.floor(1000 + Math.random() * 9000))}`,
      address: 'Alger',
      registrationDate: today,
      subscription: {
        type: data.subscriptionType,
        status: data.subscriptionStatus,
        startDate: today,
        endDate: endDate.toISOString().split('T')[0],
        monthlyRate: 5000,
      },
      createdAt: now,
      updatedAt: now,
    });

    await db.payments.add({
      memberId,
      amount: 5000,
      date: today,
      method: PaymentMethod.CASH,
      paymentFor: 'subscription',
      createdAt: now,
    });

    for (let d = 0; d < 10; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      if (Math.random() > 0.4) {
        const entryTime = new Date(date);
        entryTime.setHours(8 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60));
        await db.checkins.add({ memberId, timestamp: entryTime.toISOString(), type: 'entry' as any });
        const exitTime = new Date(entryTime);
        exitTime.setHours(exitTime.getHours() + 1 + Math.floor(Math.random() * 2));
        await db.checkins.add({ memberId, timestamp: exitTime.toISOString(), type: 'exit' as any });
      }
    }
  }

  const coach = (await db.members.toArray()).find(m => m.memberRole === MemberRole.COACH);
  if (coach) {
    const groupId = crypto.randomUUID();
    await db.groups.add({
      id: groupId,
      name: 'Cardio Training',
      description: 'Groupe cardio matinal',
      coachId: coach.id!,
      schedule: 'Lun/Mer/Ven 8h-9h',
      maxMembers: 15,
      memberIds: [(await db.members.toArray()).filter(m => m.memberRole === MemberRole.MEMBER).slice(0, 3).map(m => m.id!)].flat(),
      active: true,
      createdAt: now,
    });
  }

  const catId = crypto.randomUUID();
  await db.productCategories.add({ id: catId, name: 'Nutrition', description: 'Compléments alimentaires', active: true, createdAt: now });

  const products = [
    { name: 'Whey Protein 1kg', price: 4500, stock: 20 },
    { name: 'Shaker 500ml', price: 800, stock: 50 },
    { name: 'Barre protéinée', price: 250, stock: 100 },
    { name: 'T-shirt QLF', price: 1500, stock: 30 },
    { name: 'Serviette', price: 600, stock: 40 },
  ];

  for (const p of products) {
    await db.products.add({
      categoryId: catId,
      name: p.name,
      price: p.price,
      stock: p.stock,
      active: true,
      createdAt: now,
    });
  }
}
