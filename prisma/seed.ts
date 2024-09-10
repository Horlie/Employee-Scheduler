import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)
  

  const user1Data = {
    email: 'admin@example.com',
    password: hashedPassword,
    employees: [
      { name: "John Doe", role: "nurse" },
      { name: "Jane Smith", role: "orderly" },
      { name: "Bob Johnson", role: "nurse" },
      { name: "Emily Davis", role: "nurse" },
      { name: "Michael Brown", role: "orderly" },
      { name: "Sarah Wilson", role: "nurse" },
      { name: "David Lee", role: "orderly" },
      { name: "Lisa Taylor", role: "nurse" },
      { name: "Robert Anderson", role: "orderly" },
      { name: "Jennifer Martinez", role: "nurse" },
    ]
  }

  const user2Data = {
    email: 'test@example.com',
    password: hashedPassword,
    employees: [
      { name: "Alice Brown", role: "orderly" },
      { name: "Charlie Green", role: "nurse" },
      { name: "David Wilson", role: "doctor" },
      { name: "Emma Thompson", role: "nurse" },
      { name: "Frank Miller", role: "orderly" },
      { name: "Grace Davis", role: "doctor" },
      { name: "Henry Clark", role: "nurse" },
      { name: "Isabelle White", role: "orderly" },
      { name: "Jack Robinson", role: "doctor" },
      { name: "Kate Taylor", role: "nurse" },
      { name: "Liam Anderson", role: "orderly" },
      { name: "Mia Garcia", role: "doctor" },
      { name: "Noah Martinez", role: "nurse" },
      { name: "Olivia Johnson", role: "orderly" },
      { name: "Peter Lee", role: "doctor" },
    ]
  }

  for (const userData of [user1Data, user2Data]) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password,
        employees: {
          deleteMany: {}, // This will delete all existing employees for this user
          create: userData.employees
        }
      },
      create: {
        email: userData.email,
        password: userData.password,
        employees: {
          create: userData.employees
        }
      },
    })

    console.log(`Upserted user: ${user.email}`)
  }

  // Add some example availability data
  const employees = await prisma.employee.findMany()
  for (const employee of employees) {
    await prisma.employeeAvailability.createMany({
      data: [
        {
          employeeId: employee.id,
          date: new Date('2024-05-01'),
          status: 'unavailable',
        },
        {
          employeeId: employee.id,
          date: new Date('2024-05-02'),
          status: 'preferable',
        },
        {
          employeeId: employee.id,
          date: new Date('2024-05-03'),
          status: 'unreachable',
        },
      ],
    })
  }

  console.log('Seed data inserted')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })