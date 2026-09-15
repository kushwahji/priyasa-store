'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Preferences = { order: boolean; cart: boolean; offers: boolean };
const KEY = 'priyasa_notification_preferences_v1';
const REGISTERED = 'priyasa_fcm_registered_v1';
const DEFAULTS: Preferences = { order: true, cart: true, offers: true };

function readPreferences(): Preferences {
  try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); return { order: value?.order !== false, cart: value?.cart !== false, offers: value?.offers !== false }; } catch { return DEFAULTS; }
}

async function registerFcm(preferences: Preferences): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || Notification.permission !== 'granted') return false;
  const config = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId || !vapidKey) return false;
  const [{ initializeApp, getApps }, { getMessaging, getToken, onMessage }] = await Promise.all([import('firebase/app'), import('firebase/messaging')]);
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return false;
  await api('/device/register', { method: 'POST', body: JSON.stringify({ token, device_token: token, device_id: `web-${token.slice(0, 20)}`, platform: 'web', app_version: '1.0.0', notification_permission: Notification.permission, notification_preferences: preferences }) });
  localStorage.setItem(REGISTERED, '1');
  onMessage(messaging, (payload) => { window.dispatchEvent(new CustomEvent('priyasa-fcm-message', { detail: { title: payload.notification?.title || 'PRIYASA', body: payload.notification?.body || 'You have a new shopping update.' } })); });
  return true;
}

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  useEffect(() => {
    if (window.location.pathname !== '/') return;
    const prefs = readPreferences(); setPreferences(prefs);
    if (!('Notification' in window)) return;
    const dismissed = localStorage.getItem('priyasa_notification_prompt_dismissed') === '1';
    if (Notification.permission === 'granted') { if (localStorage.getItem(REGISTERED) !== '1') void registerFcm(prefs).catch(() => undefined); return; }
    if (Notification.permission === 'denied' || dismissed) return;
    const timer = window.setTimeout(() => setVisible(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { const handler = (event: Event) => { const detail = (event as CustomEvent<{ title: string; body: string }>).detail; setToast(detail); window.setTimeout(() => setToast(null), 5000); }; window.addEventListener('priyasa-fcm-message', handler); return () => window.removeEventListener('priyasa-fcm-message', handler); }, []);
  async function allow() { setBusy(true); try { const permission = await Notification.requestPermission(); if (permission !== 'granted') { localStorage.setItem('priyasa_notification_prompt_dismissed', '1'); setVisible(false); return; } localStorage.setItem(KEY, JSON.stringify(preferences)); await registerFcm(preferences); setVisible(false); } catch { setVisible(false); } finally { setBusy(false); } }
  function dismiss() { localStorage.setItem('priyasa_notification_prompt_dismissed', '1'); setVisible(false); }
  if (toast) return <div className="notificationToast" role="status"><strong>{toast.title}</strong><span>{toast.body}</span></div>;
  if (!visible) return null;
  return <aside className="notificationPrompt" role="dialog" aria-modal="false" aria-labelledby="notification-title"><div className="notificationPromptHead"><div className="notificationIcon">P</div><div><h3 id="notification-title">Stay Updated with PRIYASA</h3><p>Get order updates, useful cart reminders and selected shopping offers.</p></div><button className="notificationClose" onClick={dismiss} aria-label="Close">×</button></div><div className="notificationReminder"><label><input type="checkbox" checked={preferences.order} onChange={e => setPreferences(v => ({ ...v, order: e.target.checked }))} /> Order & delivery updates</label><label><input type="checkbox" checked={preferences.cart} onChange={e => setPreferences(v => ({ ...v, cart: e.target.checked }))} /> Cart reminders</label><label><input type="checkbox" checked={preferences.offers} onChange={e => setPreferences(v => ({ ...v, offers: e.target.checked }))} /> Offers & new arrivals</label></div><div className="notificationActions"><button className="button" disabled={busy} onClick={allow}>{busy ? 'Enabling…' : 'Allow Notifications'}</button><button className="button secondary" disabled={busy} onClick={dismiss}>Not Now</button></div></aside>;
}
