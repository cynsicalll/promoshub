"use client";

import * as asReact from "react";

const React = asReact;

// Detect the platform
function detectPlatform(): { isIOS: boolean; isStandalone: boolean; isAndroid: boolean; browser: string } {
  if (typeof window === "undefined") {
    return { isIOS: false, isStandalone: false, isAndroid: false, browser: "unknown" };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  let browser = "unknown";
  if (/CriOS/.test(ua)) browser = "chrome-ios";
  else if (/FxiOS/.test(ua)) browser = "firefox-ios";
  else if (/Opt/.test(ua)) browser = "opera";
  else if (/Edg/.test(ua)) browser = "edge";
  else if (/Chrome/.test(ua)) browser = "chrome";
  else if (/Safari/.test(ua)) browser = "safari";
  else if (/Firefox/.test(ua)) browser = "firefox";

  return { isIOS, isStandalone, isAndroid, browser };
}

// Hook for managing push notification subscriptions
export function usePushNotifications(userToken: string | null) {
  const [supported, setSupported] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [platform, setPlatform] = React.useState<ReturnType<typeof detectPlatform>>({
    isIOS: false,
    isStandalone: false,
    isAndroid: false,
    browser: "unknown",
  });

  React.useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    // Push notifications are supported when:
    // - Service Worker is available AND PushManager is available
    // - On iOS Safari: only when running as standalone PWA (Add to Home Screen)
    const hasSW = "serviceWorker" in navigator;
    const hasPush = "PushManager" in window;

    if (p.isIOS && !p.isStandalone) {
      // iOS Safari without Add to Home Screen — push not available yet
      setSupported(false);
    } else if (hasSW && hasPush) {
      setSupported(true);
    } else {
      setSupported(false);
    }
  }, []);

  // Check if already subscribed
  const checkSubscription = React.useCallback(async () => {
    if (!userToken) return;
    try {
      const res = await fetch(`/api/push/subscribe?userToken=${userToken}`);
      const data = await res.json();
      setSubscribed(data.subscribed);
    } catch {
      // ignore
    }
  }, [userToken]);

  React.useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Subscribe to push notifications
  // Returns { success: boolean, error?: string }
  const subscribe = React.useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userToken) return { success: false, error: "No user token" };
    setLoading(true);
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidRes = await fetch("/api/push/vapid-key");
      const vapidData = await vapidRes.json();
      const publicKey = vapidData.publicKey;

      if (!publicKey) {
        return { success: false, error: "Push notifications are not configured on the server. The admin needs to set VAPID keys in Vercel environment variables." };
      }

      // Request permission FIRST — this triggers the browser popup
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return { success: false, error: "Notification permission was denied. Please allow notifications in your browser settings." };
      }

      // Subscribe
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      const sub = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: sub.keys,
          userToken,
        }),
      });

      setSubscribed(true);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  // Unsubscribe
  const unsubscribe = React.useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: "DELETE",
        });
      }
      setSubscribed(false);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, subscribed, loading, subscribe, unsubscribe, refresh: checkSubscription, platform };
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
