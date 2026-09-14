'use client';
import { useState } from 'react';
import { api, clearAccessToken, setAccessToken } from '@/lib/api';

type OtpResponse={request_id?:string;data?:{request_id?:string};session?:boolean};
function safeNext(){const value=new URLSearchParams(window.location.search).get('next');return value&&value.startsWith('/')&&!value.startsWith('//')?value:'/account'}
export default function Login(){
  const [phone,setPhone]=useState('');const [otp,setOtp]=useState('');const [requestId,setRequestId]=useState('');const [sent,setSent]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
  async function sendOtp(){setError('');setMessage('');if(!/^[6-9]\d{9}$/.test(phone)){setError('Enter a valid 10-digit mobile number.');return}setBusy(true);try{const r=await api<OtpResponse>('/auth/send-otp',{method:'POST',body:JSON.stringify({mobile:phone,device_token:'web-store',device_id:'web-store',channel:'auto'})});const id=r.request_id||r.data?.request_id;if(!id)throw new Error('OTP request was accepted but no request ID was returned.');setRequestId(id);setSent(true);setMessage('OTP sent. It is valid for a limited time.')}catch(e){setError(e instanceof Error?e.message:'Unable to send OTP')}finally{setBusy(false)}}
  async function resendOtp(){if(!requestId){await sendOtp();return}setError('');setMessage('');setBusy(true);try{const r=await api<OtpResponse>('/auth/resend-otp',{method:'POST',body:JSON.stringify({request_id:requestId})});const id=r.request_id||r.data?.request_id;if(id)setRequestId(id);setMessage('A new OTP has been sent.')}catch(e){setError(e instanceof Error?e.message:'Unable to resend OTP')}finally{setBusy(false)}}
  async function verify(){setError('');setMessage('');if(!requestId){setError('OTP session expired. Please request a new OTP.');return}if(!/^\d{6}$/.test(otp)){setError('Enter the 6-digit OTP.');return}setBusy(true);try{await api<OtpResponse>('/auth/verify-otp',{method:'POST',body:JSON.stringify({mobile:phone,otp,request_id:requestId})});
      // The browser never receives the bearer token. The BFF stores it in an HttpOnly cookie.
      // Confirm that cookie-backed authentication actually works before declaring login complete.
      await api('/storefront/account/me');
      setAccessToken('session');
      window.location.assign(safeNext());
    }catch(e){clearAccessToken();setError(e instanceof Error?e.message:'Unable to complete sign in. Please try again.')}finally{setBusy(false)}}
  function changePhone(){clearAccessToken();setOtp('');setRequestId('');setSent(false);setError('');setMessage('')}
  return <main className="accountPage"><section className="authCard"><span className="eyebrow">PRIYASA ACCOUNT</span><h1>{sent?'Verify your OTP':'Sign in to PRIYASA'}</h1><p className="muted">{sent?`We sent a verification code to +91 ${phone}.`:'Use your mobile number for a secure passwordless sign-in.'}</p>{error&&<div className="formError" role="alert">{error}</div>}{message&&<div className="formMessage">{message}</div>}{!sent?<><label>Mobile number<input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile number" inputMode="tel" autoComplete="tel" /></label><button className="button" disabled={busy} onClick={sendOtp}>{busy?'Sending…':'Send OTP'}</button></>:<><label>OTP<input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit OTP" inputMode="numeric" autoComplete="one-time-code" /></label><button className="button" disabled={busy||otp.length!==6} onClick={verify}>{busy?'Verifying…':'Verify & continue'}</button><button className="textButton" disabled={busy} onClick={resendOtp}>Resend OTP</button><button className="textButton" disabled={busy} onClick={changePhone}>Change mobile number</button></>}</section></main>
}
