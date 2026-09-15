'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Address = {
  id: string | number;
  name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  is_default?: boolean;
  default?: boolean;
};

const emptyForm = { name: '', phone: '', address_line1: '', address_line2: '', landmark: '', city: '', state: '', pincode: '', country: 'India', is_default: false };

function normalize(r: any): Address[] {
  const d = r?.data ?? r ?? {};
  const v = Array.isArray(d) ? d : d.addresses ?? d.items ?? d.data ?? [];
  return Array.isArray(v) ? v : [];
}

function errorMessage(e: unknown) { return e instanceof Error ? e.message : 'Unable to complete that address action.'; }

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setAddresses(normalize(await api<any>('/storefront/checkout/addresses'))); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function change(key: keyof typeof emptyForm, value: string | boolean) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function edit(address: Address) {
    setEditing(address.id);
    setMessage(''); setError('');
    setForm({
      name: address.name || '', phone: address.phone || '', address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '', landmark: address.landmark || '', city: address.city || '',
      state: address.state || '', pincode: String(address.pincode || ''), country: address.country || 'India',
      is_default: Boolean(address.is_default ?? address.default),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() { setEditing(null); setForm({ ...emptyForm }); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(''); setMessage('');
    if (!form.name.trim() || !form.address_line1.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode)) {
      setError('Enter name, address, city, state and a valid 6-digit pincode.'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim(), address_line1: form.address_line1.trim(), address_line2: form.address_line2.trim() || undefined, landmark: form.landmark.trim() || undefined, city: form.city.trim(), state: form.state.trim(), phone: form.phone.trim() || undefined, country: form.country.trim() || 'India', pincode: form.pincode };
      if (editing !== null) await api(`/storefront/checkout/addresses/${encodeURIComponent(String(editing))}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await api('/storefront/checkout/addresses', { method: 'POST', body: JSON.stringify(payload) });
      setMessage(editing !== null ? 'Address updated.' : 'Address added.'); reset(); await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  }

  async function makeDefault(id: string | number) {
    setBusy(id); setError(''); setMessage('');
    try { await api(`/storefront/checkout/addresses/${encodeURIComponent(String(id))}/default`, { method: 'POST' }); setMessage('Default address updated.'); await load(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(null); }
  }

  async function remove(id: string | number) {
    if (!window.confirm('Remove this delivery address?')) return;
    setBusy(id); setError(''); setMessage('');
    try { await api(`/storefront/checkout/addresses/${encodeURIComponent(String(id))}`, { method: 'DELETE' }); setMessage('Address removed.'); if (editing === id) reset(); await load(); }
    catch (e) { setError(errorMessage(e)); }
    finally { setBusy(null); }
  }

  return <main className="accountPage">
    <div className="sectionHead"><div><span className="eyebrow">MY PRIYASA</span><h1>Delivery addresses</h1><p className="muted">Save addresses for faster, safer checkout.</p></div><Link className="textLink" href="/account">Account →</Link></div>
    {error && <div className="formError" role="alert">{error}<button className="textButton" type="button" onClick={() => void load()}>Retry</button></div>}
    {message && <div className="formMessage" role="status">{message}</div>}
    <section className="addressForm authCard">
      <div className="sectionHead"><div><span className="eyebrow">{editing !== null ? 'EDIT ADDRESS' : 'NEW ADDRESS'}</span><h2>{editing !== null ? 'Update address' : 'Add delivery address'}</h2></div>{editing !== null && <button className="textButton" type="button" onClick={reset}>Cancel</button>}</div>
      <form onSubmit={save}>
        <div className="formGrid">
          <label>Full name<input required value={form.name} onChange={e => change('name', e.target.value)} autoComplete="name" /></label>
          <label>Mobile number<input value={form.phone} onChange={e => change('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="tel" autoComplete="tel" placeholder="Optional" /></label>
          <label>Address line 1<input required value={form.address_line1} onChange={e => change('address_line1', e.target.value)} autoComplete="address-line1" /></label>
          <label>Address line 2<input value={form.address_line2} onChange={e => change('address_line2', e.target.value)} autoComplete="address-line2" placeholder="Apartment, area (optional)" /></label>
          <label>Landmark<input value={form.landmark} onChange={e => change('landmark', e.target.value)} placeholder="Optional" /></label>
          <label>City<input required value={form.city} onChange={e => change('city', e.target.value)} autoComplete="address-level2" /></label>
          <label>State<input required value={form.state} onChange={e => change('state', e.target.value)} autoComplete="address-level1" /></label>
          <label>Pincode<input required value={form.pincode} onChange={e => change('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="postal-code" /></label>
          <label>Country<input value={form.country} onChange={e => change('country', e.target.value)} autoComplete="country-name" /></label>
        </div>
        <label className="checkRow"><input type="checkbox" checked={form.is_default} onChange={e => change('is_default', e.target.checked)} /> Make this my default address</label>
        <button className="button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing !== null ? 'Save changes' : 'Add address'}</button>
      </form>
    </section>
    <section className="addressList">
      <div className="sectionHead"><div><span className="eyebrow">SAVED ADDRESSES</span><h2>Your addresses</h2></div></div>
      {loading ? <div className="emptyState"><h2>Loading addresses…</h2></div> : !addresses.length ? <div className="emptyState"><h2>No saved addresses</h2><p>Add an address above to speed up checkout.</p></div> : <div className="addressGrid">{addresses.map(address => { const isDefault = Boolean(address.is_default ?? address.default); return <article className="addressCard" key={String(address.id)}><div className="addressCardHead"><strong>{address.name || 'Delivery address'}</strong>{isDefault && <span className="productBadge">DEFAULT</span>}</div>{address.phone && <small>{address.phone}</small>}<p>{[address.address_line1, address.address_line2, address.landmark, address.city, address.state, address.pincode, address.country].filter(Boolean).join(', ')}</p><div className="addressActions"><button className="textButton" type="button" onClick={() => edit(address)}>Edit</button>{!isDefault && <button className="textButton" type="button" disabled={busy === address.id} onClick={() => void makeDefault(address.id)}>Set default</button>}<button className="textButton danger" type="button" disabled={busy === address.id} onClick={() => void remove(address.id)}>Remove</button></div></article>; })}</div>}
    </section>
  </main>;
}
