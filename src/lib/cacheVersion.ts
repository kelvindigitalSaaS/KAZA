/**
 * Cache Versioning System
 * Automatically clears old cache when app version changes
 * Prevents stale data and UI bugs from PWA caching
 */

const CACHE_VERSION = 'kaza-v1.2.0';
const CACHE_VERSION_KEY = 'KAZA_CACHE_VERSION';

/**
 * Check if cache version is outdated
 * If outdated, clear all storage and reload
 */
export async function invalidateCacheIfNeeded() {
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);

    if (storedVersion !== CACHE_VERSION) {
      console.log(`🔄 Cache version outdated: ${storedVersion} → ${CACHE_VERSION}`);

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear IndexedDB (if used)
      if (window.indexedDB && 'databases' in window.indexedDB) {
        try {
          const dbs = await (window.indexedDB as any).databases();
          dbs.forEach((db: any) => {
            window.indexedDB.deleteDatabase(db.name);
          });
        } catch (e) {
          console.log('  ℹ️ IndexedDB cleanup skipped (not supported)');
        }
      }

      // Store new version
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);

      // Unregister all Service Workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => {
            console.log('🗑️ Unregistering service worker:', reg.scope);
            reg.unregister();
          });
        });
      }

      console.log('✅ Cache cleared. Reloading app...');

      // Reload after brief delay to ensure cleanup
      setTimeout(() => {
        window.location.reload();
      }, 500);

      return true; // Indicates reload will happen
    }

    return false; // Cache is current
  } catch (error) {
    console.error('❌ Error in cache versioning:', error);
    return false;
  }
}

/**
 * Get current cache version (for debugging)
 */
export function getCacheVersion(): string {
  return CACHE_VERSION;
}

/**
 * Manually clear cache (for development/testing)
 */
export function manuallyCloseCache() {
  localStorage.clear();
  sessionStorage.clear();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
  }
  localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  window.location.reload();
}

/**
 * Check if app needs update (for UI prompts)
 */
export async function checkForAppUpdate(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;

    const regs = await navigator.serviceWorker.getRegistrations();

    for (const reg of regs) {
      // Check for updates
      await reg.update();

      // If there's a waiting SW, we have an update
      if (reg.waiting) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking for app update:', error);
    return false;
  }
}
