<p align="center">
  <img src="public/icon-512.png" alt="Licor System" width="120" />
</p>

<h1 align="center">Licor System</h1>
<p align="center">
  <strong>Inventory Management System for Liquor Stores</strong><br/>
  Built for El Alto, La Paz, Bolivia
</p>

<p align="center">
  <a href="https://licor-system.vercel.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="docs/ARCHITECTURE.md">Full Architecture Docs</a> •
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

## Overview

Licor System is a full-featured, mobile-first **inventory management system** designed specifically for small liquor stores (_licorerías_) in Bolivia. It runs as a Progressive Web App (PWA) with offline support, voice-controlled AI, OCR image scanning, and real-time stock management.

**Key highlights:**
- Complete inventory lifecycle: products, categories, sales, arrivals, loans, suppliers
- Voice AI with 26 intents — manage your store by speaking in Spanish
- Offline-first architecture — works without internet, syncs when back online
- Festive date reminders tailored to Bolivian holidays (Carnaval, Compadres, Gran Poder, etc.)
- Automatic stock management via database triggers
- PWA installable on any device

**Tech stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Zustand

---

## Features

### Core Inventory
| Feature | Description |
|---------|-------------|
| **Products** | Full CRUD with category assignment, buy/sell prices, stock tracking, minimum stock alerts |
| **Categories** | Create, edit, delete categories. Drill into a category to see and add products directly |
| **Sales** | Register sales (auto-decrements stock via DB trigger). Void/annul sales with automatic stock restoration |
| **Arrivals** | Register stock arrivals from suppliers (auto-increments stock via DB trigger) |
| **Loans** | Lend products to people with optional cash guarantee (_garantía_). Mark as returned to restore stock |
| **Suppliers** | Manage supplier information (name, phone, address) |

