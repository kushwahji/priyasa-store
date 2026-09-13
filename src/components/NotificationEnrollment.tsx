'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const DEVICE_ID_KEY = 'priyasa_fcm_device_id';
const PROMPT_KEY = 'priyasa_fcm_prompt_dismissed';

function stableDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = typeof crypto.randomUUID === 'function' ? `web-${crypto.randomUUID()}` : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `web-${Date.now()}`;
  }
}

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && process.env.NEXT_PUBLIC_FIREBASE_APP_ID && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
}

export default function NotificationEnrollment() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const register = useCallback(async () => {
    if (!configured() || typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return false;
    setBusy(true); setMessage('');
    try {
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      if (permission !== 'granted') {
        if (permission === 'denied') localStorage.setItem(PROMPT_KEY, '1');
        setVisible(false);
        setMessage(permission === 'denied' ? 'Notifications are blocked. You can enable them later in browser settings.' : 'Notifications were not enabled.');
        return false;
      }

      const { initializeApp, getApps } = await import('firebase/app');
      const { getMessaging, getToken } = await import('firebase/messaging');
      const app = getApps()[0] || initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
      const registration = await navigator.serviceWorker.register('/api/firebase-messaging-sw', { scope: '/' });
      const token = await getToken(getMessaging(app), { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
      if (!token) throw new Error('Firebase did not return a device token.');

      await api('/device/register', {
        method: 'POST',
        body: JSON.stringify({
          device_id: stableDeviceId(),
          device_token: token,
          device_type: 'web',
          device_model: navigator.userAgent.slice(0, 255),
          os_version: navigator.platform || 'web',
          app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        }),
      });
      localStorage.setItem(PROMPT_KEY, '1');
      setVisible(false);
      setMessage('Notifications are enabled.');
      return true;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to enable notifications right now.');
      return false;
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (!configured() || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') { void register(); return; }
    if (Notification.permission === 'denied' || localStorage.getItem(PROMPT_KEY) === '1') return;
    setVisible(true);
  }, [register]);

  if (!visible) return null;
  return <aside className="notificationPrompt" role="dialog" aria-label="PRIYASA notifications"><div><strong>Stay updated with PRIYASA</strong><p>Get order, delivery and important account alerts.</p></div><div><button className="button" disabled={busy} onClick={() => void register()}>{busy ? 'Enabling…' : 'Enable notifications'}</button><button className="textButton" disabled={busy} onClick={() => { localStorage.setItem(PROMPT_KEY, '1'); setVisible(false); }}>Not now</button></div></aside>;
}
