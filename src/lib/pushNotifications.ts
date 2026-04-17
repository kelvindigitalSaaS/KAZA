import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isAndroid, isNative } from "./capacitor";

// ── Notification icon & badge paths — use unified app icon
const ICON_192 = "/icon.png";
const ICON_512 = "/icon.png";
const BADGE_ICON = "/icons/badge-96.svg";

function detectBrowser() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua) && /Safari\//.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari';
  return 'other';
}

// ── Vibration patterns ───────────────────────────────────────────────────────
const VIBRATE_DEFAULT = [100, 50, 100]; // short double buzz
// 3-second alarm pattern: 500ms on + 100ms off repeated ~5 times ≈ 3s total
// NOTE: Web Vibration API (navigator.vibrate) only works in foreground tab on Android Chrome.
// iOS Safari does not support navigator.vibrate at all. On native (Capacitor) the OS handles
// vibration natively via the Haptics plugin — add @capacitor/haptics for full 3s alarm support.
const VIBRATE_URGENT = [500, 100, 500, 100, 500, 100, 500, 100, 500]; // ~3s alarm pattern
const VIBRATE_GENTLE = [80]; // single gentle tap

/**
 * Triggers a 3-second vibration alarm (best-effort across platforms).
 * - Android Chrome/PWA: uses Web Vibration API (~3s pattern)
 * - iOS Safari: no vibration support (limitation of WebKit)
 * - Native Capacitor: native haptics should be used instead
 */
export function triggerAlarmVibration() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(VIBRATE_URGENT);
  }
}

// ── Notification categories & their configs ──────────────────────────────────
type NotifCategory =
  | "expiry"
  | "consume-today"
  | "overripe"
  | "low-stock"
  | "garbage"
  | "general"
  | "test";

interface NotifCategoryConfig {
  vibrate: number[];
  requireInteraction: boolean;
  actions: NotificationAction[];
}

const CATEGORY_CONFIGS: Record<NotifCategory, NotifCategoryConfig> = {
  "expiry": {
    vibrate: VIBRATE_DEFAULT,
    requireInteraction: false,
    actions: [
      { action: "open", title: "🧊 Ver item" },
      { action: "dismiss", title: "Depois" }
    ]
  },
  "consume-today": {
    vibrate: VIBRATE_URGENT,
    requireInteraction: true,
    actions: [
      { action: "open", title: "🍽️ Consumir agora" },
      { action: "dismiss", title: "Lembrar depois" }
    ]
  },
  "overripe": {
    vibrate: VIBRATE_DEFAULT,
    requireInteraction: false,
    actions: [
      { action: "open", title: "🍌 Ver item" },
      { action: "recipe", title: "🍳 Ver receitas" }
    ]
  },
  "low-stock": {
    vibrate: VIBRATE_GENTLE,
    requireInteraction: false,
    actions: [
      { action: "open", title: "🛒 Lista de compras" },
      { action: "dismiss", title: "Depois" }
    ]
  },
  "garbage": {
    vibrate: VIBRATE_DEFAULT,
    requireInteraction: true,
    actions: [
      { action: "done", title: "✅ Já coloquei!" },
      { action: "snooze", title: "⏰ Lembrar em 30min" }
    ]
  },
  "general": {
    vibrate: VIBRATE_GENTLE,
    requireInteraction: false,
    actions: []
  },
  "test": {
    vibrate: VIBRATE_DEFAULT,
    requireInteraction: false,
    actions: [
      { action: "open", title: "🧊 Abrir Kaza" }
    ]
  }
};

// ── Web / PWA notification helpers ───────────────────────────────────────────

/**
 * Requests Notification permission on web/PWA.
 * Call this early (after a user gesture if possible, otherwise on startup).
 */
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (isNative) return true;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  const granted = result === "granted";
  if (granted) {
    try { await saveWebPushSubscription(); } catch { /* best-effort */ }
  }
  return granted;
}

/**
 * Persiste a inscrição de push do navegador em public.push_subscriptions.
 * Best-effort: não bloqueia o fluxo se falhar.
 */
export async function saveWebPushSubscription(): Promise<void> {
  if (isNative) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    // Sem VAPID key aqui; grava inscrição existente se houver.
    if (!sub) return;
    const json = sub.toJSON() as any;
    await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: json?.keys?.p256dh ?? null,
      auth: json?.keys?.auth ?? null,
      user_agent: navigator.userAgent,
      platform: "web",
      is_active: true,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "user_id,endpoint" });
  } catch (e) {
    console.warn("[push] saveWebPushSubscription failed", e);
  }
}