### Intelligence & Analytics
| Feature | Description |
|---------|-------------|
| **Dashboard** | Summary cards (total products, low stock, today's sales, inventory value), stock alerts, recent activity |
| **Analysis** | Profit margin analysis, inventory value breakdown by category |
| **Predictions** | Stock depletion estimates — predicts when products will run out based on sales velocity |
| **Purchase Recommendations** | Auto-suggests what to buy and from which supplier based on stock levels |
| **Reports** | Financial summaries (today/week/month/all-time) — sales, purchases, net profit with PDF export |

### AI & Automation
| Feature | Description |
|---------|-------------|
| **Voice AI** | 26 intents in Spanish — register sales, check stock, create products, and more by voice |
| **Image AI (OCR)** | Take a photo of a product list → OCR extracts text → matches against inventory |
| **Festive Reminders** | Automatic notifications before Bolivian holidays with product stocking suggestions |
| **Stock Alerts** | Real-time notifications for products below minimum stock with WhatsApp sharing |

### Technical
| Feature | Description |
|---------|-------------|
| **Offline Mode** | Full offline support with Service Worker + IndexedDB. Auto-syncs when connection is restored |
| **PWA** | Installable as a native-like app on mobile and desktop |
| **Dark Theme** | Sleek dark UI optimized for quick inventory management |
| **Mobile-First** | Bottom navigation on mobile, side menu on desktop |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- A **Supabase** project ([create one free](https://supabase.com))

### 1. Clone the Repository

```bash
git clone https://github.com/ronaldmendzas/licor-system.git
cd licor-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_WHATSAPP_PHONE=+591XXXXXXXX
NEXT_PUBLIC_CALLMEBOT_APIKEY=your-callmebot-key
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Your Supabase anonymous/public key |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | No | WhatsApp phone number for alert sharing |
| `NEXT_PUBLIC_CALLMEBOT_APIKEY` | No | CallMeBot API key for automated WhatsApp messages |

### 4. Set Up the Database

Run the schema against your Supabase PostgreSQL database:

**Option A: Via Supabase SQL Editor**
1. Go to your Supabase dashboard → SQL Editor
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click "Run"

**Option B: Via script**
```bash
# Requires DATABASE_URL environment variable pointing to your Supabase PostgreSQL
node scripts/setup-db.js
```

### 5. Create the Admin User

**Option A: Via Supabase dashboard**
1. Go to Authentication → Users → "Add user"
2. Email: `admin@licoreria.com`, Password: `admin123456`

**Option B: Via script**
```bash
node scripts/crear-usuario.js
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with `admin@licoreria.com` / `admin123456`.

### 7. Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
licor-system/
├── public/                          # Static assets
│   ├── sw.js                        # Service Worker (offline caching)
│   ├── manifest.json                # PWA manifest
│   ├── icon-192.png                 # App icon (192px)
│   ├── icon-512.png                 # App icon (512px)
│   └── favicon.png                  # Favicon
│
├── scripts/                         # Setup scripts
│   ├── crear-usuario.js             # Create admin user in Supabase
│   └── setup-db.js                  # Execute schema.sql against DB
│
├── supabase/
│   └── schema.sql                   # Complete database schema with triggers
│
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── layout.tsx               # Root layout (metadata, offline provider)
│   │   ├── page.tsx                 # Dashboard
│   │   ├── login/page.tsx           # Authentication
│   │   ├── productos/page.tsx       # Products management
│   │   ├── categorias/page.tsx      # Categories with product drill-down
│   │   ├── ventas/page.tsx          # Sales with void capability
│   │   ├── llegadas/page.tsx        # Stock arrivals
│   │   ├── prestamos/page.tsx       # Product loans
│   │   ├── proveedores/page.tsx     # Supplier management
│   │   ├── analisis/page.tsx        # Margin & value analysis
│   │   ├── predicciones/page.tsx    # Stock depletion predictions
│   │   ├── recomendaciones/page.tsx # Purchase recommendations
│   │   ├── reportes/page.tsx        # Financial reports
│   │   ├── imagen/page.tsx          # OCR image scanning
│   │   ├── voz/page.tsx             # Voice AI interface
│   │   ├── configuracion/page.tsx   # Settings
│   │   └── api/alertas/whatsapp/    # WhatsApp alert API
│   │
│   ├── components/
│   │   ├── layout/app-shell.tsx     # Main layout wrapper
│   │   ├── navigation/             # Side menu, top bar, bottom nav
│   │   ├── dashboard/              # Summary cards, alerts, activity
│   │   ├── products/               # Product card & form
│   │   ├── sales/sale-form.tsx     # Register sale form
│   │   ├── arrivals/arrival-form.tsx
│   │   ├── loans/loan-form.tsx
│   │   ├── suppliers/supplier-form.tsx
│   │   ├── providers/offline-provider.tsx
│   │   ├── festive-reminder.tsx     # Holiday reminder cards
│   │   └── ui/                      # Button, Card, Modal, etc.
│   │
│   ├── lib/
│   │   ├── supabase/               # Supabase clients (browser, server, middleware)
│   │   ├── voice-ai.ts             # NLU engine (26 intents, 878 lines)
│   │   ├── festive-dates.ts        # Bolivian holiday calendar
│   │   ├── offline-storage.ts      # IndexedDB offline cache
│   │   ├── utils.ts                # Formatting & math utilities
│   │   ├── whatsapp.ts             # WhatsApp API integration
│   │   ├── ocr/image-processor.ts  # Tesseract.js OCR wrapper
│   │   ├── predictions/            # Stock depletion estimator
│   │   └── voice/                  # Simplified voice command parser
│   │
│   ├── hooks/                      # useCamera, useSpeechRecognition
│   ├── store/app-store.ts          # Zustand global state
│   ├── types/index.ts              # TypeScript interfaces
│   └── middleware.ts               # Next.js auth middleware
│
├── .env.local.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Architecture

> For the complete architecture deep-dive, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

### High-Level Overview

```
┌──────────────────────────────────────────────────┐
│                    Browser (PWA)                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Next.js   │  │ Zustand  │  │  IndexedDB   │  │
│  │  App Router│──│  Store   │──│  (Offline)   │  │
│  │  (Pages)   │  │ (Cache)  │  │              │  │
│  └─────┬──────┘  └────┬─────┘  └──────┬───────┘  │
│        │              │               │           │
│  ┌─────┴──────────────┴───────────────┴────────┐  │
│  │            Service Worker (sw.js)           │  │
│  │      Cache API · Background Sync            │  │
│  └─────────────────────┬───────────────────────┘  │
└────────────────────────┼──────────────────────────┘
                         │ HTTPS
                         ▼
┌────────────────────────────────────────────────────┐
│                 Supabase Backend                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │PostgreSQL│  │  Auth (JWT)  │  │  Row Level   │ │
│  │+ Triggers│  │  Session Mgmt│  │  Security    │ │
│  └──────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Client-side rendering only** — All pages use `"use client"`. Data is fetched via the Supabase browser client. This simplifies offline support since all data paths go through the same client.

2. **Database triggers for stock** — Stock is managed automatically at the database level. Inserting a sale decrements stock; inserting an arrival increments stock; loan state changes adjust stock.

3. **Voice AI is rule-based** — No external LLM dependency. The NLU engine uses pattern matching, regex, and Fuse.js fuzzy search to parse 26 intents from natural Spanish speech. Works offline with zero API cost.

4. **Offline-first with IndexedDB** — Every store update is mirrored to IndexedDB. Mutations are queued and synced when the connection is restored.

5. **Single Zustand store** — All application state lives in one store. Each page calls `loadAll()` on mount. The store acts as an in-memory cache.

---

## Database Schema

### Entity Relationship

```
categorias 1──N productos 1──N ventas
                    │
                    ├──N llegadas ──N proveedores
                    │
                    └──N prestamos
```

### Triggers (Automatic Stock Management)

| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `tr_venta_descontar_stock` | ventas | AFTER INSERT | `stock_actual -= cantidad` |
| `tr_llegada_sumar_stock` | llegadas | AFTER INSERT | `stock_actual += cantidad` |
| `tr_prestamo_stock` | prestamos | AFTER INSERT/UPDATE | Decrement on new loan, restore on return |

> There is **no DELETE trigger** on ventas. The "void sale" feature manually restores stock before deleting the record.

Full schema details: [`supabase/schema.sql`](supabase/schema.sql)

---

## Voice AI Commands

The voice interface understands **26 intents** in natural Spanish. Examples:

| Intent | Example Phrases |
|--------|----------------|
| **Register sale** | _"Vender 3 Paceña"_, _"Registrar venta de Singani"_ |
| **Register arrival** | _"Llegaron 24 Huari"_, _"Ingreso de 10 cajas de Ron"_ |
| **Create product** | _"Crear producto Paceña en categoría Cervezas a 15 bs"_ |
| **Check stock** | _"Cuánto hay de Singani?"_, _"Stock de Paceña"_ |
| **Check price** | _"Precio del Whisky"_, _"A cuánto está el Ron?"_ |
| **Create category** | _"Crear categoría Vinos"_ |
| **Create loan** | _"Prestar 2 Paceña a Juan"_ |
| **Return loan** | _"Devolver préstamo de Juan"_ |
| **Low stock** | _"Qué falta?"_, _"Productos bajos"_ |
| **Best sellers** | _"Qué se vende más?"_ |
| **Navigate** | _"Ir a ventas"_, _"Abrir productos"_ |
| **Help** | _"Ayuda"_, _"Qué puedes hacer?"_ |

Full NLU implementation: [`src/lib/voice-ai.ts`](src/lib/voice-ai.ts) (878 lines)

---

## Festive Date Reminders

Automatic reminders for Bolivian holidays (high-sales periods):

| Holiday | Priority | Product Suggestions |
|---------|----------|-------------------|
| Carnaval | 🔴 High | Cerveza, Singani, Vino, Ron, Whisky |
| Jueves de Compadre/Comadre | 🔴 High | Cerveza, Singani, Cocktails |
| Fin de Año | 🔴 High | Champagne, Vino, Singani, Sidra |
| San Juan | 🔴 High | Singani, Vino caliente, Cerveza |
| Gran Poder | 🔴 High | Cerveza, Singani, Ron |
| Día de la Madre | 🔴 High | Vino, Espumante, Licores dulces |
| _+ 12 more holidays_ | | |

Moveable dates (Carnaval, Easter-based) are calculated algorithmically.

---

## Deployment

### Vercel (Current)

Live at [licor-system.vercel.app](https://licor-system.vercel.app). Auto-deploys on push to `main`.

### Manual

```bash
npm run build
npm start
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | v4 |
| **Database** | Supabase (PostgreSQL) | — |
| **Auth** | Supabase Auth | — |
| **State** | Zustand | 5.0.11 |
| **Icons** | Lucide React | 0.563 |
| **OCR** | Tesseract.js | 7.0.0 |
| **Fuzzy Search** | Fuse.js | 7.1.0 |
| **Toasts** | Sonner | 2.0.7 |
| **PDF** | jsPDF + html2canvas | — |
| **Hosting** | Vercel | — |

---

## License

This project is private. All rights reserved.

---

<p align="center">
  Built with ❤️ for El Alto, La Paz, Bolivia 🇧🇴
</p>
