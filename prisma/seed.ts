import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)
  

  const user1Data = {
    email: 'admin@example.com',
    password: hashedPassword,
    employees: [
          // Start of Selection
          { name: "John Doe", role: "nurse", rate: 1.0 },
          { name: "Jane Smith", role: "orderly", rate: 1.0 },
          { name: "Bob Johnson", role: "nurse", rate: 1.0 },
          { name: "Emily Davis", role: "nurse", rate: 1.0 },
          { name: "Michael Brown", role: "orderly", rate: 1.0 },
          { name: "Sarah Wilson", role: "nurse", rate: 1.0 },
          { name: "David Lee", role: "orderly", rate: 1.0 },
          { name: "Lisa Taylor", role: "nurse", rate: 1.0 },
          { name: "Robert Anderson", role: "orderly", rate: 1.0 },
          { name: "Jennifer Martinez", role: "nurse", rate: 1.0 },
          { name: "Alice Green", role: "nurse", rate: 1.0 },
          { name: "Brian Clark", role: "orderly", rate: 1.0 },
          { name: "Carol King", role: "nurse", rate: 1.0 },
          { name: "Daniel Lewis", role: "nurse", rate: 1.0 },
          { name: "Eva Scott", role: "orderly", rate: 1.0 },
          { name: "Frank Harris", role: "nurse", rate: 1.0 },
          { name: "Grace Turner", role: "orderly", rate: 1.0 },
          { name: "Henry Young", role: "nurse", rate: 1.0 },
          { name: "Ivy Baker", role: "orderly", rate: 1.0 },
          { name: "Jake Adams", role: "nurse", rate: 1.0 },
          { name: "Karen Gonzalez", role: "orderly", rate: 1.0 },
          { name: "Leo Nelson", role: "nurse", rate: 1.0 },
          { name: "Mia Carter", role: "orderly", rate: 1.0 },
          { name: "Nathan Roberts", role: "nurse", rate: 1.0 },
          { name: "Olivia Perez", role: "orderly", rate: 1.0 },
          { name: "Paul Mitchell", role: "nurse", rate: 1.0 },
          { name: "Queen Torres", role: "orderly", rate: 1.0 },
          { name: "Ryan Edwards", role: "nurse", rate: 1.0 },
          { name: "Sophie Collins", role: "orderly", rate: 1.0 },
          { name: "Tommy Stewart", role: "nurse", rate: 1.0 },
          { name: "Uma Phillips", role: "orderly", rate: 1.0 },
          { name: "Victor Campbell", role: "nurse", rate: 1.0 },
          { name: "Wendy Parker", role: "orderly", rate: 1.0 },
      
    ]
  }



  const user = await prisma.user.upsert({
    where: { email: user1Data.email },
    update: {
      password: user1Data.password,
      employees: {
        deleteMany: {},
        create: user1Data.employees
      }
    },
    create: {
      email: user1Data.email,
      password: user1Data.password,
      employees: {
        create: user1Data.employees
      }
    },
  })

  console.log(`Upserted user: ${user.email}`)



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