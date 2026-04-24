import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { checkForAppUpdate } from '@/lib/cacheVersion';

/**
 * UpdatePrompt Component
 * Detects when a new version of the app is available
 * and prompts user to reload
 */
export function UpdatePrompt() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Initial check
    checkForAppUpdate().then(setHasUpdate);

    // Listen for Service Worker updates
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerUpdate = () => {
        setHasUpdate(true);
        console.log('🔄 App update available');
      };

      // Listen for 'controllerchange' event (new SW took control)
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        handleServiceWorkerUpdate
      );

      // Periodically check for updates (every 60 seconds)
      const updateCheckInterval = setInterval(() => {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => {
            reg.update().then(() => {
              if (reg.waiting) {
                setHasUpdate(true);
              }
            });
          });
        });
      }, 60000);

      return () => {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          handleServiceWorkerUpdate
        );
        clearInterval(updateCheckInterval);
      };
    }
  }, []);

  // Show toast if update is available
  useEffect(() => {
    if (hasUpdate) {
      toast.custom(
        (t) => (
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 shadow-lg max-w-md">
            <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-200">
                Nova versão disponível!
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                Clique para atualizar e aproveitar as novidades.
              </p>
            </div>
            <button
              onClick={() => {
                setIsUpdating(true);
                toast.dismiss(t);
                console.log('🔄 Reloading app for update...');
                setTimeout(() => {
                  window.location.reload();
                }, 300);
              }}
              className="ml-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-semibold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors whitespace-nowrap"
            >
              Atualizar
            </button>
          </div>
        ),
        {
          duration: Infinity, // Keep showing until dismissed or updated
        }
      );
    }
  }, [hasUpdate]);

  // Show loading state while updating
  if (isUpdating) {
    return (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#11302c] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="font-semibold text-foreground">Atualizando app...</p>
          <p className="text-sm text-muted-foreground">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  return null;
}