/**
 * Sends a rich notification via the PWA Service Worker (works in background on Android/desktop)
 * or falls back to the plain Notification API.
 */
export async function sendWebNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    icon?: string;
    badge?: string;
    category?: NotifCategory;
    image?: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  if (isNative) return;
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  const category = options?.category ?? "general";
  const config = CATEGORY_CONFIGS[category];
  // Personalize notification options per browser for best compatibility
  const browser = detectBrowser();
  const preferredIcon = options?.icon ?? (browser === 'safari' ? ICON_512 : ICON_192);
  const preferredBadge = options?.badge ?? BADGE_ICON;

  const baseOptions: any = {
    body,
    icon: preferredIcon,
    badge: preferredBadge,
    tag: options?.tag,
    silent: false,
    renotify: !!options?.tag, // re-alert if same tag is updated
    timestamp: Date.now(),
    data: {
      category,
      url: "/",
      ...options?.data
    }
  };

  // Vibrate and requireInteraction may be ignored by some browsers; attach when useful
  baseOptions.vibrate = config.vibrate;
  baseOptions.requireInteraction = config.requireInteraction;

  // Actions are best supported in Chromium-based browsers. Avoid sending actions to Safari/Firefox where support is spotty.
  if (browser === 'chrome' || browser === 'edge') {
    baseOptions.actions = config.actions;
  }

  const notifOptions: NotificationOptions = baseOptions;

  // Add image for certain categories (rich expanded notification)
  if (options?.image) {
    (notifOptions as any).image = options.image;
  }

  // Prefer SW showNotification (works when PWA is in background)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, notifOptions as any);
      return;
    } catch {
      // SW not available — fall through to Notification API
    }
  }

  // Fallback: plain browser Notification (only visible while tab is open)
  // Note: Notification API has limited support for actions/vibrate
  // Fallback: use the browser-friendly icon/badge selection
  new Notification(title, {
    body,
    icon: options?.icon ?? (detectBrowser() === 'safari' ? ICON_512 : ICON_192),
    badge: options?.badge ?? BADGE_ICON,
    tag: options?.tag,
    silent: false
  });
}

// ── Register SW notification event handlers ──────────────────────────────────

/**
 * Sets up Service Worker message handlers for notification interactions.
 * Called once during app initialization.
 */
export function registerNotificationHandlers() {
  if (isNative || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    const { type, action, data } = event.data || {};

    if (type === "notification-click") {
      // Focus or open the app
      window.focus();

      if (action === "recipe") {
        window.location.href = "/settings";
      } else if (action === "open" && data?.url) {
        window.location.href = data.url;
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────

const FRIGGO_SOUND = "friggo_notification.wav";
const CHANNEL_ID = "kaza_default";
const CHANNEL_URGENT = "kaza_urgent";
const NOTIFICATION_GROUP_DEFAULT = "kaza_updates";
const NOTIFICATION_GROUP_GARBAGE = "kaza_garbage";
const ACTION_TYPE_DEFAULT = "kaza_default_actions";
const ACTION_TYPE_URGENT = "kaza_urgent_actions";
const ACTION_TYPE_GARBAGE = "kaza_garbage_actions";

let actionTypesRegistered = false;
let localNotificationListenersRegistered = false;

const CATEGORY_SUMMARY: Record<NotifCategory, string> = {
  expiry: "Prazo do alimento",
  "consume-today": "Ação recomendada hoje",
  overripe: "Use antes de perder",
  "low-stock": "Reposição sugerida",
  garbage: "Lembrete importante da casa",
  general: "Atualização do Kaza",
  test: "Teste do sistema"
};

function getActionTypeId(category: NotifCategory) {
  if (category === "garbage") return ACTION_TYPE_GARBAGE;
  if (category === "consume-today") return ACTION_TYPE_URGENT;
  return ACTION_TYPE_DEFAULT;
}

function getNotificationGroup(category: NotifCategory) {
  return category === "garbage"
    ? NOTIFICATION_GROUP_GARBAGE
    : NOTIFICATION_GROUP_DEFAULT;
}

function getNotificationColor(category: NotifCategory) {
  switch (category) {
    case "consume-today":
    case "garbage":
      return "#ef4444";
    case "low-stock":
      return "#3b82f6";
    case "overripe":
      return "#f59e0b";
    default:
      return "#22c55e";
  }
}

function buildNativeNotification(
  title: string,
  body: string,
  category: NotifCategory,
  extra?: Record<string, unknown>
) {
  const isUrgent = category === "consume-today" || category === "garbage";

  return {
    title,
    body,
    largeBody: `${body}\n\nAbra o Kaza para ver os detalhes.`,
    summaryText: CATEGORY_SUMMARY[category],
    channelId: isUrgent ? CHANNEL_URGENT : CHANNEL_ID,
    sound: FRIGGO_SOUND,
    smallIcon: "ic_stat_icon",
    largeIcon: "ic_launcher",
    iconColor: getNotificationColor(category),
    actionTypeId: getActionTypeId(category),
    group: getNotificationGroup(category),
    autoCancel: true,
    inboxList: [body, CATEGORY_SUMMARY[category]],
    extra
  };
}

async function ensureNotificationActions() {
  if (!isNative || actionTypesRegistered) return;

  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: ACTION_TYPE_DEFAULT,
          actions: [
            { id: "open", title: "Abrir app" },
            { id: "dismiss", title: "Dispensar" }
          ]
        },
        {
          id: ACTION_TYPE_URGENT,
          actions: [
            { id: "open", title: "Ver agora" },
            { id: "dismiss", title: "Depois" }
          ]
        },
        {
          id: ACTION_TYPE_GARBAGE,
          actions: [
            { id: "done", title: "Concluído" },
            { id: "snooze", title: "+30 min" }
          ]
        }
      ]
    });
    actionTypesRegistered = true;
  } catch {
    // registerActionTypes can be ignored when unsupported by the runtime
  }
}

