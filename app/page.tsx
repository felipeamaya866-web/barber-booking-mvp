// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type IconName = 'briefcase' | 'scissors' | 'calendar' | 'users' | 'globe' | 'chart' | 'lock' | 'mobile';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  briefcase: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />,
  scissors: (
    <>
      <circle cx="6" cy="6.5" r="2.4" />
      <circle cx="6" cy="17.5" r="2.4" />
      <path strokeLinecap="round" d="M8.3 8 19.5 19.5M8.3 16 19.5 4.5" />
    </>
  ),
  calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />,
  globe: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c1.657 0 3-4.03 3-9s-1.343-9-3-9-3 4.03-3 9 1.343 9 3 9Zm-9-9h18" />,
  chart: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />,
  lock: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />,
  mobile: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3M9 18h6" />,
};

function Icon({ name, size = 28 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {ICON_PATHS[name]}
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [slug, setSlug] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  // ✅ Redirigir según rol si ya tiene sesión
  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role === 'BARBER') router.replace('/barber/dashboard');
      else router.replace('/barbershop');
    }
  }, [status, session, router]);

  // ✅ Observer con delay para que el DOM esté listo
  useEffect(() => {
    if (status === 'authenticated' || status === 'loading') return;
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
          });
        },
        { threshold: 0.1 }
      );
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }, 150);
    return () => clearTimeout(timer);
  }, [status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (slug.trim()) router.push(`/buscar?q=${encodeURIComponent(slug.trim())}`);
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C9A84C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --gold: #C9A84C; --gold-lt: #E8C96A; --gold-dk: #8B6914;
          --black: #080808; --gray-1: #111111; --gray-2: #1A1A1A;
          --gray-3: #2A2A2A; --gray-4: #555555; --white: #F5F0E8;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--black); color: var(--white); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        @keyframes scrollPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

        body::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9999; opacity: 0.4;
        }

        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to bottom, rgba(8,8,8,0.95), transparent); backdrop-filter: blur(8px); }
        .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon { width: 42px; height: 42px; background: var(--black); border: 1px solid rgba(201,168,76,0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 0 20px rgba(201,168,76,0.2); }
        .logo-icon img { width: 100%; height: 100%; object-fit: cover; }
        .logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--white); }
        .logo-text span { color: var(--gold); }
        .nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
        .nav-links a { color: rgba(245,240,232,0.6); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .nav-links a:hover { color: var(--white); }
        .nav-cta { background: linear-gradient(135deg, var(--gold), var(--gold-dk)); color: var(--black) !important; padding: 10px 24px !important; border-radius: 8px; font-weight: 500 !important; }

        .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 120px 24px 80px; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(201,168,76,0.05) 0%, transparent 50%); }
        .hero-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%); }
        .hero-content { position: relative; text-align: center; max-width: 820px; }
        .hero-mark { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 28px; animation: fadeDown 0.7s ease both; }
        .hero-mark-icon { width: 52px; height: 52px; border-radius: 14px; overflow: hidden; border: 1px solid rgba(201,168,76,0.35); box-shadow: 0 0 32px rgba(201,168,76,0.25); background: var(--black); flex-shrink: 0; }
        .hero-mark-icon img { width: 100%; height: 100%; object-fit: cover; }
        .hero-mark-text { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--white); letter-spacing: -0.5px; }
        .hero-mark-text span { color: var(--gold); }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.25); padding: 6px 16px; border-radius: 999px; font-size: 12px; color: var(--gold); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 32px; animation: fadeDown 0.8s 0.1s ease both; }
        .hero-title { font-size: clamp(48px, 8vw, 96px); font-weight: 900; line-height: 1.0; letter-spacing: -2px; margin-bottom: 24px; animation: fadeUp 0.8s 0.1s ease both; }
        .hero-title .gold { color: var(--gold); }
        .hero-title .outline { -webkit-text-stroke: 1px rgba(245,240,232,0.3); color: transparent; }
        .hero-sub { font-size: 18px; color: rgba(245,240,232,0.55); font-weight: 300; max-width: 520px; margin: 0 auto 48px; line-height: 1.7; animation: fadeUp 0.8s 0.2s ease both; }
        .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; animation: fadeUp 0.8s 0.3s ease both; }
        .hero-scroll { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; opacity: 0.4; animation: fadeUp 1s 0.8s ease both; }
        .scroll-line { width: 1px; height: 48px; background: linear-gradient(to bottom, transparent, var(--gold)); animation: scrollPulse 2s infinite; }

        .btn-primary { background: linear-gradient(135deg, var(--gold-lt), var(--gold-dk)); color: var(--black); padding: 16px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 8px 32px rgba(201,168,76,0.25); border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; display: inline-block; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,168,76,0.35); }
        .btn-secondary { background: transparent; color: var(--white); padding: 16px 36px; border-radius: 10px; font-weight: 400; font-size: 15px; text-decoration: none; border: 1px solid rgba(245,240,232,0.15); transition: border-color 0.2s, background 0.2s; cursor: pointer; font-family: 'DM Sans', sans-serif; display: inline-block; }
        .btn-secondary:hover { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.05); }

        .stats { padding: 60px 48px; border-top: 1px solid rgba(201,168,76,0.1); border-bottom: 1px solid rgba(201,168,76,0.1); display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat { text-align: center; padding: 24px; border-right: 1px solid rgba(201,168,76,0.1); }
        .stat:last-child { border-right: none; }
        .stat-number { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: var(--gold); line-height: 1; margin-bottom: 8px; }
        .stat-label { font-size: 13px; color: rgba(245,240,232,0.45); }

        section { padding: 100px 48px; max-width: 1200px; margin: 0 auto; }
        .section-tag { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; display: block; }
        .section-title { font-size: clamp(32px, 4vw, 52px); font-weight: 700; line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px; }
        .section-sub { font-size: 16px; color: rgba(245,240,232,0.5); font-weight: 300; line-height: 1.7; max-width: 480px; }

        .paths { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 64px; }
        .path-card { background: var(--gray-1); border: 1px solid var(--gray-3); border-radius: 20px; padding: 48px; position: relative; overflow: hidden; transition: border-color 0.3s, transform 0.3s; text-decoration: none; display: block; }
        .path-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at top left, rgba(201,168,76,0.08), transparent 60%); opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .path-card:hover { border-color: rgba(201,168,76,0.4); transform: translateY(-4px); }
        .path-card:hover::before { opacity: 1; }
        .path-icon { width: 64px; height: 64px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--gold); margin-bottom: 28px; }
        .path-title { font-size: 28px; font-weight: 700; margin-bottom: 12px; color: var(--white); }
        .path-desc { font-size: 15px; color: rgba(245,240,232,0.5); line-height: 1.6; margin-bottom: 32px; }
        .path-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
        .path-features li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(245,240,232,0.7); }
        .path-features li::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }
        .path-cta { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: var(--gold); }

        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 64px; background: var(--gray-3); border-radius: 20px; overflow: hidden; }
        .feature { background: var(--gray-1); padding: 40px 36px; transition: background 0.2s; }
        .feature:hover { background: var(--gray-2); }
        .feature-icon { width: 48px; height: 48px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--gold); margin-bottom: 20px; }
        .feature-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: var(--white); font-family: 'Playfair Display', serif; }
        .feature-desc { font-size: 14px; color: rgba(245,240,232,0.45); line-height: 1.6; }

        .steps { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 64px; position: relative; }
        .steps::before { content: ''; position: absolute; top: 28px; left: 12.5%; right: 12.5%; height: 1px; background: linear-gradient(to right, transparent, var(--gold-dk), var(--gold), var(--gold-dk), transparent); }
        .step { text-align: center; padding: 0 24px; }
        .step-num { width: 56px; height: 56px; background: var(--black); border: 1px solid rgba(201,168,76,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--gold); margin: 0 auto 24px; position: relative; z-index: 1; }
        .step-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: var(--white); }
        .step-desc { font-size: 13px; color: rgba(245,240,232,0.4); line-height: 1.6; }

        .cta-section { padding: 100px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 80% at 50% 50%, rgba(201,168,76,0.07), transparent 70%); }
        .cta-box { position: relative; max-width: 680px; margin: 0 auto; background: var(--gray-1); border: 1px solid rgba(201,168,76,0.2); border-radius: 28px; padding: 72px 56px; }
        .cta-title { font-size: clamp(32px, 4vw, 52px); font-weight: 900; letter-spacing: -1.5px; margin-bottom: 16px; line-height: 1.1; }
        .cta-sub { font-size: 16px; color: rgba(245,240,232,0.5); margin-bottom: 40px; line-height: 1.6; }

        .plans-section { background: var(--gray-1); border-top: 1px solid var(--gray-3); border-bottom: 1px solid var(--gray-3); }
        .plans-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 56px; }
        .plan-card { background: var(--black); border: 1px solid var(--gray-3); border-radius: 20px; padding: 40px 32px; position: relative; display: flex; flex-direction: column; transition: border-color 0.3s, transform 0.3s; }
        .plan-card:hover { transform: translateY(-4px); border-color: rgba(201,168,76,0.35); }
        .plan-card.featured { border-color: var(--gold); box-shadow: 0 8px 40px rgba(201,168,76,0.12); }
        .plan-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--gold); color: var(--black); font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 999px; white-space: nowrap; }
        .plan-tagline { font-size: 13px; color: var(--gold); margin-bottom: 12px; }
        .plan-name { font-size: 24px; font-weight: 700; color: var(--white); margin-bottom: 8px; font-family: 'Playfair Display', serif; }
        .plan-price { font-size: 36px; font-weight: 900; color: var(--white); margin-bottom: 4px; }
        .plan-price span { font-size: 14px; font-weight: 400; color: rgba(245,240,232,0.4); }
        .plan-perks { list-style: none; margin: 24px 0 28px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .plan-perks li { font-size: 14px; color: rgba(245,240,232,0.65); display: flex; gap: 8px; align-items: flex-start; }
        .plan-perks li::before { content: '✓'; color: var(--gold); flex-shrink: 0; font-weight: 700; }
        .plan-cta { text-align: center; padding: 14px; border-radius: 10px; font-weight: 600; font-size: 14px; text-decoration: none; transition: all 0.2s; }
        .plan-cta.primary { background: linear-gradient(135deg, var(--gold-lt), var(--gold-dk)); color: var(--black); }
        .plan-cta.secondary { background: transparent; border: 1px solid rgba(245,240,232,0.15); color: var(--white); }
        .plan-cta.secondary:hover { border-color: rgba(201,168,76,0.4); }
        .plans-trust { text-align: center; margin-top: 48px; font-size: 13px; color: rgba(245,240,232,0.4); }

        footer { border-top: 1px solid var(--gray-3); padding: 48px 48px 32px; display: flex; flex-direction: column; gap: 28px; }
        .footer-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
        .footer-links { display: flex; gap: 22px; list-style: none; flex-wrap: wrap; }
        .footer-links a { font-size: 13px; color: rgba(245,240,232,0.45); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--gold); }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--gray-3); padding-top: 20px; }
        .footer-legal { font-size: 12px; color: rgba(245,240,232,0.3); line-height: 1.6; }
        .footer-trust { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(245,240,232,0.35); }

        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }

        @media (max-width: 768px) {
          nav { padding: 16px 20px; }
          .nav-links { display: none; }
          section { padding: 72px 20px; }
          .stats { grid-template-columns: repeat(2, 1fr); padding: 40px 20px; }
          .stat { border-right: none; border-bottom: 1px solid rgba(201,168,76,0.1); }
          .paths { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .steps::before { display: none; }
          .cta-box { padding: 48px 28px; }
          .plans-grid { grid-template-columns: 1fr; }
          footer { padding: 32px 20px; }
          .footer-top { flex-direction: column; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav>
        <a href="#" className="logo">
          <div className="logo-icon"><img src="/logo-icon-square.png" alt="BarberBooking" /></div>
          <span className="logo-text">Barber<span>Booking</span></span>
        </a>
        <ul className="nav-links">
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#caracteristicas">Características</a></li>
          <li><a href="#planes">Planes</a></li>
          <li><a href="#para-ti">Para ti</a></li>
          <li><a href="/login" className="nav-cta">Iniciar sesión</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <div className="hero" ref={heroRef}>
        <div className="hero-bg" />
        <div className="hero-lines" />
        <div className="hero-content">
          <div className="hero-mark reveal">
            <div className="hero-mark-icon"><img src="/logo-icon-square.png" alt="BarberBooking" /></div>
            <span className="hero-mark-text">Barber<span>Booking</span></span>
          </div>
          <div className="hero-badge">✦ La plataforma de barberías #1 en Colombia</div>
          <h1 className="hero-title">
            El futuro de las<br />
            <span className="gold">barberías</span>{' '}
            <span className="outline">modernas</span>
          </h1>
          <p className="hero-sub">Gestiona tu barbería, recibe reservas 24/7 y haz crecer tu negocio con la plataforma más completa del mercado.</p>
          <div className="hero-actions">
            <a href="/login" className="btn-primary">Registra tu barbería →</a>
            <a href="#para-ti" className="btn-secondary">Reservar una cita</a>
          </div>
        </div>
        <div className="hero-scroll"><div className="scroll-line" /></div>
      </div>

      {/* STATS */}
      <div className="stats reveal">
        {[
          { number: '500+', label: 'Barberías activas' },
          { number: '12K+', label: 'Citas al mes' },
          { number: '98%',  label: 'Clientes satisfechos' },
          { number: '24/7', label: 'Reservas online' },
        ].map(s => (
          <div key={s.label} className="stat">
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* PARA TI */}
      <section id="para-ti">
        <span className="section-tag reveal">¿Quién eres?</span>
        <h2 className="section-title reveal">Diseñado para<br />cada parte del negocio</h2>
        <p className="section-sub reveal">Tanto si eres dueño de una barbería como si buscas el mejor corte, BarberBooking tiene lo que necesitas.</p>
        <div className="paths">
          <a href="/login" className="path-card reveal">
            <div className="path-icon"><Icon name="briefcase" size={30} /></div>
            <h3 className="path-title">Soy dueño de barbería</h3>
            <p className="path-desc">Administra tu negocio, gestiona tu equipo y recibe reservas desde cualquier lugar.</p>
            <ul className="path-features">
              <li>Agenda semanal en tiempo real</li>
              <li>Gestión de barberos y horarios</li>
              <li>Estadísticas e ingresos</li>
              <li>Página pública personalizable</li>
              <li>Planes desde gratis</li>
            </ul>
            <span className="path-cta">Crear mi barbería →</span>
          </a>
          <div className="path-card reveal reveal-delay-1" style={{ cursor: 'default' }}>
            <div className="path-icon"><Icon name="scissors" size={30} /></div>
            <h3 className="path-title">Busco una barbería</h3>
            <p className="path-desc">Encuentra las mejores barberías cerca de ti y reserva en segundos.</p>
            <ul className="path-features">
              <li>Barberías cerca de tu ubicación</li>
              <li>Reserva sin crear cuenta</li>
              <li>Elige tu barbero y servicio</li>
              <li>Confirmación inmediata</li>
              <li>Sin filas ni esperas</li>
            </ul>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Ej: piplex, barberking..."
                style={{ flex: 1, minWidth: 160, background: 'var(--gray-2)', border: '1px solid var(--gray-3)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.5)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--gray-3)'; }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>Buscar →</button>
            </form>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS */}
      <section id="caracteristicas">
        <span className="section-tag reveal">Plataforma completa</span>
        <h2 className="section-title reveal">Todo lo que tu barbería<br />necesita para crecer</h2>
        <div className="features-grid reveal">
          {([
            { icon: 'calendar', title: 'Agenda inteligente',  desc: 'Vista semanal con todas las citas, filtros por barbero y gestión de estados en tiempo real.' },
            { icon: 'users',    title: 'Gestión de equipo',   desc: 'Agrega barberos, configura sus horarios, descansos y controla su acceso al sistema.' },
            { icon: 'globe',    title: 'Página pública',       desc: 'Cada barbería tiene su propia landing page personalizable con colores, fotos y servicios.' },
            { icon: 'chart',    title: 'Estadísticas',         desc: 'Ingresos, citas por mes, servicios más vendidos y tasa de cancelaciones en un solo lugar.' },
            { icon: 'lock',     title: 'Roles y permisos',     desc: 'El dueño controla qué puede ver cada barbero. Privacidad total de los datos del negocio.' },
            { icon: 'mobile',   title: 'Reservas 24/7',        desc: 'Los clientes reservan desde cualquier dispositivo, sin llamadas ni mensajes de WhatsApp.' },
          ] as { icon: IconName; title: string; desc: string }[]).map((f, i) => (
            <div key={f.title} className={`feature reveal reveal-delay-${(i % 3) + 1}`}>
              <span className="feature-icon"><Icon name={f.icon} size={26} /></span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" style={{ background: 'var(--gray-1)', maxWidth: '100%', borderTop: '1px solid var(--gray-3)', borderBottom: '1px solid var(--gray-3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <span className="section-tag reveal" style={{ textAlign: 'center', display: 'block' }}>Simple y rápido</span>
          <h2 className="section-title reveal" style={{ textAlign: 'center', maxWidth: '100%' }}>En 4 pasos tienes<br />tu barbería online</h2>
          <div className="steps reveal">
            {[
              { n: '1', title: 'Crea tu cuenta',        desc: 'Regístrate con Google en menos de 1 minuto. Sin tarjeta requerida.' },
              { n: '2', title: 'Configura tu barbería', desc: 'Agrega tus servicios, fotos, colores y la información de tu negocio.' },
              { n: '3', title: 'Invita a tu equipo',    desc: 'Genera links de invitación para cada barbero y aprueba su acceso.' },
              { n: '4', title: 'Recibe reservas',       desc: 'Comparte tu página pública y empieza a recibir citas al instante.' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <h4 className="step-title">{s.title}</h4>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="plans-section" style={{ maxWidth: '100%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <span className="section-tag reveal" style={{ textAlign: 'center', display: 'block' }}>Planes flexibles</span>
          <h2 className="section-title reveal" style={{ textAlign: 'center', maxWidth: '100%' }}>
            Un plan que crece<br />con tu barbería
          </h2>
          <p className="section-sub reveal" style={{ textAlign: 'center', margin: '0 auto' }}>
            Empieza gratis 14 días, sin que se haga ningún cobro. Cancela cuando quieras, sin contratos ni letra pequeña.
          </p>

          <div className="plans-grid">
            <div className="plan-card reveal">
              <span className="plan-tagline">Para empezar con todo</span>
              <h3 className="plan-name">Lite</h3>
              <div className="plan-price">$29.900<span>/mes</span></div>
              <ul className="plan-perks">
                <li>1 barbero</li>
                <li>10 fotos en galería</li>
                <li>Agenda y reservas 24/7</li>
                <li>Página pública personalizable</li>
                <li>Soporte por WhatsApp</li>
              </ul>
              <a href="/login" className="plan-cta secondary">Empezar gratis →</a>
            </div>

            <div className="plan-card featured reveal reveal-delay-1">
              <span className="plan-badge">⭐ Más elegido</span>
              <span className="plan-tagline">Para barberías en crecimiento</span>
              <h3 className="plan-name">Prime</h3>
              <div className="plan-price">$49.900<span>/mes</span></div>
              <ul className="plan-perks">
                <li>2 a 3 barberos</li>
                <li>20 fotos en galería</li>
                <li>Todo lo de Lite</li>
                <li>Estadísticas de tu negocio</li>
                <li>Gestión de equipo y horarios</li>
              </ul>
              <a href="/login" className="plan-cta primary">Empezar gratis →</a>
            </div>

            <div className="plan-card reveal reveal-delay-2">
              <span className="plan-tagline">Para equipos grandes</span>
              <h3 className="plan-name">Elite</h3>
              <div className="plan-price">$79.900<span>/mes</span></div>
              <ul className="plan-perks">
                <li>Barberos ilimitados</li>
                <li>40 fotos en galería</li>
                <li>Todo lo de Prime</li>
                <li>Ideal para varias sedes o franquicias</li>
                <li>Soporte prioritario</li>
              </ul>
              <a href="/login" className="plan-cta secondary">Empezar gratis →</a>
            </div>
          </div>

          <p className="plans-trust reveal">
            🔒 Pagos procesados de forma segura por <strong style={{ color: 'var(--white)' }}>Wompi</strong>
            {' '}· Nunca almacenamos los datos de tu tarjeta · 14 días gratis, cancela cuando quieras
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <div className="cta-section">
        <div className="cta-bg" />
        <div className="cta-box reveal">
          <h2 className="cta-title">Tu barbería merece<br /><span style={{ color: 'var(--gold)' }}>más que una agenda</span></h2>
          <p className="cta-sub">Únete a cientos de barberías que ya gestionan su negocio con BarberBooking.</p>
          <a href="/login" className="btn-primary">Crear mi barbería gratis →</a>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div className="logo-icon" style={{ width: 32, height: 32 }}><img src="/logo-icon-square.png" alt="BarberBooking" /></div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: 'var(--white)' }}>
                Barber<span style={{ color: 'var(--gold)' }}>Booking</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.4)', maxWidth: 280, lineHeight: 1.6, marginBottom: 16 }}>
              La plataforma para gestionar tu barbería y recibir reservas online, sin complicaciones.
            </p>
            <a href="/login" className="btn-secondary" style={{ padding: '10px 22px', fontSize: 13 }}>
              Crear mi barbería →
            </a>
          </div>

          <ul className="footer-links">
            <li><a href="#planes">Planes y precios</a></li>
            <li><a href="/terminos">Términos</a></li>
            <li><a href="/privacidad">Privacidad</a></li>
            <li><a href="/cookies">Cookies</a></li>
            <li><a href="/contacto">Contacto</a></li>
            <li><a href="/login">Iniciar sesión</a></li>
          </ul>
        </div>

        <div className="footer-bottom">
          <p className="footer-legal">
            © {new Date().getFullYear()} BarberBooking. Todos los derechos reservados.
          </p>
          <div className="footer-trust">
            🔒 Pagos procesados de forma segura por <strong style={{ color: 'rgba(245,240,232,0.5)' }}>Wompi</strong>
          </div>
        </div>
      </footer>
    </>
  );
}