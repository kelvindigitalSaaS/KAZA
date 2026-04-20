import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeUI } from "./lib/nativeUI";
import {
  initPushNotifications,
  initLocalNotifications,
  requestWebNotificationPermission,
  registerNotificationHandlers
} from "./lib/pushNotifications";
import { startGarbageReminderMonitoring } from "./lib/garbageReminderNotifications";
import { initSentry } from "./lib/sentry";
import { isNative } from "./lib/capacitor";
import { registerSW } from "virtual:pwa-register";

// Initialize error tracking first
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

// Registro do Service Worker com estratégia "prompt" — não força reload.
// O SW novo fica em espera e só assume quando o usuário fechar e reabrir o app.
if (!isNative) {
  registerSW({
    onNeedRefresh() {
      // Nova versão disponível — dispara evento customizado para o app mostrar
      // um banner discreto (não um alert bloqueante).
      window.dispatchEvent(new CustomEvent("pwa-update-available"));
    },
    onOfflineReady() {
      // App pronto para uso offline
      window.dispatchEvent(new CustomEvent("pwa-offline-ready"));
    },
    immediate: false
  });
}

// Initialise native features after first render
initNativeUI();
if (isNative) {
  initPushNotifications();
  initLocalNotifications();
} else {
  // On web/PWA: request browser Notification permission
  // Delay slightly so it happens after the app loads (avoids permission prompt before the page paints)
  setTimeout(() => requestWebNotificationPermission(), 3000);
  // Register notification click/action handlers
  registerNotificationHandlers();
}

// Iniciar monitoramento de notificações de coleta de lixo
startGarbageReminderMonitoring();
