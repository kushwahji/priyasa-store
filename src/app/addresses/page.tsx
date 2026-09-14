'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';

type Address = { id?: string | number; label?: string; recipient_name?: string; name?: string; phone?: string; line1?: string; address_line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; pincode?: string; country?: string; is_default?: boolean };

const empty: Address = { label: 'Home', recipient_name: '', phone: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'IN', is_default: false };

function AddressesContent() {
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState<Address>(empty);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await api<any>('/storefront/addresses');
      const rows = r.data?.addresses || r.addresses || r.data || [];
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load addresses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  function change(k: keyof Address, v: string | boolean) { setForm(x => ({ ...x, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const phone = String(form.phone || '').replace(/\D/g, '');
    const postal = String(form.postal_code || form.pincode || '').replace(/\D/g, '');
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (postal.length !== 6) { setError('Enter a valid 6-digit PIN code.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...form, phone, postal_code: postal, country: form.country || 'IN' };
      const r = await api<any>('/storefront/addresses', { method: 'POST', body: JSON.stringify(payload) });
      const a = r.data?.address || r.address || r.data;
      if (a?.id) setItems(x => [a, ...x.filter(item => String(item.id) !== String(a.id))]); else await load();
      setForm({ ...empty }); setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save address'); }
    finally { setBusy(false); }
  }

  async function remove(id: string | number) {
    if (!id || deleting || !window.confirm('Remove this saved address?')) return;
    setDeleting(id); setError('');
    try { await api(`/storefront/addresses/${encodeURIComponent(String(id))}`, { method: 'DELETE' }); setItems(x => x.filter(a => String(a.id) !== String(id))); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to remove address'); }
    finally { setDeleting(null); }
  }

  return <main className="accountPage">
    <div className="sectionHead"><div><span className="eyebrow">PRIYASA / ACCOUNT</span><h1>Delivery addresses</h1><p className="muted">Save trusted delivery addresses for faster checkout.</p></div><Link className="textLink" href="/checkout">Back to checkout →</Link></div>
    {error && <div className="formError" role="alert">{error}<button className="textButton" type="button" onClick={() => void load()}>Retry</button></div>}
    <button className="button" disabled={open || busy} onClick={() => { setError(''); setForm({ ...empty }); setOpen(true); }}>+ Add new address</button>
    {open && <form className="addressForm" onSubmit={save} noValidate><h2>Add delivery address</h2>
      {(['recipient_name','phone','line1','line2','city','state','postal_code'] as const).map(k => <label key={k}>{k === 'recipient_name' ? 'Recipient name' : k === 'line1' ? 'Address line 1' : k === 'line2' ? 'Address line 2' : k === 'postal_code' ? 'PIN code' : k[0].toUpperCase() + k.slice(1)}<input required={k !== 'line2'} maxLength={k === 'phone' ? 10 : k === 'postal_code' ? 6 : undefined} value={String(form[k] || '')} onChange={e => change(k, k === 'phone' || k === 'postal_code' ? e.target.value.replace(/\D/g, '').slice(0, k === 'phone' ? 10 : 6) : e.target.value)} inputMode={k === 'phone' || k === 'postal_code' ? 'numeric' : undefined} autoComplete={k === 'recipient_name' ? 'name' : k === 'phone' ? 'tel' : undefined} /></label>)}
      <label>Set as default<input type="checkbox" checked={Boolean(form.is_default)} onChange={e => change('is_default', e.target.checked)} /></label>
      <div><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button><button type="button" className="textButton" disabled={busy} onClick={() => setOpen(false)}>Cancel</button></div>
    </form>}
    {loading ? <div className="emptyState"><p className="muted">Loading saved addresses…</p></div> : items.length ? <div className="addressList">{items.map(a => <article className="checkoutCard" key={a.id || `${a.recipient_name}-${a.line1}`}><div className="sectionHead"><div><strong>{a.recipient_name || a.name || 'Delivery address'}</strong>{a.label && <small>{a.label}</small>}</div>{a.is_default && <span className="filterChip">Default</span>}</div><p>{a.line1 || a.address_line1}{a.line2 ? `, ${a.line2}` : ''}</p><p>{a.city}, {a.state} {a.postal_code || a.pincode}</p>{a.phone && <small>{a.phone}</small>}<div><button className="textButton" disabled={deleting === a.id || busy} onClick={() => a.id && void remove(a.id)}>{deleting === a.id ? 'Removing…' : 'Remove address'}</button></div></article>)}</div> : <div className="emptyState"><h2>No saved addresses</h2><p>Add an address to make checkout faster.</p></div>}
  </main>;
}

export default function Addresses() { return <AuthGuard><AddressesContent /></AuthGuard>; }
