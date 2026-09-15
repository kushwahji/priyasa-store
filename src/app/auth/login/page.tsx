'use client';

import { useState } from 'react';
import { api, clearAccessToken, setAccessToken } from '@/lib/api';
import styles from './page.module.css';

type OtpResponse = { request_id?: string; data?: { request_id?: string }; session?: boolean; token?: string; access_token?: string };

function safeNext() {
  const value = new URLSearchParams(window.location.search).get('next');
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/account';
}

export default function Login() {
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
      const r = await api<OtpResponse>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ mobile: phone, device_token: 'web-store', device_id: 'web-store', channel: 'auto' }) });
      const id = r.request_id || r.data?.request_id;
      if (!id) throw new Error('OTP request was accepted but no request ID was returned.');
      setRequestId(id); setSent(true); setMessage('OTP sent. It is valid for a limited time.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to send OTP'); }
    finally { setBusy(false); }
  }

  async function resendOtp() {
    if (!requestId) { await sendOtp(); return; }
    setError(''); setMessage(''); setBusy(true);
    try {
      const r = await api<OtpResponse>('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ request_id: requestId }) });
      const id = r.request_id || r.data?.request_id;
      if (id) setRequestId(id);
      setMessage('A new OTP has been sent.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to resend OTP'); }
    finally { setBusy(false); }
  }

  async function verify() {
    setError(''); setMessage('');
    if (!requestId) { setError('OTP session expired. Please request a new OTP.'); return; }
    if (!/^\d{6}$/.test(otp)) { setError('Enter the 6-digit OTP.'); return; }
    setBusy(true);
    try {
      const r = await api<OtpResponse>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ mobile: phone, otp, request_id: requestId }) });
      const token = r.access_token || r.token;
      if (token) setAccessToken(token);
      window.location.assign(safeNext());
    } catch (e) { clearAccessToken(); setError(e instanceof Error ? e.message : 'Unable to complete sign in. Please try again.'); }
    finally { setBusy(false); }
  }

  function changePhone() {
    clearAccessToken(); setOtp(''); setRequestId(''); setSent(false); setError(''); setMessage('');
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authBackdrop} aria-hidden="true" />
      <section className={styles.authCard} aria-labelledby="login-title">
        <img className={styles.authLogo} src="/brand/priyasa-logo.svg" alt="PRIYASA — Every You, Beautiful" />
        <span className={styles.authEyebrow}>PRIYASA ACCOUNT</span>
        <h1 id="login-title" className={styles.authTitle}>{sent ? 'Verify your OTP' : 'Sign in to PRIYASA'}</h1>
        <p className={styles.authSubtitle}>{sent ? `We sent a verification code to +91 ${phone}.` : 'Use your mobile number for a secure passwordless sign-in.'}</p>

        <div className={styles.authForm}>
          {error && <div className={styles.authError} role="alert">{error}</div>}
          {message && <div className={styles.authMessage} role="status">{message}</div>}

          {!sent ? (
            <>
              <label className={styles.authLabel} htmlFor="mobile">Mobile number
                <input id="mobile" className={styles.authInput} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel" maxLength={10} autoFocus />
              </label>
              <button className={styles.authButton} disabled={busy} onClick={sendOtp}>{busy ? 'Sending…' : 'Send OTP'}</button>
            </>
          ) : (
            <>
              <label className={styles.authLabel} htmlFor="otp">6-digit OTP
                <input id="otp" className={styles.authInput} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter OTP" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus />
              </label>
              <button className={styles.authButton} disabled={busy || otp.length !== 6} onClick={verify}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
              <div className={styles.authActions}>
                <button className={styles.authTextButton} disabled={busy} onClick={resendOtp}>Resend OTP</button>
                <button className={styles.authTextButton} disabled={busy} onClick={changePhone}>Change mobile number</button>
              </div>
            </>
          )}
        </div>

        <p className={styles.authLegal}>By continuing, you agree to PRIYASA&apos;s terms and privacy policy.</p>
      </section>
    </main>
  );
}
