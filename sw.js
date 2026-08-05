// Service Worker: handle share target POST and save file into IndexedDB then open app
importScripts('/idb.js');

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const form = await request.formData();
    const files = form.getAll('file');
    if (files && files.length) {
      // store first file under 'shared-file' key
      const file = files[0];
      await idbSet('shared-file', { name: file.name, blob: file });
    }
    // open a window (or focus) to the app and notify via query param
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (allClients.length > 0) {
      // focus the first one and navigate
      const client = allClients[0];
      client.focus();
      client.navigate('/?shared=1');
    } else {
      await clients.openWindow('/?shared=1');
    }
    return Response.redirect('/', 303);
  } catch (err) {
    return new Response('Error receiving shared file', { status: 500 });
  }
}
