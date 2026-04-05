'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si ya tiene sesión, redirigir según rol
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role;
      if (role === 'BARBER') router.replace('/barber/dashboard');
      else router.replace('/barbershop');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C9A84C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #080808; font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background: #080808;
        }
        .login-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 90%, rgba(201,168,76,0.04) 0%, transparent 50%);
        }
        .login-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 20%, transparent 75%);
        }
        .login-card {
          position: relative;
          z-index: 1;
          background: #111111;
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 24px;
          padding: 56px 48px;
          width: 100%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.05);
        }
        .logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #E8C96A, #8B6914);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: 0 0 24px rgba(201,168,76,0.3);
        }
        .logo-text { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #F5F0E8; }
        .logo-text span { color: #C9A84C; }
        .divider { width: 40px; height: 1px; background: linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent); margin: 0 auto 32px; }
        .login-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #F5F0E8; letter-spacing: -0.5px; margin-bottom: 10px; line-height: 1.2; }
        .login-sub { font-size: 14px; color: rgba(245,240,232,0.4); font-weight: 300; line-height: 1.6; margin-bottom: 40px; }
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #F5F0E8;
          color: #1a1a1a;
          border: none;
          border-radius: 12px;
          padding: 15px 24px;
          font-size: 15px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .google-btn:hover { background: #ffffff; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,0.4); }
        .google-icon { width: 20px; height: 20px; flex-shrink: 0; }
        .footer-note { margin-top: 28px; font-size: 12px; color: rgba(245,240,232,0.2); line-height: 1.6; }
        .footer-note a { color: rgba(201,168,76,0.5); text-decoration: none; }
        .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(245,240,232,0.3); text-decoration: none; margin-top: 24px; transition: color 0.2s; }
        .back-link:hover { color: rgba(201,168,76,0.7); }
      `}</style>

      <div className="login-bg">
        <div className="login-card">
          <div className="logo-wrap">
            <div className="logo-icon">✂️</div>
            <span className="logo-text">Barber<span>Booking</span></span>
          </div>
          <div className="divider" />
          <h1 className="login-title">Bienvenido de vuelta</h1>
          <p className="login-sub">
            Inicia sesión para gestionar tu barbería<br />o acceder a tu panel de trabajo
          </p>

          {/* ✅ callbackUrl siempre apunta a / para evitar loops */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="google-btn"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p className="footer-note">
            Al continuar aceptas nuestros{' '}
            <a href="#">Términos de servicio</a>{' '}
            y <a href="#">Política de privacidad</a>
          </p>
          <a href="/" className="back-link">← Volver al inicio</a>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #C9A84C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}