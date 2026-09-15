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
function normalizeKey(value: unknown): string { return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s-]+/g, '_') : ''; }
function readHome(payload: AnyRecord): AnyRecord | null { const candidates = [payload?.data, payload?.data?.home, payload?.home, payload]; return candidates.find((item) => item && typeof item === 'object' && (item.theme || Array.isArray(item.sections))) || null; }
function readTheme(home: AnyRecord | null): AnyRecord { const value = home?.theme; if (value && typeof value === 'object') return value; if (typeof value === 'string') return { key: value }; return { key: home?.theme_key || home?.festival_theme || home?.festival || 'default' }; }
const ALIASES: Record<string, string> = { deepavali: 'diwali', holi_festival: 'holi', navratri_festival: 'navratri', ganesh: 'ganesh_chaturthi', ganeshutsav: 'ganesh_chaturthi', rakhi: 'raksha_bandhan', christmas_day: 'christmas', eid_ul_fitr: 'eid', eid_ul_adha: 'eid' };
const FESTIVAL_PALETTES: Record<string, { accent: string; deep: string; surface: string; glow: string }> = {
  diwali: { accent: '#d88a16', deep: '#241106', surface: '#fff6e5', glow: 'rgba(255,176,35,.32)' }, holi: { accent: '#d62967', deep: '#29143a', surface: '#fff1f8', glow: 'rgba(255,65,145,.30)' }, navratri: { accent: '#a7256d', deep: '#25102d', surface: '#fff0f7', glow: 'rgba(226,62,141,.28)' }, dussehra: { accent: '#b34b16', deep: '#211108', surface: '#fff3e7', glow: 'rgba(255,139,50,.28)' }, raksha_bandhan: { accent: '#8c4ab8', deep: '#1d1127', surface: '#faf2ff', glow: 'rgba(177,104,232,.26)' }, ganesh_chaturthi: { accent: '#c46a14', deep: '#211309', surface: '#fff5e9', glow: 'rgba(245,157,53,.28)' }, janmashtami: { accent: '#3566b8', deep: '#0e172a', surface: '#f0f5ff', glow: 'rgba(67,126,232,.25)' }, eid: { accent: '#17846f', deep: '#081d19', surface: '#effbf7', glow: 'rgba(45,180,151,.25)' }, christmas: { accent: '#b52b39', deep: '#190d10', surface: '#fff3f4', glow: 'rgba(232,74,88,.24)' }, pongal: { accent: '#a87512', deep: '#211706', surface: '#fff8e7', glow: 'rgba(230,177,56,.28)' }, onam: { accent: '#398344', deep: '#0e1e12', surface: '#f2fbf2', glow: 'rgba(87,178,99,.25)' }, default: { accent: '#D4AF37', deep: '#171717', surface: '#f7f7f7', glow: 'rgba(212,175,55,.18)' },
};

