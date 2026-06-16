// app/contacto/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

const SUPPORT_EMAIL = 'barber.boking@gmail.com';

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [copiado, setCopiado] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(form.asunto || 'Soporte BarberBooking');
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\nCorreo: ${form.email}\n\nMensaje:\n${form.mensaje}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function copiarCorreo() {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #080808; color: #F5F0E8; font-family: 'DM Sans', sans-serif; }
        h1, h2 { font-family: 'Playfair Display', serif; }
      `}</style>

      <div style={{ minHeight: '100vh', padding: '64px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          <Link href="/" style={{ color: 'rgba(245,240,232,0.5)', textDecoration: 'none', fontSize: 14 }}>← Volver al inicio</Link>

          <h1 style={{ fontSize: 'clamp(32px,5vw,44px)', fontWeight: 900, marginTop: 24, marginBottom: 12 }}>
            Contáct<span style={{ color: '#C9A84C' }}>anos</span>
          </h1>
          <p style={{ color: 'rgba(245,240,232,0.55)', fontWeight: 300, marginBottom: 40, lineHeight: 1.6 }}>
            ¿Tienes una duda, un problema técnico o necesitas soporte con tu barbería?
            Escríbenos directamente o usa el formulario.
          </p>

          {/* Correo directo */}
          <div style={{
            background: '#111111', border: '1px solid #2A2A2A', borderRadius: 16,
            padding: 24, marginBottom: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Correo de soporte
              </p>
              <p style={{ fontSize: 16, color: '#C9A84C', fontWeight: 500 }}>{SUPPORT_EMAIL}</p>
            </div>
            <button onClick={copiarCorreo}
              style={{
                background: copiado ? '#C9A84C' : 'transparent', color: copiado ? '#080808' : '#F5F0E8',
                border: '1px solid rgba(201,168,76,0.4)', borderRadius: 8, padding: '10px 18px',
                fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
              }}>
              {copiado ? '✓ Copiado' : 'Copiar correo'}
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(245,240,232,0.6)', marginBottom: 6 }}>Nombre</label>
              <input required name="nombre" value={form.nombre} onChange={handleChange}
                style={inputStyle} placeholder="Tu nombre" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(245,240,232,0.6)', marginBottom: 6 }}>Correo</label>
              <input required type="email" name="email" value={form.email} onChange={handleChange}
                style={inputStyle} placeholder="tu@correo.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(245,240,232,0.6)', marginBottom: 6 }}>Asunto</label>
              <input name="asunto" value={form.asunto} onChange={handleChange}
                style={inputStyle} placeholder="¿En qué te podemos ayudar?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'rgba(245,240,232,0.6)', marginBottom: 6 }}>Mensaje</label>
              <textarea required name="mensaje" value={form.mensaje} onChange={handleChange} rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'DM Sans, sans-serif' }}
                placeholder="Cuéntanos los detalles..." />
            </div>
            <button type="submit"
              style={{
                background: 'linear-gradient(135deg, #E8C96A, #8B6914)', color: '#080808',
                padding: '16px 36px', borderRadius: 10, fontWeight: 600, fontSize: 15,
                border: 'none', cursor: 'pointer', marginTop: 8, fontFamily: 'DM Sans, sans-serif',
              }}>
              Enviar mensaje →
            </button>
            <p style={{ fontSize: 12, color: 'rgba(245,240,232,0.35)', textAlign: 'center', marginTop: 4 }}>
              Se abrirá tu aplicación de correo para enviar el mensaje a {SUPPORT_EMAIL}
            </p>
          </form>

        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10,
  padding: '12px 16px', color: '#F5F0E8', fontSize: 14, outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
};
