export async function registerModelServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw-model-cache.js');
      console.log('Service worker registered', reg.scope);
    } catch (err) {
      console.warn('Service worker registration failed', err);
    }
  }
}

export function isServiceWorkerControllerActive() {
  return Boolean(navigator.serviceWorker?.controller);
}
