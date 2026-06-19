"use server";

import { getToken } from "@/lib/session";
import { getNotifications, markNotificationAsRead } from "@/lib/api/endpoints";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction() {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  try {
    const notifications = await getNotifications(token);
    return { success: true, notifications };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    return { error: message };
  }
}

export async function markNotificationAsReadAction(id: string) {
  const token = await getToken();
  if (!token) return { error: "Not authenticated" };

  try {
    await markNotificationAsRead(id, token);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark notification as read";
    return { error: message };
  }
}
