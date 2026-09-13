'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const DEVICE_ID_KEY = 'priyasa_fcm_device_id';
const PROMPT_KEY = 'priyasa_fcm_prompt_dismissed';

type NativeDevice = { device_id?: string; device_model?: string; os_version?: string; app_version?: string };

declare global { interface Window { priyasaRegisterFcmToken?: (token: string, device?: NativeDevice) => Promise<boolean>; } }

function stableDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = typeof crypto.randomUUID === 'function' ? `web-${crypto.randomUUID()}` : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch { return `web-${Date.now()}`; }
}

function configured() { return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID && process.env.NEXT_PUBLIC_FIREBASE_APP_ID && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY); }

async function registerToken(token: string, deviceType: 'web' | 'android', device: NativeDevice = {}) {
  if (!token.trim()) throw new Error('FCM device token is empty.');
  await api('/device/register', { method: 'POST', body: JSON.stringify({ device_id: device.device_id || stableDeviceId(), device_token: token.trim(), device_type: deviceType, device_model: device.device_model || (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 255) : 'web'), os_version: device.os_version || (typeof navigator !== 'undefined' ? navigator.platform || 'web' : 'web'), app_version: device.app_version || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0' }) });
  return true;
}

export default function NotificationEnrollment() {
  const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');

  const register = useCallback(async () => {
    if (!configured() || typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return false;
    setBusy(true); setMessage('');
    try {
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      if (permission !== 'granted') { if (permission === 'denied') localStorage.setItem(PROMPT_KEY, '1'); setVisible(false); return false; }
      const { initializeApp, getApps } = await import('firebase/app'); const { getMessaging, getToken } = await import('firebase/messaging');
      const app = getApps()[0] || initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID });
      const registration = await navigator.serviceWorker.register('/api/firebase-messaging-sw', { scope: '/' });
      const token = await getToken(getMessaging(app), { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
      await registerToken(token, 'web');
      localStorage.setItem(PROMPT_KEY, '1'); setVisible(false); return true;
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to enable notifications right now.'); return false; }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.priyasaRegisterFcmToken = async (token, device = {}) => { try { return await registerToken(token, 'android', device); } catch { return false; } };
    return () => { delete window.priyasaRegisterFcmToken; };
  }, []);

  useEffect(() => {
    if (!configured() || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') { void register(); return; }
    if (Notification.permission === 'denied' || localStorage.getItem(PROMPT_KEY) === '1') return;
    setVisible(true);
  }, [register]);

  if (!visible) return message ? <span className="srOnly" role="status">{message}</span> : null;
  return <aside className="notificationPrompt" role="dialog" aria-label="PRIYASA notifications"><div><strong>Stay updated with PRIYASA</strong><p>Get order, delivery and important account alerts.</p></div><div><button className="button" disabled={busy} onClick={() => void register()}>{busy ? 'Enabling…' : 'Enable notifications'}</button><button className="textButton" disabled={busy} onClick={() => { localStorage.setItem(PROMPT_KEY, '1'); setVisible(false); }}>Not now</button></div>{message && <p className="formError" role="alert">{message}</p>}</aside>;
}
