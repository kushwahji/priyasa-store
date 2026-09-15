'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { api } from '@/lib/api';

type AnyRecord = Record<string, any>;
type Props = { children: React.ReactNode };

type Festival = { key: string; label: string; emoji: string; className: string; particles: string[] };
const FESTIVALS: Record<string, Festival> = {
  default: { key: 'default', label: '', emoji: '', className: 'festival-default', particles: [] },
  diwali: { key: 'diwali', label: 'Shubh Deepavali', emoji: '🪔', className: 'festival-diwali', particles: ['🪔', '✦', '✧', '🌼'] },
  holi: { key: 'holi', label: 'Happy Holi', emoji: '🎨', className: 'festival-holi', particles: ['●', '●', '●', '✦'] },
  navratri: { key: 'navratri', label: 'Shubh Navratri', emoji: '🪷', className: 'festival-navratri', particles: ['✦', '✧', '❋', '✦'] },
  dussehra: { key: 'dussehra', label: 'Happy Dussehra', emoji: '🏹', className: 'festival-dussehra', particles: ['✦', '✧', '❖'] },
  raksha_bandhan: { key: 'raksha_bandhan', label: 'Happy Raksha Bandhan', emoji: '🪢', className: 'festival-raksha', particles: ['✦', '❋', '✧'] },
  ganesh_chaturthi: { key: 'ganesh_chaturthi', label: 'Ganpati Bappa Morya', emoji: '🐘', className: 'festival-ganesh', particles: ['✦', '❋', '✧'] },
  janmashtami: { key: 'janmashtami', label: 'Happy Janmashtami', emoji: '🦚', className: 'festival-janmashtami', particles: ['🪶', '✦', '✧'] },
  eid: { key: 'eid', label: 'Eid Mubarak', emoji: '☪', className: 'festival-eid', particles: ['✦', '☾', '✧'] },
  christmas: { key: 'christmas', label: 'Merry Christmas', emoji: '✦', className: 'festival-christmas', particles: ['✦', '❄', '✧'] },
  pongal: { key: 'pongal', label: 'Happy Pongal', emoji: '🌾', className: 'festival-pongal', particles: ['✦', '🌾', '✧'] },
  onam: { key: 'onam', label: 'Happy Onam', emoji: '🌸', className: 'festival-onam', particles: ['✦', '🌸', '✧'] },
};

function readTheme(payload: AnyRecord): string {
  const candidates = [payload?.data?.home, payload?.home, payload?.data, payload];
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const value = item.theme ?? item.theme_key ?? item.festival_theme ?? item.festival ?? item.layout?.theme ?? item.settings?.theme ?? item.content?.theme;
    if (typeof value === 'string' && value.trim()) return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (value && typeof value === 'object') {
      const nested = value.key ?? value.name ?? value.code;
      if (typeof nested === 'string' && nested.trim()) return nested.trim().toLowerCase().replace(/[\s-]+/g, '_');
    }
  }
  return 'default';
}

export default function FestivalTheme({ children }: Props) {
  const [themeKey, setThemeKey] = useState('default');
  useEffect(() => { let active = true; void api<AnyRecord>('/storefront/home').then((payload) => { if (active) setThemeKey(readTheme(payload)); }).catch(() => undefined); return () => { active = false; }; }, []);
  const theme = useMemo(() => {
    const aliases: Record<string, string> = { deepavali: 'diwali', holi_festival: 'holi', navratri_festival: 'navratri', ganesh: 'ganesh_chaturthi', ganeshutsav: 'ganesh_chaturthi', rakhi: 'raksha_bandhan', christmas_day: 'christmas' };
    return FESTIVALS[aliases[themeKey] || themeKey] || FESTIVALS.default;
  }, [themeKey]);
  const particles = theme.particles;
  return <div className={`festivalRoot ${theme.className}`} data-festival={theme.key}>
    {children}
    {theme.key !== 'default' && <div className="festivalAtmosphere" aria-hidden="true">
      <div className="festivalGlow festivalGlowA" /><div className="festivalGlow festivalGlowB" />
      <div className="festivalParticles">{[...particles, ...particles, ...particles].map((symbol, i) => <span key={`${symbol}-${i}`} style={{ left: `${(i * 17.3) % 108 - 4}%`, animationDelay: `${i * -0.9}s` } as CSSProperties}>{symbol}</span>)}</div>
      {theme.key === 'diwali' && <div className="diyaRow">{[0,1,2,3,4,5,6].map((i) => <span key={i}>🪔</span>)}</div>}
      {theme.key === 'holi' && <div className="holiClouds"><i /><i /><i /><i /><i /></div>}
      {theme.key === 'navratri' && <div className="rangoli" />}
    </div>}
    {theme.label && <div className="festivalGreeting" aria-label={theme.label}><span>{theme.emoji}</span>{theme.label}</div>}
  </div>;
}
