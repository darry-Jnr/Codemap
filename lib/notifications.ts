/**
 * notifications.ts
 * Handles all notification logic for CodeMap.
 * Uses Web Notifications API for system-level notifications
 * (shows on lock screen, works when minimized on Android Chrome)
 */

export type NotificationType =
  | "tracking"
  | "incoming_request"
  | "arrival"
  | "session_ended"

// Request notification permission — call once after user sets their name
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false

  const result = await Notification.requestPermission()
  return result === "granted"
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported"
  return Notification.permission
}

// Show a system notification via service worker (works in background)
async function showSystemNotification(title: string, body: string, tag: string) {
  if (!("serviceWorker" in navigator)) return
  if (Notification.permission !== "granted") return

  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      tag, // tag prevents duplicate notifications
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      requireInteraction: tag === "incoming_request", // stays until dismissed for requests
    })
  } catch (err) {
    console.error("Failed to show notification:", err)
  }
}

// Cancel a specific notification by tag
async function cancelNotification(tag: string) {
  if (!("serviceWorker" in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const notifications = await reg.getNotifications({ tag })
    notifications.forEach((n) => n.close())
  } catch (err) {
    console.error("Failed to cancel notification:", err)
  }
}

// ── Public notification functions ──

// Shows persistent "tracking" notification while session is active
export async function notifyTracking(friendName: string) {
  await showSystemNotification(
    "📍 CodeMap is tracking you",
    `Your location is being shared with ${friendName}. Tap to open.`,
    "tracking"
  )
}

// Cancel tracking notification when session ends
export async function cancelTrackingNotification() {
  await cancelNotification("tracking")
}

// Someone entered your code and wants to connect
export async function notifyIncomingRequest(fromName: string) {
  await showSystemNotification(
    `👋 ${fromName} wants to meet up!`,
    "Tap to accept or decline their request.",
    "incoming_request"
  )
}

// Friend tapped "I'm here"
export async function notifyArrival(friendName: string) {
  await showSystemNotification(
    `🎉 ${friendName} has arrived!`,
    "Your friend is nearby — check the map.",
    "arrival"
  )
}

// Session ended by other party
export async function notifySessionEnded(friendName: string) {
  await cancelNotification("tracking")
  await showSystemNotification(
    `${friendName} ended the session`,
    "The location sharing session has ended.",
    "session_ended"
  )
}