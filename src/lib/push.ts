import { db } from "@/lib/db";

let webpushInitialized = false;

// Lazy-load web-push only when actually sending notifications (not during build)
async function getWebPush() {
  const webpush = (await import("web-push")).default;
  if (!webpushInitialized) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@promos.app",
      process.env.VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || ""
    );
    webpushInitialized = true;
  }
  return webpush;
}

export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || "";
}

// Send a push notification to a specific subscription
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<boolean> {
  try {
    const webpush = await getWebPush();
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        vapidDetails: {
          subject: process.env.VAPID_SUBJECT || "mailto:admin@promos.app",
          publicKey: process.env.VAPID_PUBLIC_KEY || "",
          privateKey: process.env.VAPID_PRIVATE_KEY || "",
        },
      }
    );
    return true;
  } catch (error) {
    // If subscription is expired/invalid, delete it
    if (error instanceof Error && error.message.includes("410")) {
      await db.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });
    }
    return false;
  }
}

// Send a push notification to all subscribers linked to a userToken
export async function sendPushToUser(
  userToken: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ sent: number; failed: number }> {
  const subs = await db.pushSubscription.findMany({
    where: { userToken },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const ok = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    );
    if (ok) sent++;
    else failed++;
  }

  return { sent, failed };
}
