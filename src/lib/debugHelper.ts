/**
 * Debug Helper for Development
 * Add useful commands to window.KAZA_DEBUG
 * Only active in development mode
 */

export function initDebugHelper() {
  if (import.meta.env.DEV) {
    // Create global debug object
    (window as any).KAZA_DEBUG = {
      // ========== Cache & Storage ==========

      /**
       * Clear all local data (storage, cache, service workers)
       */
      clearAll: () => {
        console.log('🗑️ Clearing all storage...');
        localStorage.clear();
        sessionStorage.clear();

        // Clear IndexedDB
        if (window.indexedDB && 'databases' in window.indexedDB) {
          (window.indexedDB as any).databases?.().then((dbs: any[]) => {
            dbs.forEach(db => {
              window.indexedDB.deleteDatabase(db.name);
              console.log(`  ✓ Deleted IndexedDB: ${db.name}`);
            });
          });
        }

        // Unregister service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => {
              reg.unregister();
              console.log(`  ✓ Unregistered SW: ${reg.scope}`);
            });
          });
        }

        console.log('✅ Cache cleared! Reloading...');
        setTimeout(() => window.location.reload(), 500);
      },

      /**
       * Show all stored data
       */
      showStorage: () => {
        console.group('📊 Storage Data');
        console.table(localStorage);
        console.groupEnd();

        console.group('📊 Session Storage');
        console.table(sessionStorage);
        console.groupEnd();
      },

      /**
       * Show cache version
       */
      showCacheVersion: () => {
        const version = localStorage.getItem('KAZA_CACHE_VERSION');
        console.log(`📦 Current cache version: ${version || 'NOT SET'}`);
      },

      /**
       * Hard reload (bypass cache)
       */
      hardReload: () => {
        console.log('🔄 Hard reloading...');
        window.location.reload(true);
      },

      /**
       * Show service workers
       */
      showServiceWorkers: async () => {
        if (!('serviceWorker' in navigator)) {
          console.log('❌ Service Workers not supported');
          return;
        }

        const regs = await navigator.serviceWorker.getRegistrations();
        console.group('🔧 Service Workers');
        regs.forEach((reg, i) => {
          console.log(`[${i}] Scope: ${reg.scope}`);
          console.log(`    Active: ${reg.active ? '✅' : '❌'}`);
          console.log(`    Waiting: ${reg.waiting ? '⏳' : '❌'}`);
          console.log(`    Installing: ${reg.installing ? '📥' : '❌'}`);
        });
        if (regs.length === 0) console.log('No service workers registered');
        console.groupEnd();
      },

      /**
       * Force service worker update check
       */
      checkForUpdates: async () => {
        if (!('serviceWorker' in navigator)) {
          console.log('❌ Service Workers not supported');
          return;
        }

        const regs = await navigator.serviceWorker.getRegistrations();
        console.log('🔍 Checking for updates...');

        for (const reg of regs) {
          await reg.update();
          if (reg.waiting) {
            console.log('✅ Update available! Reload to activate.');
          } else {
            console.log('✓ App is up to date');
          }
        }
      },

      // ========== App Info ==========

      /**
       * Show app version and environment info
       */
      showAppInfo: () => {
        const isDev = import.meta.env.DEV;
        const isProd = import.meta.env.PROD;

        console.group('ℹ️ App Information');
        console.log(`Environment: ${isDev ? 'DEVELOPMENT' : isProd ? 'PRODUCTION' : 'UNKNOWN'}`);
        console.log(`User Agent: ${navigator.userAgent}`);
        console.log(`Online: ${navigator.onLine ? '✅' : '❌'}`);
        console.log(`Cache version: ${localStorage.getItem('KAZA_CACHE_VERSION') || 'NOT SET'}`);
        console.groupEnd();
      },

      // ========== Useful shortcuts ==========

      /**
       * Quick help
       */
      help: () => {
        console.log(`
╔════════════════════════════════════════════════════╗
║  KAZA DEBUG HELPER - Available Commands            ║
╚════════════════════════════════════════════════════╝

📊 Storage:
  KAZA_DEBUG.clearAll()           - Clear all cache & reload
  KAZA_DEBUG.showStorage()        - Show LocalStorage data
  KAZA_DEBUG.showCacheVersion()   - Show cache version
  KAZA_DEBUG.hardReload()         - Force reload bypassing cache

🔧 Service Workers:
  KAZA_DEBUG.showServiceWorkers() - List all registered SWs
  KAZA_DEBUG.checkForUpdates()    - Check for app updates

ℹ️ Info:
  KAZA_DEBUG.showAppInfo()        - Show app environment info
  KAZA_DEBUG.help()               - Show this help text
        `);
      },
    };

    console.log('🐛 Debug mode enabled. Type KAZA_DEBUG.help() for commands');
  }
}
