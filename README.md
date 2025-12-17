# 💈 Barber Booking MVP

## 🚀 Descripción del proyecto

Barber Booking MVP es una plataforma web para **agendar citas en barberías**, pensada como un **Producto Mínimo Viable (MVP)**. El objetivo es validar el modelo de negocio rápidamente, sin agregar funcionalidades innecesarias.

Este MVP permite que:

* Clientes reserven citas
* Barberías gestionen sus servicios y agenda
* Se realicen pagos únicos y planes mensuales
* La plataforma cobre una comisión automática

---

## 🎯 Alcance del MVP

### ✅ Funcionalidades INCLUIDAS

* Login de **clientes** y **barberías**
* Creación y gestión de barbería
* Creación y gestión de servicios
* Agendamiento de citas
* Pago por cita única
* Plan mensual simple
* Comisión automática por transacción

### ❌ Funcionalidades EXCLUIDAS

* Chat
* Reviews / calificaciones
* App móvil nativa
* Reportes avanzados

> ⚠️ Regla clave: **si no está aquí, NO se desarrolla**.

---

## 🧱 Stack Tecnológico

* **Frontend:** Next.js (App Router)
* **Lenguaje:** TypeScript
* **UI:** Tailwind CSS + Shadcn/UI
* **Backend:** API Routes (Next.js)
* **Base de datos:** PostgreSQL
* **ORM:** Prisma
* **Auth:** Auth.js (NextAuth)
* **Pagos:** Stripe
* **Deploy:** Vercel

---

## 🗂️ Modelos principales (Base)

* User
* Barbershop
* Service
* Appointment
* Plan
* Subscription
* Payment

> Los modelos contienen **solo campos clave**, sin sobre-ingeniería.

---

## 🛠️ Fases de desarrollo

### 🟢 FASE 0 — Preparación

* Definición clara del alcance
* Creación del repositorio

### 🟢 FASE 1 — Setup técnico

* Crear proyecto Next.js
* Configurar Tailwind y Shadcn
* Inicializar Git

### 🟢 FASE 2 — Base de datos

* Crear DB PostgreSQL
* Configurar Prisma
* Migraciones iniciales

### 🟢 FASE 3 — Autenticación

* Login por email y Google
* Roles: CLIENT / BARBERSHOP

### 🟢 FASE 4 — Barbería

* Crear y editar barbería
* Panel básico

### 🟢 FASE 5 — Servicios

* CRUD de servicios
* Vista para clientes

### 🟢 FASE 6 — Agenda

* Agendar citas
* Agenda diaria por barbería

### 🟢 FASE 7 — Pagos

* Pago por cita con Stripe
* Webhooks

### 🟢 FASE 8 — Plan mensual

* Crear plan
* Uso y validación

### 🟢 FASE 9 — Comisión

* Comisión automática global

### 🟢 FASE 10 — UI/UX

* Mobile first
* Componentes simples

### 🟢 FASE 11 — Deploy

* Deploy en Vercel
* Variables de entorno

---

## 📦 Instalación local

```bash
npm install
npm run dev
```

---

## 🔐 Variables de entorno

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 🧠 Reglas de oro

* Un feature a la vez
* Sin perfeccionismo
* Funciona > bonito
* Deploy temprano

---

## 📌 Checklist diario

Antes de cerrar el día:

* ¿Compila?
* ¿Funciona en móvil?
* ¿Se puede usar sin explicación?

---

## 📍 Estado del proyecto

🚧 En desarrollo (MVP)
