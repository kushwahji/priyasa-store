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

function normalizeKey(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
}

function readHome(payload: AnyRecord): AnyRecord | null {
  const candidates = [payload?.data?.home, payload?.home, payload?.data, payload];
  return candidates.find((item) => item && typeof item === 'object' && Array.isArray(item.sections)) || null;
}

function readTheme(payload: AnyRecord): string {
  const home = readHome(payload);
  const candidates = [home, payload?.data, payload];
  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue;
    const value = item.theme ?? item.theme_key ?? item.festival_theme ?? item.festival;
    if (typeof value === 'string' && value.trim()) return normalizeKey(value);
    if (value && typeof value === 'object') {
      const nested = value.key ?? value.name ?? value.code;
      if (typeof nested === 'string' && nested.trim()) return normalizeKey(nested);
    }
  }
  return 'default';
}

function readLayout(payload: AnyRecord): string {
  const home = readHome(payload);
  const raw = home?.layout ?? payload?.layout ?? home?.theme?.layout ?? 'default';
  if (typeof raw === 'string' && raw.trim()) return normalizeKey(raw);
  if (raw && typeof raw === 'object') return normalizeKey(raw.key ?? raw.name ?? raw.code) || 'default';
  return 'default';
}

const THEME_STYLES: Record<string, Record<string, string>> = {
  diwali: { accent: '#d88a16', deep: '#20110a', surface: '#fff7e8', glow: 'rgba(255,180,45,.32)' },
  holi: { accent: '#d62967', deep: '#281536', surface: '#fff4fa', glow: 'rgba(255,82,153,.30)' },
  navratri: { accent: '#b3266e', deep: '#25102d', surface: '#fff3f8', glow: 'rgba(224,67,139,.28)' },
  dussehra: { accent: '#b34b16', deep: '#211108', surface: '#fff5ec', glow: 'rgba(255,139,50,.28)' },
  raksha_bandhan: { accent: '#8c4ab8', deep: '#1d1127', surface: '#faf3ff', glow: 'rgba(177,104,232,.26)' },
  ganesh_chaturthi: { accent: '#c46a14', deep: '#211309', surface: '#fff7ed', glow: 'rgba(245,157,53,.28)' },
  janmashtami: { accent: '#3566b8', deep: '#0e172a', surface: '#f1f6ff', glow: 'rgba(67,126,232,.25)' },
  eid: { accent: '#17846f', deep: '#081d19', surface: '#effbf7', glow: 'rgba(45,180,151,.25)' },
  christmas: { accent: '#b52b39', deep: '#190d10', surface: '#fff4f5', glow: 'rgba(232,74,88,.24)' },
  pongal: { accent: '#a87512', deep: '#211706', surface: '#fff9e9', glow: 'rgba(230,177,56,.28)' },
  onam: { accent: '#398344', deep: '#0e1e12', surface: '#f2fbf2', glow: 'rgba(87,178,99,.25)' },
  default: { accent: '#ff3f6c', deep: '#282c3f', surface: '#f7f7f8', glow: 'rgba(255,63,108,.18)' },
};

