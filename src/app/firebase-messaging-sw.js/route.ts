import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const script = `
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

(async () => {
  try {
    const response = await fetch('/api/fcm/config', { cache: 'no-store' });
    if (!response.ok) return;
    const config = await response.json();
    if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) return;
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const notification = payload.notification || {};
      const title = notification.title || 'PRIYASA';
      const options = { body: notification.body || 'You have a new shopping update.', icon: '/icon.svg', badge: '/icon.svg', data: payload.data || {}, tag: payload.data?.tag || 'priyasa-shopping' };
      self.registration.showNotification(title, options);
    });
  } catch (_) {}
})();

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    for (const client of windows) if ('focus' in client) { client.navigate(target); return client.focus(); }
    return clients.openWindow(target);
  }));
});
`;
  return new NextResponse(script, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' } });
}
