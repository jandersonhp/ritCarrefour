// sw.js - VERSÃO CORRIGIDA SEM CACHE AGRESSIVO
const CACHE_NAME = 'vagas-carrefour-v3';

self.addEventListener('install', event => {
  self.skipWaiting();
  console.log('✅ SW instalado - v3 (sem cache agressivo)');
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
  console.log('🎯 SW ativado - Cache limpo');
});

// 🔥 ESSA PARTE É A MAIS IMPORTANTE! - SEMPRE BUSCA ONLINE PRIMEIRO
self.addEventListener('fetch', event => {
  // PARA SEUS ARQUIVOS - SEMPRE BUSCA ATUALIZADO
  if (event.request.url.includes('ritCarrefour')) {
    event.respondWith(
      fetch(event.request) // 1º TENTA BUSCAR NA REDE (ATUALIZADO)
        .then(response => {
          // Só faz cache em background se deu certo
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Só usa cache se estiver OFFLINE
          return caches.match(event.request);
        })
    );
  } else {
    // Para recursos externos (Google Fonts) - cache normal
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// --- NOTIFICAÇÕES PUSH (MANTIDO) ---
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nova vaga disponível!',
    icon: './assets/icon-192.png',
    badge: './assets/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/ritCarrefour/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Monitor de Vagas', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/ritCarrefour/')
  );
});