export default function FestivalTheme({ children }: Props) {
  const [themeData, setThemeData] = useState<AnyRecord>({ key: 'default' });
  useEffect(() => { let active = true; void api<AnyRecord>('/storefront/home').then((payload) => { if (active) setThemeData(readTheme(readHome(payload))); }).catch(() => undefined); return () => { active = false; }; }, []);
  const themeKey = ALIASES[normalizeKey(themeData.key || themeData.name)] || normalizeKey(themeData.key || themeData.name) || 'default';
  const festival = FESTIVALS[themeKey] || FESTIVALS.default;
  const palette = FESTIVAL_PALETTES[themeKey] || FESTIVAL_PALETTES.default;
  const tokens = themeData.tokens || {};
  const colors = tokens.colors || {};
  const rootStyle = { '--festival-accent': colors.accent || palette.accent, '--festival-primary': colors.primary || '#171717', '--festival-deep': palette.deep, '--festival-surface': colors.surface_alt || palette.surface, '--festival-glow': palette.glow, '--festival-radius': `${tokens.radius?.lg || 16}px` } as CSSProperties;
  const decorationEnabled = themeData.decorations?.enabled !== false || festival.key !== 'default';
  const intensity = themeData.decorations?.intensity || (festival.key === 'default' ? 'none' : 'medium');
  const particleCount = intensity === 'high' ? 28 : intensity === 'low' ? 10 : 18;
  const particles = festival.particles;
  const customType = normalizeKey(themeData.decorations?.type);
  const atmosphereClass = `festivalAtmosphere intensity-${intensity} decoration-${customType || festival.key}`;

  return <div className={`festivalRoot ${festival.className}`} data-festival={festival.key} data-home-theme={themeKey} data-theme-type={themeData.type || 'default'} style={rootStyle}>
    <style>{`
      .festivalRoot{--festival-accent:#D4AF37;--festival-primary:#171717;--festival-deep:#171717;--festival-surface:#f7f7f7;--festival-glow:rgba(212,175,55,.18);min-height:100vh;background:var(--festival-surface);color:var(--festival-primary)}
      .festivalRoot .dynamicHome{font-family:Inter,system-ui,sans-serif;background:var(--festival-surface);color:var(--festival-primary)}
      .festivalRoot .dynamicHero .button,.festivalRoot .dynamicBanner .button{background:var(--festival-accent)}
      .festivalRoot .sectionHead .eyebrow,.festivalRoot .textLink,.festivalRoot .productBadge{color:var(--festival-accent)}
      .festivalRoot .dynamicServices{background:linear-gradient(90deg,var(--festival-surface),#fff,var(--festival-surface));border-bottom-color:color-mix(in srgb,var(--festival-accent) 18%,#e9e9ee)}
      .festivalRoot .festivalAtmosphere{position:fixed;inset:0;pointer-events:none;z-index:2;overflow:hidden}.festivalRoot .festivalGlow{position:absolute;width:42vw;height:42vw;border-radius:50%;background:var(--festival-glow);filter:blur(70px);opacity:.55}.festivalRoot .festivalGlowA{top:-20vw;right:-12vw}.festivalRoot .festivalGlowB{bottom:-24vw;left:-15vw}
      .festivalRoot .festivalParticles{position:absolute;inset:0;overflow:hidden}.festivalRoot .festivalParticles span{position:absolute;top:-8%;font-size:14px;opacity:.20;animation:priyasaFestivalFloat 12s linear infinite}.festivalRoot .festivalRootHigh{}
      .festivalRoot .diyaRow{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;font-size:20px;opacity:.28;padding-bottom:6px}.festivalRoot .holiClouds{position:absolute;inset:0;opacity:.14}.festivalRoot .holiClouds i{position:absolute;width:120px;height:120px;border-radius:50%;background:var(--festival-accent);filter:blur(18px)}.festivalRoot .holiClouds i:nth-child(1){left:5%;top:20%}.festivalRoot .holiClouds i:nth-child(2){left:28%;top:62%}.festivalRoot .holiClouds i:nth-child(3){left:55%;top:18%}.festivalRoot .holiClouds i:nth-child(4){right:8%;top:48%}.festivalRoot .holiClouds i:nth-child(5){right:35%;bottom:5%}
      .festivalRoot .rangoli{position:absolute;left:50%;bottom:-160px;width:360px;height:360px;border:2px solid var(--festival-accent);border-radius:50%;transform:translateX(-50%) rotate(45deg);opacity:.12;box-shadow:0 0 0 18px transparent,0 0 0 20px var(--festival-accent)}
      .festivalRoot .eidCrescent{position:absolute;right:8%;top:10%;font-size:90px;opacity:.12}.festivalRoot .christmasStars{position:absolute;inset:0;background-image:radial-gradient(circle at 20% 25%,var(--festival-accent) 0 1px,transparent 2px),radial-gradient(circle at 70% 40%,var(--festival-accent) 0 1px,transparent 2px),radial-gradient(circle at 45% 75%,var(--festival-accent) 0 1px,transparent 2px);opacity:.28}
      .festivalRoot .festivalGreeting{position:fixed;right:16px;bottom:84px;z-index:250;background:var(--festival-deep);color:#fff;border-radius:999px;padding:8px 13px;font-size:10px;font-weight:700;letter-spacing:.4px;box-shadow:0 10px 28px rgba(0,0,0,.18);animation:priyasaGreetingIn .5s ease-out}.festivalRoot .festivalGreeting span{margin-right:6px}
      @keyframes priyasaFestivalFloat{0%{transform:translate3d(0,-5vh,0) rotate(0deg)}100%{transform:translate3d(12px,108vh,0) rotate(160deg)}}@keyframes priyasaGreetingIn{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
      @media(max-width:700px){.festivalRoot .festivalGreeting{right:10px;bottom:76px;font-size:9px}.festivalRoot .festivalParticles span{font-size:11px}.festivalRoot .rangoli{width:240px;height:240px;bottom:-120px}.festivalRoot .eidCrescent{font-size:58px}}
      @media(prefers-reduced-motion:reduce){.festivalRoot .festivalParticles span,.festivalRoot .festivalGreeting{animation:none}}
    `}</style>
    {children}
    {decorationEnabled && festival.key !== 'default' && <div className={atmosphereClass} aria-hidden="true"><div className="festivalGlow festivalGlowA"/><div className="festivalGlow festivalGlowB"/><div className="festivalParticles">{Array.from({ length: particleCount }, (_, i) => <span key={i} style={{ left: `${(i * 17.3) % 108 - 4}%`, animationDelay: `${i * -0.7}s` } as CSSProperties}>{particles[i % particles.length]}</span>)}</div>{festival.key === 'diwali' && <div className="diyaRow">{[0,1,2,3,4,5,6].map((i) => <span key={i}>🪔</span>)}</div>}{festival.key === 'holi' && <div className="holiClouds"><i/><i/><i/><i/><i/></div>}{festival.key === 'navratri' && <div className="rangoli"/>}{festival.key === 'eid' && <div className="eidCrescent">☾</div>}{festival.key === 'christmas' && <div className="christmasStars"/>}</div>}
    {festival.label && <div className="festivalGreeting" aria-label={festival.label}><span>{festival.emoji}</span>{festival.label}</div>}
  </div>;
}