function registerLocalNotificationListeners() {
  if (!isNative || localNotificationListenersRegistered) return;

  LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (event) => {
      const url = event.notification.extra?.url;
      if (typeof url === "string") {
        window.location.href = url;
      }
    }
  );

  localNotificationListenersRegistered = true;
}

/**
 * Creates the Android notification channels with the custom sound.
 */
async function ensureNotificationChannels() {
  if (!isNative) return;
  try {
    await ensureNotificationActions();

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Kaza",
      description: "Atualizações da sua geladeira e despensa",
      importance: 4, // HIGH
      sound: FRIGGO_SOUND,
      vibration: true,
      lights: true,
      lightColor: "#22c55e"
    });
    await LocalNotifications.createChannel({
      id: CHANNEL_URGENT,
      name: "Kaza — Urgente",
      description: "Itens vencendo hoje ou com urgência",
      importance: 5, // MAX
      sound: FRIGGO_SOUND,
      vibration: true,
      lights: true,
      lightColor: "#ef4444"
    });
  } catch {
    // createChannel only works on Android; iOS ignores it
  }
}

/**
 * Registers the device for push notifications on native platforms.
 * On web, this is a no-op (the PWA service-worker handles it).
 */
export async function initPushNotifications() {
  if (!isNative) return;

  await ensureNotificationChannels();
  registerLocalNotificationListeners();

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") {
    console.warn("[Push] Permission not granted");
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    console.log("[Push] Device token:", token.value);
    // TODO: send token.value to your backend (supabase profiles.push_token)
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("[Push] Registration error:", err.error);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("[Push] Received in foreground:", notification);
    // Show a local notification so the user sees it while in-app
    LocalNotifications.schedule({
      notifications: [
        {
          ...buildNativeNotification(
            notification.title ?? "Kaza 🧊",
            notification.body ?? "",
            "general",
            { source: "push-foreground", url: "/" }
          ),
          id: Date.now()
        }
      ]
    });
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("[Push] Action performed:", action);
    const url = action.notification.data?.url;
    if (isAndroid && typeof url === "string") {
      window.location.href = url;
    }
  });
}

/**
 * Requests permission for local notifications (needed on iOS 10+).
 * Also creates the Android notification channels.
 */
export async function initLocalNotifications() {
  if (!isNative) return;

  // Create channels first so scheduled notifications have a channel to go to (Android)
  await ensureNotificationChannels();
  registerLocalNotificationListeners();

  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") {
    console.warn("[LocalNotif] Permission not granted");
  }
}

/**
 * Schedule a local notification (works on all platforms).
 * On web/PWA uses the rich Notification API / Service Worker.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  delayMs = 0,
  tag?: string,
  category: NotifCategory = "general"
) {
  if (!isNative) {
    if (delayMs > 0) {
      setTimeout(
        () => sendWebNotification(title, body, { tag, category }),
        delayMs
      );
    } else {
      await sendWebNotification(title, body, { tag, category });
    }
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        ...buildNativeNotification(title, body, category, {
          category,
          tag,
          url: "/"
        }),
        id: Date.now(),
        schedule:
          delayMs > 0 ? { at: new Date(Date.now() + delayMs) } : undefined
      }
    ]
  });
}
