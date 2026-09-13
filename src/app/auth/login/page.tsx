'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function LoginForm() {
  const params = useSearchParams();
  const requestedNext = params.get('next');
  const next = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/account';
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function sendOtp() {
    setError(''); setMessage('');
    if (!/^[6-9]\d{9}$/.test(phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setBusy(true);
    try {
      const r = await api<any>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ mobile: phone, device_token: 'web-' + Date.now(), device_id: 'web-browser', channel: 'auto' }) });
      const id = r.data?.request_id || r.request_id;
      if (!id) throw new Error('OTP request succeeded but no request id was returned.');
      setRequestId(id); setSent(true); setMessage('OTP sent. It is valid for a limited time.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to send OTP'); }
    finally { setBusy(false); }
  }

  async function resend() {
    if (!requestId) return sendOtp();
    setBusy(true); setError(''); setMessage('');
    try {
      await api('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ request_id: requestId }) });
      setMessage('A new OTP has been sent.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to resend OTP'); }
    finally { setBusy(false); }
  }

  async function verify() {
    setError('');
    if (otp.length !== 6 || !requestId) { setError('Enter the 6-digit OTP.'); return; }
    setBusy(true);
    try {
      const r = await api<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ mobile: phone, otp, request_id: requestId }) });
      if (!(r?.authenticated || r?.data?.authenticated)) throw new Error('Login succeeded without establishing a session.');
      window.location.replace(next);
    } catch (e) { setError(e instanceof Error ? e.message : 'Invalid OTP'); }
    finally { setBusy(false); }
  }

  return <main className="accountPage"><section className="authCard"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>{sent ? 'Verify your OTP' : 'Sign in to PRIYASA'}</h1><p className="muted">{sent ? `We sent a verification code to +91 ${phone}.` : 'Use your mobile number for a secure passwordless sign-in.'}</p>{error && <div className="formError" role="alert">{error}</div>}{message && <div className="formMessage" role="status">{message}</div>}{!sent ? <><label>Mobile number<input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" aria-label="Mobile number" /></label><button className="button" disabled={busy} onClick={sendOtp}>{busy ? 'Sending…' : 'Send OTP'}</button></> : <><label>OTP<input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit OTP" inputMode="numeric" autoComplete="one-time-code" aria-label="OTP" /></label><button className="button" disabled={busy || otp.length !== 6 || !requestId} onClick={verify}>{busy ? 'Verifying…' : 'Verify & continue'}</button><button className="textButton" disabled={busy} onClick={resend}>Resend OTP</button><button className="textButton" disabled={busy} onClick={() => { setSent(false); setOtp(''); setRequestId(''); }}>Change mobile number</button></>}</section></main>;
}

export default function Login() {
  return <Suspense fallback={<main className="accountPage"><section className="authCard"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>Sign in to PRIYASA</h1><p className="muted">Loading secure sign-in…</p></section></main>}><LoginForm /></Suspense>;
}
