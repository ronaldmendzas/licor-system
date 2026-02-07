# Architecture — Licor System

> Comprehensive technical architecture for developers working on Licor System.

---

## Table of Contents

- [System Overview](#system-overview)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Database Layer](#database-layer)
- [Authentication Flow](#authentication-flow)
- [Voice AI Pipeline](#voice-ai-pipeline)
- [Offline Architecture](#offline-architecture)
- [Festive Date Engine](#festive-date-engine)
- [Component Hierarchy](#component-hierarchy)
- [Type System](#type-system)
- [Service Worker Strategy](#service-worker-strategy)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser (PWA)                        │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Next.js    │  │  Zustand    │  │  IndexedDB   │  │ Service  │  │
│  │  App Router │──│  Store      │──│  (7 stores)  │  │ Worker   │  │
│  │  (14 pages) │  │  (global)   │  │              │  │ (sw.js)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └────┬─────┘  │
│         │                │                │               │         │
│  ┌──────┴────────────────┴────────────────┴───────────────┴──────┐  │
│  │                     Supabase Browser Client                   │  │
│  │                  @supabase/ssr (createBrowserClient)          │  │
│  └──────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │ HTTPS + JWT
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Supabase Backend                             │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│  │  PostgreSQL  │   │  Auth (JWT)  │   │  Row Level Security  │    │
│  │  6 tables    │   │  Email/Pass  │   │  (authenticated)     │    │
│  │  3 triggers  │   │              │   │                      │    │
│  └──────────────┘   └──────────────┘   └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Client-side only** — Every page uses `"use client"`. No SSR data fetching. This enables full offline support since all data paths go through the browser client.
2. **Single source of truth** — Zustand store is the in-memory cache. All UI reads from the store; all mutations go through Supabase then reload the store.
3. **Database-managed stock** — Triggers handle stock changes. The application never manually increments/decrements stock except when voiding sales (no DELETE trigger exists).
4. **Zero external AI** — Voice AI runs entirely in the browser. No API keys, no latency, no cost.

---

## Data Flow

### Standard CRUD Flow (e.g., Creating a Sale)

```
User Action
    │
    ▼
Page Component (ventas/page.tsx)
    │  calls Supabase client directly
    ▼
Supabase Insert → triggers "tr_venta_descontar_stock"
    │                   │
    │                   ▼
    │              Stock auto-decremented in "productos"
    │
    ▼
loadAll() → refreshes Zustand store
    │
    ▼
UI re-renders with updated data
    │
    ▼
OfflineProvider mirrors store → IndexedDB
```

### Voiding a Sale (Special Case)

Since there is **no DELETE trigger** on `ventas`, the void flow is different:

```
1. Read current stock_actual from "productos"
2. Add sale.cantidad back → update "productos" stock
3. Delete the sale record from "ventas"
4. If delete fails → rollback stock to original value
5. loadAll() → refresh store
```

### Voice AI Flow

```
Speech (microphone)
    │
    ▼
Web Speech API (SpeechRecognition)
    │  raw transcript
    ▼
voice-ai.ts: normalizeText()
    │  lowercase, strip accents, expand synonyms
    ▼
voice-ai.ts: classifyIntent()
    │  weighted keyword matching → top intent
    ▼
voice-ai.ts: extractEntities()
    │  regex extraction of product, quantity, price, person
    ▼
voice-ai.ts: resolveProduct()
    │  Fuse.js fuzzy search against store.products
    ▼
Execute intent (Supabase insert/update/query)
    │
    ▼
Return response text → spoken via SpeechSynthesis
```

---

## State Management

### Zustand Store (`src/store/app-store.ts`)

The entire application shares a single flat store:

```typescript
interface AppState {
  // Data
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  loans: Loan[];

  // UI
  loading: boolean;
  search: string;

  // Actions
  setSearch: (s: string) => void;
  loadCategories: () => Promise<void>;
  loadProducts: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
  loadLoans: () => Promise<void>;
  loadAll: () => Promise<void>;
  getAlerts: () => StockAlert[];
}
```

### Data Loading Pattern

Every page follows this pattern:

```typescript
"use client";
import { useAppStore } from "@/store/app-store";

export default function SomePage() {
  const { products, categories, loadAll } = useAppStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);
  // ...
}
```

`loadAll()` is idempotent — it checks `loading` flag to prevent duplicate calls. It runs all four loaders (`loadProducts`, `loadCategories`, `loadSuppliers`, `loadLoans`) in parallel via `Promise.all`.

### Why Not Server Components?

- **Offline support** requires all data fetching to go through the browser client so IndexedDB can intercept/cache.
- **Voice AI** needs access to the in-memory product list for fuzzy matching without network round-trips.
- **Simplicity** — one data path, one cache, fewer bugs.

---

## Database Layer

### Tables

| Table | Key Columns | Purpose |
|-------|------------|---------|
| `categorias` | id, nombre | Product categories |
| `productos` | id, nombre, categoria_id, precio_compra, precio_venta, stock_actual, stock_minimo, alias[], imagen_url, activo | Product catalog |
| `ventas` | id, producto_id, cantidad, precio_unitario, total, fecha | Sales records |
| `llegadas` | id, producto_id, proveedor_id, cantidad, precio_compra, numero_factura, fecha | Stock arrivals |
| `prestamos` | id, producto_id, persona, cantidad, garantia_bs, estado, fecha_prestamo, fecha_devolucion | Product loans |
| `proveedores` | id, nombre, telefono, direccion | Suppliers |

### Triggers

#### `tr_venta_descontar_stock` (AFTER INSERT on ventas)

```sql
UPDATE productos
SET stock_actual = stock_actual - NEW.cantidad
WHERE id = NEW.producto_id;
```

#### `tr_llegada_sumar_stock` (AFTER INSERT on llegadas)

```sql
UPDATE productos
SET stock_actual = stock_actual + NEW.cantidad
WHERE id = NEW.producto_id;
```

#### `tr_prestamo_stock` (AFTER INSERT OR UPDATE on prestamos)

```sql
-- On INSERT (new loan): decrement stock
-- On UPDATE to 'devuelto': restore stock
```

### Row Level Security (RLS)

All tables have RLS enabled. Policies require `auth.role() = 'authenticated'`. This means:
- Unauthenticated users cannot read or write any data
- Any authenticated user has full access (single-tenant model)

### Key Indexes

- `idx_productos_categoria` on `productos(categoria_id)` — for category drill-down
- `idx_ventas_fecha` on `ventas(fecha)` — for date-range reports
- `idx_llegadas_fecha` on `llegadas(fecha)` — for arrival reports
- `idx_prestamos_estado` on `prestamos(estado)` — for filtering active loans

---

## Authentication Flow

```
Browser (any page)
    │
    ▼
Next.js Middleware (middleware.ts)
    │  calls updateSession() from @supabase/ssr
    │
    ├── Has valid session cookie → proceed to page
    │
    └── No session → redirect to /login
            │
            ▼
        Login Page
            │  supabase.auth.signInWithPassword()
            ▼
        Session cookie set → redirect to /
```

### Key Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Route protection — runs on every request |
| `src/lib/supabase/middleware.ts` | Session refresh/update logic |
| `src/lib/supabase/client.ts` | Browser Supabase client (used by all pages) |
| `src/lib/supabase/server.ts` | Server-side Supabase client (used by middleware) |
| `src/app/login/page.tsx` | Login form with email/password |

### Session Management

- Sessions use HTTP-only cookies managed by `@supabase/ssr`.
- The middleware matcher excludes static assets: `_next/static`, `_next/image`, `favicon.ico`, image files.
- There is no registration page — users are created via script or Supabase dashboard.

---

## Voice AI Pipeline

### Architecture: `src/lib/voice-ai.ts` (878 lines)

The Voice AI is a complete in-browser NLU engine for Spanish. No LLM, no API calls.

### Pipeline Stages

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Input   │───▶│ Normalize    │───▶│  Classify    │───▶│   Extract    │
│  (text)  │    │  Text        │    │  Intent      │    │   Entities   │
└──────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                               │
                                     ┌──────────────┐          │
                                     │   Execute    │◀─────────┘
                                     │   Action     │
                                     └──────────────┘
```

#### Stage 1: Text Normalization

- Lowercase
- Remove accents (á → a, ñ → n)
- Expand number words ("tres" → "3", "una docena" → "12")
- Replace common synonyms ("birra" → "cerveza", "chela" → "cerveza")

#### Stage 2: Intent Classification

- Each of the 26 intents has a set of weighted keywords
- The engine scores each intent against the normalized text
- Highest scoring intent above a threshold wins
- Ties are broken by specificity (number of matched keywords)

#### Stage 3: Entity Extraction (regex-based)

| Entity | Pattern Examples |
|--------|-----------------|
| `quantity` | "3", "tres", "una docena", "24 unidades" |
| `product` | Fuzzy match via Fuse.js against product names + aliases |
| `price` | "a 15 bs", "15 bolivianos", "precio 20" |
| `person` | "a Juan", "para María" (for loans) |
| `category` | "en categoría Vinos", "categoría Cervezas" |

#### Stage 4: Product Resolution

Uses **Fuse.js** fuzzy search with these settings:
- Searches: `nombre`, `alias[]`
- Threshold: 0.4 (fairly lenient)
- Returns best match with confidence score

#### 26 Supported Intents

```typescript
type Intent =
  | "register_sale"       | "register_arrival"
  | "create_product"      | "edit_product"
  | "delete_product"      | "search_product"
  | "list_products"       | "check_price"
  | "check_stock"         | "create_category"
  | "delete_category"     | "list_categories"
  | "create_supplier"     | "delete_supplier"
  | "list_suppliers"      | "create_loan"
  | "return_loan"         | "list_loans"
  | "low_stock_alert"     | "best_sellers"
  | "daily_summary"       | "total_revenue"
  | "navigate"            | "help"
  | "greeting"            | "unknown";
```

---

## Offline Architecture

### Three-Layer Strategy

```
Layer 1: Service Worker Cache (sw.js)
├── Static assets: cache-first
├── Pages (/_next/): stale-while-revalidate
└── Supabase API: network-first, fallback to cache

Layer 2: IndexedDB (offline-storage.ts)
├── 6 data stores: productos, categorias, proveedores, prestamos, ventas, llegadas
└── 1 mutation queue: pending_mutations

Layer 3: Zustand In-Memory Store (app-store.ts)
└── Live data for current session, populated from Supabase or IndexedDB fallback
```

### Service Worker (`public/sw.js`)

| Request Type | Strategy | Behavior |
|-------------|----------|----------|
| Supabase API (`/rest/v1/`) | Network-first | Try network → fall back to last cached response |
| Next.js pages | Stale-while-revalidate | Serve cache immediately → update cache in background |
| Static assets | Cache-first | Always serve from cache after first load |

Cache name: `licor-system-v2`

### IndexedDB (`src/lib/offline-storage.ts`)

7 object stores, all using `id` as keyPath:

| Store | Data |
|-------|------|
| `productos` | Full product records with category join |
| `categorias` | Category records |
| `proveedores` | Supplier records |
| `prestamos` | Loan records with product join |
| `ventas` | Recent sales |
| `llegadas` | Recent arrivals |
| `pending_mutations` | Queued mutations awaiting sync |

### Key Functions

```typescript
saveToLocal(storeName, data[])       // Bulk save (clears + writes)
getFromLocal<T>(storeName)           // Read all from store
addPendingMutation(mutation)         // Queue a mutation for sync
getPendingMutations()                // Get all pending mutations
clearPendingMutations()              // Clear after successful sync
isOnline()                           // navigator.onLine check
onConnectivityChange(callback)       // Listen for online/offline events
```

### Sync Protocol (`src/components/providers/offline-provider.tsx`)

```
App Mounts
    │
    ▼
Register Service Worker
    │
    ▼
loadAll() from Supabase
    │
    ├── Online → save to IndexedDB as cache
    │
    └── Offline → load from IndexedDB instead
    
Connection Restored Event
    │
    ▼
Read pending_mutations from IndexedDB
    │
    ▼
For each mutation:
    │  Execute against Supabase (insert/update/delete)
    ▼
Clear pending_mutations
    │
    ▼
loadAll() → refresh store with server data
```

### UI Indicators

- **Red banner**: "Sin conexión — Los datos se guardarán localmente"
- **Green banner**: "Conexión restaurada — Sincronizando datos..." (auto-hides after 3s)
- **Floating badge**: "Offline" indicator in bottom-right corner

---

## Festive Date Engine

### Architecture: `src/lib/festive-dates.ts` (314 lines)

Manages Bolivian festive dates for inventory planning. Holidays are high-sales periods — the system reminds store owners to stock up in advance.

### Date Types

1. **Fixed dates** — Same day every year (e.g., Jan 1, Dec 25)
2. **Moveable dates** — Calculated from Easter (e.g., Carnaval = Easter − 52 days)

### Easter Calculation

Uses the **Anonymous Gregorian algorithm** to compute Easter Sunday, then derives:

| Offset | Holiday |
|--------|---------|
| −52 days | Jueves de Compadre |
| −45 days | Jueves de Comadre |
| −48 days | Domingo de Carnaval |
| −46 days | Martes de Ch'alla |
| Day 0 | Easter Sunday |

### Priority System

| Priority | Meaning | Example |
|----------|---------|---------|
| High (🔴) | Major holiday, very high sales | Carnaval, Fin de Año, Gran Poder |
| Medium (🟡) | Moderate sales increase | San Valentín, Día del Padre |
| Low (🟢) | Minor but notable | Alasita |

### Product Suggestions

Each festive date includes recommended products to stock:

```typescript
{
  name: "Carnaval",
  productSuggestions: ["Cerveza", "Singani", "Vino", "Ron", "Whisky"]
}
```

### Notification System

The `FestiveReminder` component (`src/components/festive-reminder.tsx`):
- Shows on the dashboard 14 days before any festive date
- Displays priority badges and product suggestion tags
- Supports WhatsApp sharing of reminders
- Requests browser notification permissions
- Cards are dismissable (stored in `localStorage`)

---

## Component Hierarchy

```
layout.tsx
└── OfflineProvider
    └── AppShell (layout/app-shell.tsx)
        ├── SideMenu (desktop)
        ├── TopBar (header + notifications)
        ├── BottomNav (mobile)
        └── Page Content
            ├── page.tsx (Dashboard)
            │   ├── SummaryCards
            │   ├── FestiveReminder
            │   ├── StockAlerts
            │   └── RecentActivity
            ├── productos/page.tsx
            │   ├── ProductForm (modal)
            │   └── ProductCard (grid)
            ├── categorias/page.tsx
            │   ├── Category grid view
            │   └── Product drill-down view
            ├── ventas/page.tsx
            │   ├── SaleForm (modal)
            │   └── Sales list (with void button)
            ├── llegadas/page.tsx
            │   └── ArrivalForm (modal)
            ├── prestamos/page.tsx
            │   └── LoanForm (modal)
            ├── proveedores/page.tsx
            │   └── SupplierForm (modal)
            ├── voz/page.tsx
            │   └── Voice AI interface
            └── imagen/page.tsx
                └── OCR camera interface
```

---

## Type System

All database entity types are in `src/types/index.ts`:

### Core Entities

```typescript
Category    { id, nombre, created_at }
Product     { id, nombre, categoria_id, precio_compra, precio_venta,
              stock_actual, stock_minimo, alias[], imagen_url, activo,
              created_at, updated_at, categorias? }
Supplier    { id, nombre, telefono, direccion, created_at }
Sale        { id, producto_id, cantidad, precio_unitario, total, fecha,
              created_at, productos? }
Arrival     { id, producto_id, proveedor_id, cantidad, precio_compra,
              numero_factura, fecha, created_at, producto?, proveedor? }
Loan        { id, producto_id, persona, cantidad, garantia_bs, estado,
              fecha_prestamo, fecha_devolucion, created_at, productos? }
```

### Derived Types

```typescript
StockLevel  = "critical" | "low" | "normal"
StockAlert  { product, level, percentage }
DailySummary { totalSales, productsSold, totalRevenue, topProducts }
RecentMovement { id, type, productName, quantity, total, date }
```

### Conventions

- Optional joins use `?` suffix (e.g., `categorias?: Category`)
- `alias[]` is a PostgreSQL text array for fuzzy matching alternative names
- `activo` boolean enables soft-delete for products
- `estado` is typed as union: `"pendiente" | "devuelto"`

---

## Service Worker Lifecycle

### Registration

The `OfflineProvider` registers the Service Worker on mount:

```typescript
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
```

### Cache Versioning

When `sw.js` is updated:
1. New SW installs in background
2. Old caches (`licor-system-v1`) are deleted in the `activate` event
3. New cache (`licor-system-v2`) starts fresh

### Update Strategy

The SW uses `skipWaiting()` and `clients.claim()` to immediately take control of all pages.

---

## Adding New Features — Checklist

When adding a new major feature, ensure you cover all layers:

- [ ] **Database**: Add tables/columns to `supabase/schema.sql`
- [ ] **Types**: Add/update interfaces in `src/types/index.ts`
- [ ] **Store**: Add fetch/mutation actions to `src/store/app-store.ts`
- [ ] **Page**: Create route in `src/app/feature/page.tsx`
- [ ] **Navigation**: Add link in `src/components/navigation/side-menu.tsx`
- [ ] **Offline**: Add IndexedDB store name to `offline-storage.ts` if needed
- [ ] **Voice AI**: Add intent to `src/lib/voice-ai.ts` if voice-controllable
- [ ] **Mobile**: Ensure responsive design with bottom nav consideration
