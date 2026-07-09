// SW registration & cleanup
(function() {
  'use strict';

  // Unregister any stale service workers (e.g. from previous HTTPS deployment)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (var i = 0; i < registrations.length; i++) {
        var sw = registrations[i];
        // Always unregister stale SWs first to prevent HTTPS-misdirect
        sw.unregister().then(function(success) {
          if (success) {
            console.log('[SW] Unregistered stale service worker');
          }
        });
      }
      // Re-register current service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        }).then(function(registration) {
          console.log('[SW] Registered:', registration.scope);
        }).catch(function(err) {
          console.warn('[SW] Registration failed:', err);
        });
      }
    }).catch(function(err) {
      // Fallback: try direct register
      navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      }).catch(function(err) {
        console.warn('[SW] Registration failed:', err);
      });
    });
  }
})();