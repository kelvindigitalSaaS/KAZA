/* eslint-disable @typescript-eslint/no-explicit-any */
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isAndroid, isNative } from "./capacitor";

// ── Notification icon & badge paths — use unified app icon
const ICON_192 = "/icon.png";
const ICON_512 = "/icon.png";
const BADGE_ICON = "/icons/badge-96.svg";
const FRIGGO_SOUND = "default";

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

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
const VIBRATE_URGENT = [500, 100, 500, 100, 500, 100, 500, 100, 500]; // ~3s alarm pattern
const VIBRATE_GENTLE = [80]; // single gentle tap
// 10-second continuous garbage alarm: 400ms on + 100ms off repeated to reach ~10s
const VIBRATE_GARBAGE = [
  400, 100, 400, 100, 400, 100, 400, 100, 400, 100,
  400, 100, 400, 100, 400, 100, 400, 100, 400, 100,
  400, 100, 400, 100, 400, 100, 400, 100, 400, 100,
]; // ~10s alarm pattern

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
  | "meal-plan"
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
    vibrate: VIBRATE_GARBAGE,
    requireInteraction: true,
    actions: [
      { action: "done", title: "✅ Já coloquei!" },
      { action: "snooze", title: "⏰ Lembrar em 30min" }
    ]
  },
  "meal-plan": {
    vibrate: VIBRATE_GENTLE,
    requireInteraction: false,
    actions: [
      { action: "open", title: "🍽️ Ver plano" },
      { action: "dismiss", title: "Ok" }
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
    const sub = await reg.pushManager.getSubscription();
    // Sem VAPID key aqui; grava inscrição existente se houver.
    if (!sub) return;
    const json = sub.toJSON() as any;
    await (supabase.from("push_subscriptions") as any).upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: json?.keys?.p256dh ?? null,
      auth: json?.keys?.auth ?? null,
      user_agent: navigator.userAgent,
      platform: "web",
      is_active: true,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "user_id,endpoint" });
  } catch (_e) { /* best-effort */ }
}

// ── Web Audio notification sounds ────────────────────────────────────────────

type SoundType = "default" | "urgent" | "gentle" | "garbage" | "checkup";

let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof AudioContext === "undefined" && typeof (window as any).webkitAudioContext === "undefined") return null;
  if (!_audioCtx || _audioCtx.state === "closed") {
    _audioCtx = new (AudioContext || (window as any).webkitAudioContext)();
  }
  return _audioCtx;
}

/**
 * Plays a notification sound using Web Audio API — no audio file required.
 * Best-effort: silently ignored if AudioContext is unavailable (e.g. iOS background).
 */
export function playNotificationSound(type: SoundType = "default") {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const playTone = (freq: number, start: number, dur: number, vol: number, rampDown = true) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(gain);
      osc.frequency.value = freq;
      osc.type = type === "urgent" || type === "garbage" ? "square" : "sine";
      g.gain.setValueAtTime(vol, now + start);
      if (rampDown) g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.01);
    };

    switch (type) {
      case "urgent":
      case "garbage":
        // Three short alarm beeps
        gain.gain.setValueAtTime(0.3, now);
        playTone(880, 0, 0.15, 0.3);
        playTone(880, 0.2, 0.15, 0.3);
        playTone(1100, 0.4, 0.2, 0.35);
        break;
      case "checkup":
        // Gentle two-tone chime
        gain.gain.setValueAtTime(0.2, now);
        playTone(523, 0, 0.3, 0.2);    // C5
        playTone(659, 0.25, 0.4, 0.2); // E5
        break;
      case "gentle":
        gain.gain.setValueAtTime(0.15, now);
        playTone(660, 0, 0.25, 0.15);
        break;
      default:
        // Two-note ding
        gain.gain.setValueAtTime(0.2, now);
        playTone(523, 0, 0.2, 0.2);    // C5
        playTone(784, 0.15, 0.3, 0.2); // G5
    }
  } catch (_e) { /* AudioContext unavailable */ }
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

  // Check if vibration is enabled for garbage notifications
  let vibrationEnabled = true;
  if (category === "garbage") {
    try {
      const garbageCfg = localStorage.getItem("kaza-garbage-reminder");
      if (garbageCfg) {
        const cfg = JSON.parse(garbageCfg);
        vibrationEnabled = cfg.vibrationEnabled !== false;
      }
    } catch { /* use default */ }
  }

  if (!vibrationEnabled) {
    // Skip vibration and sound for disabled garbage notifications
    if (category === "garbage") {
      playNotificationSound("gentle");
    } else if (category === "consume-today") {
      playNotificationSound("urgent");
    }
  } else {
    if (category === "garbage" || category === "consume-today") {
      playNotificationSound("urgent");
    }
  }

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
  if (vibrationEnabled || category !== "garbage") {
    baseOptions.vibrate = config.vibrate;
  }
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
  "meal-plan": "Refeição planejada",
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
    sound: "default",
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
  if (permResult.receive !== "granted") return;

  await PushNotifications.register();

  PushNotifications.addListener("registration", (_token) => {
    // TODO: send _token.value to your backend (supabase profiles.push_token)
  });

  PushNotifications.addListener("registrationError", (_err) => { /* silent */ });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
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

  await LocalNotifications.requestPermissions();
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
