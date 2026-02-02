import { settingsData } from "./settings.data";
import { auth } from "../auth/better-auth";

async function getProfile(userId: string) {
  return settingsData.getUserById(userId);
}

async function updateProfileName(input: { userId: string; name: string }) {
  const normalizedName = input.name.trim();

  if (!normalizedName) {
    throw new Error("Name cannot be empty");
  }

  return settingsData.updateUserName({
    userId: input.userId,
    name: normalizedName,
  });
}

async function updateProfileAvatar(input: {
  userId: string;
  image: string | null;
  currentImage: string | null;
}) {
  return settingsData.updateUserAvatar({
    userId: input.userId,
    image: input.image,
  });
}

async function changePassword(input: {
  headers: Headers;
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions?: boolean;
}) {
  await auth.api.changePassword({
    headers: input.headers,
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: input.revokeOtherSessions ?? false,
    },
  });
}

export const settingsService = {
  getProfile,
  updateProfileName,
  updateProfileAvatar,
  changePassword,
};
