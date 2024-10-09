import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return null;

  return { id: user.id, email: user.email };
}
