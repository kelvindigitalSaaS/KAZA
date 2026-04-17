import { isNative } from "./capacitor";
import {
  scheduleLocalNotification,
  sendWebNotification
} from "./pushNotifications";

interface GarbageReminderConfig {
  enabled: boolean;
  selectedDays: number[]; // 0-6: Sunday-Saturday
  reminderTime: string; // "HH:MM"
  garbageLocation: "street" | "building";
  buildingFloor?: string;
}

/**
 * Inicializa o sistema de notificações de coleta de lixo.
 * Para PWA: dispara 3 notificações (24h antes, 12h antes, 1h antes)
 * Para App nativo: dispara 1 notificação no horário exato
 */
export async function initGarbageReminderNotifications() {
  const config = getGarbageReminderConfig();
  if (!config.enabled || config.selectedDays.length === 0) {
    return;
  }

  // Calcular próximas datas de coleta
  const nextCollectionDates = getNextCollectionDates(
    config.selectedDays,
    config.reminderTime,
    isNative ? 1 : 3 // 1 notificação para nativo, 3 para PWA
  );

  if (nextCollectionDates.length === 0) {
    return;
  }

  // Agendar notificações
  for (const date of nextCollectionDates) {
    const delayMs = Math.max(0, date.getTime() - Date.now());
    const hoursUntil = Math.round(delayMs / (1000 * 60 * 60));

    const title =
      config.garbageLocation === "building"
        ? "🗑️ Kaza — Hora de Descer o Lixo!"
        : "🗑️ Kaza — Coleta de Lixo";

    let body: string;
    if (hoursUntil <= 1) {
      body =
        config.garbageLocation === "building"
          ? `Agora! Desça o lixo${config.buildingFloor ? ` do ${config.buildingFloor}` : ""} antes que o caminhão passe 🚛`
          : "Agora! Coloque o lixo para fora antes que o caminhão passe 🚛";
    } else if (hoursUntil <= 12) {
      body =
        config.garbageLocation === "building"
          ? `Em ${hoursUntil}h passa a coleta. Prepare o lixo${config.buildingFloor ? ` do ${config.buildingFloor}` : ""} 🏢`
          : `Em ${hoursUntil}h passa a coleta. Separe o lixo! ♻️`;
    } else {
      body =
        config.garbageLocation === "building"
          ? `Amanhã tem coleta! Lembre de descer o lixo${config.buildingFloor ? ` do ${config.buildingFloor}` : ""} 📋`
          : "Amanhã tem coleta! Prepare os sacos de lixo para amanhã 📋";
    }

    await scheduleLocalNotification(
      title,
      body,
      delayMs,
      `garbage-${date.getTime()}`,
      "garbage"
    );
  }
}

/**
 * Retorna as próximas datas de coleta de lixo
 * Para PWA: retorna 3 datas (24h antes, 12h antes, 1h antes)
 * Para nativo: retorna 1 data (no horário exato)
 */
function getNextCollectionDates(
  selectedDays: number[],
  reminderTime: string,
  notificationCount: number
): Date[] {
  const now = new Date();
  const [hours, minutes] = reminderTime.split(":").map(Number);
  const dates: Date[] = [];

  // Encontrar os próximos dias de coleta
  const nextCollectionDays: Date[] = [];

  for (let i = 0; i < 14 && nextCollectionDays.length < 3; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();

    if (selectedDays.includes(dayOfWeek)) {
      date.setHours(hours, minutes, 0, 0);

      // Se for hoje e já passou a hora, pula
      if (i === 0 && date.getTime() < now.getTime()) {
        continue;
      }

      nextCollectionDays.push(date);
    }
  }

  if (nextCollectionDays.length === 0) {
    return [];
  }

  // Usar apenas o próximo dia de coleta
  const nextCollectionDate = nextCollectionDays[0];

  if (notificationCount === 1) {
    // App nativo: 1 notificação no horário exato
    dates.push(nextCollectionDate);
  } else if (notificationCount === 3) {
    // PWA: 3 notificações
    // 1. 24 horas antes
    const notif24h = new Date(nextCollectionDate);
    notif24h.setDate(notif24h.getDate() - 1);
    if (notif24h.getTime() > now.getTime()) {
      dates.push(notif24h);
    }

    // 2. 12 horas antes
    const notif12h = new Date(nextCollectionDate);
    notif12h.setHours(notif12h.getHours() - 12);
    if (notif12h.getTime() > now.getTime()) {
      dates.push(notif12h);
    }

    // 3. 1 hora antes
    const notif1h = new Date(nextCollectionDate);
    notif1h.setHours(notif1h.getHours() - 1);
    if (notif1h.getTime() > now.getTime()) {
      dates.push(notif1h);
    }
  }

  return dates;
}

/**
 * Obter configuração do localStorage
 */
export function getGarbageReminderConfig(): GarbageReminderConfig {
  const saved = localStorage.getItem("kaza-garbage-reminder");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return {
        enabled: false,
        selectedDays: [],
        reminderTime: "20:00",
        garbageLocation: "street"
      };
    }
  }

  return {
    enabled: false,
    selectedDays: [],
    reminderTime: "20:00",
    garbageLocation: "street"
  };
}

/**
 * Sincroniza config do localStorage com a tabela public.garbage_reminders.
 * Best-effort: localStorage continua sendo a fonte primária offline.
 */
export async function syncGarbageReminderToDb(homeId: string | null | undefined) {
  if (!homeId) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const cfg = getGarbageReminderConfig();
    await supabase.from("garbage_reminders").upsert({
      home_id: homeId,
      user_id: user.id,
      enabled: cfg.enabled,
      selected_days: cfg.selectedDays,
      reminder_time: cfg.reminderTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
      garbage_location: cfg.garbageLocation,
      building_floor: cfg.buildingFloor ?? null,
    }, { onConflict: "home_id,user_id" });
  } catch (e) {
    console.warn("[garbage] syncGarbageReminderToDb failed", e);
  }
}

/**
 * Monitor contínuo para verificar e agendar notificações
 * Deve ser chamado periodicamente (a cada 5 minutos)
 */
export async function checkAndScheduleGarbageNotifications() {
  const config = getGarbageReminderConfig();
  if (!config.enabled) {
    return;
  }

  await initGarbageReminderNotifications();
}

/**
 * Parar monitoramento de notificações de lixo
 */
export function stopGarbageReminderMonitoring() {
  if ((window as any).__garbageMonitorInterval) {
    clearInterval((window as any).__garbageMonitorInterval);
    delete (window as any).__garbageMonitorInterval;
  }
}

/**
 * Iniciar monitoramento contínuo
 */
export function startGarbageReminderMonitoring() {
  stopGarbageReminderMonitoring();

  // Verificar a cada 5 minutos
  (window as any).__garbageMonitorInterval = setInterval(() => {
    checkAndScheduleGarbageNotifications();
  }, 5 * 60 * 1000);

  // Verificar imediatamente na inicialização
  checkAndScheduleGarbageNotifications();
}
