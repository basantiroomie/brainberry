import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// This should work if the schema is properly generated
const test = async () => {
  const user = await prisma.user.findFirst()
  const child = await prisma.childProfile.findFirst()
  return { user, child }
}

export default test
