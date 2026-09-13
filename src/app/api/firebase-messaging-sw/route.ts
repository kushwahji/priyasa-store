import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  const script = `
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'PRIYASA';
  const body = notification.body || data.body || 'You have a new PRIYASA update.';
  const link = data.deepLink || data.url || '/account/notifications';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { link }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const target = event.notification.data && event.notification.data.link ? event.notification.data.link : '/account/notifications';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    for (const client of clientList) {
      if ('focus' in client) {
        if ('navigate' in client) client.navigate(target);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(target);
  }));
});
`.trim();

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