export default function FestivalTheme({ children }: Props) {
  const [themeKey, setThemeKey] = useState('default');
  const [layoutKey, setLayoutKey] = useState('default');

  useEffect(() => {
    let active = true;
    void api<AnyRecord>('/storefront/home').then((payload) => {
      if (!active) return;
      setThemeKey(readTheme(payload));
      setLayoutKey(readLayout(payload));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const theme = useMemo(() => {
    const aliases: Record<string, string> = {
      deepavali: 'diwali', holi_festival: 'holi', navratri_festival: 'navratri',
      ganesh: 'ganesh_chaturthi', ganeshutsav: 'ganesh_chaturthi', rakhi: 'raksha_bandhan',
      christmas_day: 'christmas', eid_ul_fitr: 'eid', eid_ul_adha: 'eid',
    };
    return FESTIVALS[aliases[themeKey] || themeKey] || FESTIVALS.default;
  }, [themeKey]);

  const palette = THEME_STYLES[theme.key] || THEME_STYLES.default;
  const particles = theme.particles;
  const rootStyle = {
    '--festival-accent': palette.accent,
    '--festival-deep': palette.deep,
    '--festival-surface': palette.surface,
    '--festival-glow': palette.glow,
  } as CSSProperties;

  return <div className={`festivalRoot ${theme.className} festival-layout-${layoutKey}`} data-festival={theme.key} data-home-theme={theme.key} data-home-layout={layoutKey} style={rootStyle}>
    <style>{`
      .festivalRoot{--festival-accent:#ff3f6c;--festival-deep:#282c3f;--festival-surface:#f7f7f8;--festival-glow:rgba(255,63,108,.18);min-height:100vh}
      .festivalRoot .dynamicHero .button,.festivalRoot .dynamicBanner .button{background:var(--festival-accent)}
      .festivalRoot .dynamicHero,.festivalRoot .dynamicBanner{box-shadow:inset 0 -1px 0 rgba(0,0,0,.04)}
      .festivalRoot .dynamicServices{background:linear-gradient(90deg,var(--festival-surface),#fff,var(--festival-surface));border-bottom-color:color-mix(in srgb,var(--festival-accent) 18%,#e9e9ee)}
      .festivalRoot .sectionHead .eyebrow,.festivalRoot .textLink,.festivalRoot .productBadge{color:var(--festival-accent)}
      .festivalRoot .festivalAtmosphere{position:fixed;inset:0;pointer-events:none;z-index:2;overflow:hidden}
      .festivalRoot .festivalGlow{position:absolute;width:42vw;height:42vw;border-radius:50%;background:var(--festival-glow);filter:blur(70px);opacity:.55}
      .festivalRoot .festivalGlowA{top:-20vw;right:-12vw}.festivalRoot .festivalGlowB{bottom:-24vw;left:-15vw}
      .festivalRoot .festivalParticles{position:absolute;inset:0;overflow:hidden}.festivalRoot .festivalParticles span{position:absolute;top:-8%;font-size:14px;opacity:.18;animation:priyasaFestivalFloat 12s linear infinite}
      .festivalRoot .diyaRow{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;font-size:18px;opacity:.18;padding-bottom:6px}
      .festivalRoot .holiClouds{position:absolute;inset:0;opacity:.12}.festivalRoot .holiClouds i{position:absolute;width:110px;height:110px;border-radius:50%;background:var(--festival-accent);filter:blur(18px)}.festivalRoot .holiClouds i:nth-child(1){left:5%;top:20%}.festivalRoot .holiClouds i:nth-child(2){left:28%;top:62%}.festivalRoot .holiClouds i:nth-child(3){left:55%;top:18%}.festivalRoot .holiClouds i:nth-child(4){right:8%;top:48%}.festivalRoot .holiClouds i:nth-child(5){right:35%;bottom:5%}
      .festivalRoot .rangoli{position:absolute;left:50%;bottom:-160px;width:360px;height:360px;border:2px solid var(--festival-accent);border-radius:50%;transform:translateX(-50%) rotate(45deg);opacity:.12;box-shadow:0 0 0 18px transparent,0 0 0 20px var(--festival-accent)}
      .festivalRoot .festivalGreeting{position:fixed;right:16px;bottom:84px;z-index:250;background:var(--festival-deep);color:#fff;border-radius:999px;padding:8px 13px;font-size:10px;font-weight:700;letter-spacing:.4px;box-shadow:0 10px 28px rgba(0,0,0,.18);animation:priyasaGreetingIn .5s ease-out}
      .festivalRoot .festivalGreeting span{margin-right:6px}
      @keyframes priyasaFestivalFloat{0%{transform:translate3d(0,-5vh,0) rotate(0deg)}100%{transform:translate3d(12px,108vh,0) rotate(160deg)}}
      @keyframes priyasaGreetingIn{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
      @media(max-width:700px){.festivalRoot .festivalGreeting{right:10px;bottom:76px;font-size:9px}.festivalRoot .festivalParticles span{font-size:11px}.festivalRoot .rangoli{width:240px;height:240px;bottom:-120px}}
      @media(prefers-reduced-motion:reduce){.festivalRoot .festivalParticles span,.festivalRoot .festivalGreeting{animation:none}}
    `}</style>
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
