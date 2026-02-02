import { eq } from "drizzle-orm";
import { db, dbSchema } from "../../db";

export async function getUserById(userId: string) {
  const user = await db.query.user.findFirst({
    where: {
      id: userId,
    },
  });

  return user;
}

export async function updateUserName(input: { userId: string; name: string }) {
  const [user] = await db
    .update(dbSchema.user)
    .set({
      name: input.name,
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.user.id, input.userId))
    .returning();

  return user;
}

export async function updateUserAvatar(input: { userId: string; image: string | null }) {
  const [user] = await db
    .update(dbSchema.user)
    .set({
      image: input.image,
      updatedAt: new Date(),
    })
    .where(eq(dbSchema.user.id, input.userId))
    .returning();

  return user;
}

export const settingsData = {
  getUserById,
  updateUserName,
  updateUserAvatar,
};
