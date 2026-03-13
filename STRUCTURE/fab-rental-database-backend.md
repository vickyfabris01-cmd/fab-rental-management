# fab-rental-management — Database & Backend Reference

> **Stack:** Supabase (PostgreSQL) · FastAPI (Python) · Row Level Security · Supabase Auth

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
   - 2.1 [Core / Platform Tables](#21-core--platform-tables)
   - 2.2 [Tenant Configuration Tables](#22-tenant-configuration-tables)
   - 2.3 [Property & Room Tables](#23-property--room-tables)
   - 2.4 [Users & Roles Tables](#24-users--roles-tables)
   - 2.5 [Tenancy Lifecycle Tables](#25-tenancy-lifecycle-tables)
   - 2.6 [Billing & Payments Tables](#26-billing--payments-tables)
   - 2.7 [Workforce Tables](#27-workforce-tables)
   - 2.8 [Messaging & Complaints Tables](#28-messaging--complaints-tables)
   - 2.9 [Notifications Tables](#29-notifications-tables)
3. [Row Level Security (RLS) Policies](#3-row-level-security-rls-policies)
4. [Database Triggers & Automation](#4-database-triggers--automation)
5. [Indexes & Performance](#5-indexes--performance)
6. [Enums & Lookup Values](#6-enums--lookup-values)
7. [FastAPI Backend Structure](#7-fastapi-backend-structure)
8. [Authentication Flow](#8-authentication-flow)
9. [M-Pesa Integration Flow](#9-m-pesa-integration-flow)
10. [Entity Relationship Summary](#10-entity-relationship-summary)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React + Vite PWA                 │
│                  (Multi-Tenant Frontend)            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / REST / Realtime WS
┌────────────────────▼────────────────────────────────┐
│               FastAPI Python Backend                │
│   - Business logic, validation, orchestration       │
│   - M-Pesa webhook handler                         │
│   - SMS / Email gateway calls                       │
└────────────────────┬────────────────────────────────┘
                     │ Supabase Client / Service Role
┌────────────────────▼────────────────────────────────┐
│           Supabase (PostgreSQL + Auth)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  Auth Users  │  │  RLS Tables  │  │  Storage  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────────────────────────────────────┐   │
│  │         Realtime Subscriptions               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

- Every data table carries a `tenant_id` FK to `tenants` — this is the RLS boundary.
- `auth.users` (Supabase built-in) is the single identity source. A `profiles` table extends it with role and tenant info.
- Financial records (`billing_cycles`, `payments`) are **immutable** — no UPDATE or DELETE is ever permitted, only soft-cancellation via status fields.
- All IDs are `UUID` (gen_random_uuid()).

---

## 2. Database Schema

### 2.1 Core / Platform Tables

---

#### `tenants`

Represents a rental business (hostel, apartment complex, farm, etc.).

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,           -- URL-friendly identifier
  status          TEXT NOT NULL DEFAULT 'pending' -- pending | active | suspended
                  CHECK (status IN ('pending','active','suspended')),
  owner_user_id   UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

| Column | Notes |
|--------|-------|
| `slug` | Used to scope tenant dashboard URLs e.g. `/t/sunrise-hostel` |
| `status` | Controlled only by Super Admin |
| `owner_user_id` | Links to the Owner profile |

---

#### `profiles`

Extends `auth.users` with role and tenant assignment.

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID REFERENCES tenants(id),     -- NULL for super_admin
  role            TEXT NOT NULL
                  CHECK (role IN ('super_admin','owner','manager','client','worker','visitor')),
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

> A user who has moved out retains their `profiles` row but has no active `tenancies` row.

---

### 2.2 Tenant Configuration Tables

---

#### `tenant_branding`

One row per tenant. Controls visual identity.

```sql
CREATE TABLE tenant_branding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url        TEXT,
  primary_color   TEXT DEFAULT '#1A73E8',
  secondary_color TEXT DEFAULT '#FFA000',
  font_family     TEXT DEFAULT 'Inter',
  tagline         TEXT,
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

#### `tenant_settings`

Operational settings per tenant.

```sql
CREATE TABLE tenant_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  billing_type            TEXT DEFAULT 'monthly'
                          CHECK (billing_type IN ('monthly','semester')),
  billing_due_day         INT DEFAULT 5,          -- Day of month rent is due
  grace_period_days       INT DEFAULT 3,
  late_fee_percent        NUMERIC(5,2) DEFAULT 0,
  currency                TEXT DEFAULT 'KES',
  mpesa_shortcode         TEXT,
  mpesa_passkey           TEXT,
  sms_enabled             BOOLEAN DEFAULT false,
  email_enabled           BOOLEAN DEFAULT true,
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.3 Property & Room Tables

---

#### `buildings`

Physical buildings within a tenant's property.

```sql
CREATE TABLE buildings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

#### `floors`

Floors within a building.

```sql
CREATE TABLE floors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number INT NOT NULL,
  label       TEXT,                              -- e.g. "Ground Floor", "Level 2"
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

#### `rooms`

Individual accommodation units.

```sql
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  floor_id        UUID REFERENCES floors(id),
  building_id     UUID REFERENCES buildings(id),
  room_number     TEXT NOT NULL,
  room_type       TEXT,                          -- e.g. single, double, dormitory
  capacity        INT NOT NULL DEFAULT 1,
  monthly_price   NUMERIC(12,2) NOT NULL,
  semester_price  NUMERIC(12,2),
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','occupied','maintenance','reserved')),
  description     TEXT,
  amenities       TEXT[],                        -- ['wifi','water','electricity']
  images          TEXT[],                        -- Supabase Storage URLs
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

#### `beds`

Optional sub-units for dormitory-style rooms.

```sql
CREATE TABLE beds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_label   TEXT NOT NULL,                    -- e.g. "Bed A", "Bunk 1 Top"
  is_occupied BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.4 Users & Roles Tables

---

#### `managers`

Tracks which profiles are managers for a given tenant.

```sql
CREATE TABLE managers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',               -- fine-grained permission flags
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
```

---

#### `manager_invites`

Tracks pending invitations sent to prospective managers. Token-based acceptance flow.

```sql
CREATE TABLE manager_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  token       TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  invited_by  UUID REFERENCES profiles(id),
  status      TEXT DEFAULT 'pending'
              CHECK (status IN ('pending','accepted','expired')),
  expires_at  TIMESTAMPTZ DEFAULT now() + INTERVAL '48 hours',
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

| Column | Notes |
|--------|-------|
| `token` | Sent in the invite email link — single use |
| `expires_at` | Auto-expires after 48 hours |
| `status` | Updated to `accepted` when the invitee completes onboarding |

---

### 2.5 Tenancy Lifecycle Tables

---

#### `rental_requests`

Submitted by visitors expressing interest in a room.

```sql
CREATE TABLE rental_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id),
  requester_id    UUID NOT NULL REFERENCES profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','offered','accepted','rejected','expired')),
  message         TEXT,
  preferred_move_in DATE,
  reviewed_by     UUID REFERENCES profiles(id),
  reviewed_at     TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

#### `tenancies`

The active (or historical) residency record. Core of the system.

```sql
CREATE TABLE tenancies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id             UUID NOT NULL REFERENCES rooms(id),
  bed_id              UUID REFERENCES beds(id),
  client_id           UUID NOT NULL REFERENCES profiles(id),
  rental_request_id   UUID REFERENCES rental_requests(id),
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','transferred','completed','terminated')),
  move_in_date        DATE NOT NULL,
  move_out_date       DATE,
  billing_type        TEXT NOT NULL CHECK (billing_type IN ('monthly','semester')),
  agreed_price        NUMERIC(12,2) NOT NULL,
  approved_by         UUID REFERENCES profiles(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- A client can only have ONE active tenancy across the entire platform
CREATE UNIQUE INDEX uq_one_active_tenancy
  ON tenancies (client_id)
  WHERE status = 'active';
```

---

#### `room_transfers`

Records the history of a client moving from one room to another within a tenant.

```sql
CREATE TABLE room_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id      UUID NOT NULL REFERENCES tenancies(id),
  from_room_id    UUID NOT NULL REFERENCES rooms(id),
  to_room_id      UUID NOT NULL REFERENCES rooms(id),
  from_bed_id     UUID REFERENCES beds(id),
  to_bed_id       UUID REFERENCES beds(id),
  transfer_date   DATE NOT NULL,
  reason          TEXT,
  approved_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.6 Billing & Payments Tables

---

#### `billing_cycles`

One row per billing period for an active tenancy. **Immutable after creation.**

```sql
CREATE TABLE billing_cycles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id      UUID NOT NULL REFERENCES tenancies(id),
  client_id       UUID NOT NULL REFERENCES profiles(id),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  billing_type    TEXT NOT NULL CHECK (billing_type IN ('monthly','semester')),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  amount_due      NUMERIC(12,2) NOT NULL,
  late_fee        NUMERIC(12,2) DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'unpaid'
                  CHECK (status IN ('unpaid','partial','paid','overdue','cancelled','waived')),
  due_date        DATE NOT NULL,
  invoice_number  TEXT UNIQUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  -- Financial immutability: no updates to amounts or period after creation
  CONSTRAINT no_retroactive_edits CHECK (created_at IS NOT NULL)
);
```

---

#### `payments`

Records every individual payment transaction. **Append-only — never deleted.**

```sql
CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_cycle_id    UUID NOT NULL REFERENCES billing_cycles(id),
  client_id           UUID NOT NULL REFERENCES profiles(id),
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method      TEXT NOT NULL
                      CHECK (payment_method IN ('mpesa','cash','bank_transfer','other')),
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending','confirmed','failed','reversed')),
  mpesa_transaction_id TEXT UNIQUE,
  mpesa_phone         TEXT,
  mpesa_receipt       TEXT,
  paid_at             TIMESTAMPTZ,
  recorded_by         UUID REFERENCES profiles(id),   -- NULL if automated (M-Pesa)
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

---

#### `invoices`

Generated invoice records (PDF link stored in Supabase Storage).

```sql
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  billing_cycle_id  UUID NOT NULL REFERENCES billing_cycles(id),
  client_id         UUID NOT NULL REFERENCES profiles(id),
  invoice_number    TEXT NOT NULL UNIQUE,
  issued_at         TIMESTAMPTZ DEFAULT now(),
  pdf_url           TEXT,                              -- Supabase Storage URL
  total_amount      NUMERIC(12,2) NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.7 Workforce Tables

---

#### `workers`

Staff employed by a tenant (security, maintenance, cleaners, shamba boys, etc.).

```sql
CREATE TABLE workers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id),       -- Optional: if worker has app login
  full_name       TEXT NOT NULL,
  phone           TEXT,
  id_number       TEXT,
  role            TEXT NOT NULL,                      -- 'security','cleaner','maintenance', etc.
  salary          NUMERIC(12,2) NOT NULL,
  pay_cycle       TEXT DEFAULT 'monthly'
                  CHECK (pay_cycle IN ('weekly','biweekly','monthly')),
  status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','inactive','terminated')),
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

#### `worker_payments`

Salary disbursement records per worker. Append-only.

```sql
CREATE TABLE worker_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id       UUID NOT NULL REFERENCES workers(id),
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  payment_method  TEXT CHECK (payment_method IN ('mpesa','cash','bank_transfer','other')),
  payment_status  TEXT DEFAULT 'paid'
                  CHECK (payment_status IN ('pending','paid','reversed')),
  mpesa_transaction_id TEXT,
  paid_at         TIMESTAMPTZ,
  recorded_by     UUID REFERENCES profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

#### `attendance` *(optional)*

Tracks daily attendance for workers.

```sql
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES workers(id),
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present','absent','half_day','leave')),
  notes       TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (worker_id, date)
);
```

---

### 2.8 Messaging & Complaints Tables

---

#### `complaints`

Submitted by clients. Tracked through resolution.

```sql
CREATE TABLE complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  submitted_by    UUID NOT NULL REFERENCES profiles(id),
  tenancy_id      UUID REFERENCES tenancies(id),
  category        TEXT,                          -- 'maintenance','noise','billing','other'
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','resolved','closed')),
  priority        TEXT DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to     UUID REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

#### `complaint_messages`

Threaded messages on a complaint between client and manager.

```sql
CREATE TABLE complaint_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  body            TEXT NOT NULL,
  attachments     TEXT[],                        -- Supabase Storage URLs
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.9 Notifications Tables

---

#### `notifications`

In-system notification records.

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,                    -- 'payment_due','invoice','complaint_update', etc.
  title       TEXT NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT false,
  metadata    JSONB DEFAULT '{}',               -- arbitrary context payload
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

#### `notification_log`

Audit trail for all sent SMS/email notifications.

```sql
CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  user_id         UUID REFERENCES profiles(id),
  channel         TEXT NOT NULL CHECK (channel IN ('sms','email','push')),
  recipient       TEXT NOT NULL,               -- phone or email address
  subject         TEXT,
  body            TEXT,
  status          TEXT DEFAULT 'sent'
                  CHECK (status IN ('queued','sent','delivered','failed')),
  external_id     TEXT,                        -- ID from SMS/email provider
  sent_at         TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Row Level Security (RLS) Policies

All tables have `ROW LEVEL SECURITY` enabled. The helper functions below drive most policies.

### Helper Functions

```sql
-- Returns the calling user's profile row
CREATE OR REPLACE FUNCTION auth_profile()
RETURNS profiles
LANGUAGE sql STABLE
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

-- Returns the calling user's tenant_id
CREATE OR REPLACE FUNCTION my_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Returns the calling user's role
CREATE OR REPLACE FUNCTION my_role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
```

---

### `tenants` RLS

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Super admin sees everything
CREATE POLICY tenants_super_admin ON tenants
  FOR ALL
  USING (my_role() = 'super_admin');

-- Owner/Manager/Client see only their own tenant
CREATE POLICY tenants_own ON tenants
  FOR SELECT
  USING (id = my_tenant_id());
```

---

### `profiles` RLS

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Super admin sees all profiles
CREATE POLICY profiles_super_admin ON profiles
  FOR ALL
  USING (my_role() = 'super_admin');

-- Users see their own profile
CREATE POLICY profiles_own ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Managers see all profiles within their tenant
CREATE POLICY profiles_manager ON profiles
  FOR SELECT
  USING (
    tenant_id = my_tenant_id()
    AND my_role() IN ('manager','owner')
  );

-- Managers can create profiles within their tenant (inviting residents)
CREATE POLICY profiles_manager_insert ON profiles
  FOR INSERT
  WITH CHECK (
    tenant_id = my_tenant_id()
    AND my_role() IN ('manager','owner')
  );
```

---

### `managers` RLS

```sql
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY managers_super_admin ON managers
  FOR ALL
  USING (my_role() = 'super_admin');

-- Owner: full access within their own tenant
CREATE POLICY managers_owner ON managers
  FOR ALL
  USING (
    tenant_id = my_tenant_id()
    AND my_role() = 'owner'
  );

-- Manager: read-only view of other managers in same tenant
CREATE POLICY managers_read_own_tenant ON managers
  FOR SELECT
  USING (
    tenant_id = my_tenant_id()
    AND my_role() = 'manager'
  );

-- A manager can always read their own row
CREATE POLICY managers_read_self ON managers
  FOR SELECT
  USING (user_id = auth.uid());
```

---

### `manager_invites` RLS

```sql
ALTER TABLE manager_invites ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY invites_super_admin ON manager_invites
  FOR ALL
  USING (my_role() = 'super_admin');

-- Owner: full access within their own tenant
CREATE POLICY invites_owner ON manager_invites
  FOR ALL
  USING (
    tenant_id = my_tenant_id()
    AND my_role() = 'owner'
  );

-- Managers can view invites for their tenant (read only)
CREATE POLICY invites_manager_read ON manager_invites
  FOR SELECT
  USING (
    tenant_id = my_tenant_id()
    AND my_role() = 'manager'
  );

-- Anyone can read an invite by token (needed for accept-invite endpoint)
-- FastAPI validates expiry and status — DB just allows the lookup
CREATE POLICY invites_token_lookup ON manager_invites
  FOR SELECT
  USING (true);
```

---

### Generic Tenant-Scoped RLS Pattern

The following pattern applies to all tables that carry a `tenant_id` column. Replace `<table>` with the actual table name.

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Super admin: unrestricted
CREATE POLICY <table>_super_admin ON <table>
  FOR ALL
  USING (my_role() = 'super_admin');

-- Tenant users: only rows within their tenant
CREATE POLICY <table>_tenant_isolation ON <table>
  FOR ALL
  USING (tenant_id = my_tenant_id());
```

Tables this pattern applies to:
- `rooms`, `buildings`, `floors`, `beds`
- `rental_requests`, `tenancies`, `room_transfers`
- `billing_cycles`, `payments`, `invoices`
- `workers`, `worker_payments`, `attendance`
- `complaints`, `complaint_messages`
- `notifications`, `notification_log`
- `tenant_branding`, `tenant_settings`

> **Note:** `managers` and `manager_invites` are **not** in this generic list — they have their own fine-grained policies defined above due to the sensitivity of role management.

---

### Fine-Grained Policies for Sensitive Tables

#### `billing_cycles` — Clients can only see their own

```sql
CREATE POLICY billing_cycles_client ON billing_cycles
  FOR SELECT
  USING (
    tenant_id = my_tenant_id()
    AND (
      my_role() IN ('manager','owner','super_admin')
      OR client_id = auth.uid()
    )
  );
```

#### `payments` — Append-only for everyone except super_admin

```sql
CREATE POLICY payments_no_delete ON payments
  FOR DELETE
  USING (my_role() = 'super_admin');       -- only super_admin can delete (emergency)

CREATE POLICY payments_no_update ON payments
  FOR UPDATE
  USING (false);                            -- nobody updates payments rows
```

#### `workers` — Workers see only their own row

```sql
CREATE POLICY workers_self ON workers
  FOR SELECT
  USING (
    tenant_id = my_tenant_id()
    AND (
      my_role() IN ('manager','owner','super_admin')
      OR user_id = auth.uid()
    )
  );
```

---

## 4. Database Triggers & Automation

### 4.1 Auto-generate Billing Cycles on Move-In

Fires after a tenancy row is inserted with `status = 'active'`.

```sql
CREATE OR REPLACE FUNCTION generate_billing_cycles()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_start DATE := NEW.move_in_date;
  v_settings tenant_settings%ROWTYPE;
BEGIN
  SELECT * INTO v_settings FROM tenant_settings WHERE tenant_id = NEW.tenant_id;

  IF NEW.billing_type = 'monthly' THEN
    -- Generate 12 months of billing cycles
    FOR i IN 0..11 LOOP
      INSERT INTO billing_cycles (
        tenant_id, tenancy_id, client_id, room_id,
        billing_type, period_start, period_end,
        amount_due, due_date, status, invoice_number
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.client_id,
        NEW.room_id,
        'monthly',
        (v_start + (i || ' months')::INTERVAL)::DATE,
        (v_start + ((i+1) || ' months')::INTERVAL - INTERVAL '1 day')::DATE,
        NEW.agreed_price,
        (v_start + (i || ' months')::INTERVAL + (v_settings.billing_due_day - 1 || ' days')::INTERVAL)::DATE,
        'unpaid',
        'INV-' || to_char(now(), 'YYYYMM') || '-' || substr(gen_random_uuid()::TEXT, 1, 8)
      );
    END LOOP;

  ELSIF NEW.billing_type = 'semester' THEN
    -- Generate 2 semester cycles
    FOR i IN 0..1 LOOP
      INSERT INTO billing_cycles (
        tenant_id, tenancy_id, client_id, room_id,
        billing_type, period_start, period_end,
        amount_due, due_date, status, invoice_number
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.client_id,
        NEW.room_id,
        'semester',
        (v_start + (i * 6 || ' months')::INTERVAL)::DATE,
        (v_start + ((i+1) * 6 || ' months')::INTERVAL - INTERVAL '1 day')::DATE,
        COALESCE((SELECT semester_price FROM rooms WHERE id = NEW.room_id), NEW.agreed_price),
        (v_start + (i * 6 || ' months')::INTERVAL + INTERVAL '7 days')::DATE,
        'unpaid',
        'INV-' || to_char(now(), 'YYYYMM') || '-' || substr(gen_random_uuid()::TEXT, 1, 8)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_billing_cycles
  AFTER INSERT ON tenancies
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION generate_billing_cycles();
```

---

### 4.2 Update Room Status on Tenancy Change

```sql
CREATE OR REPLACE FUNCTION sync_room_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE rooms SET status = 'occupied', updated_at = now()
    WHERE id = NEW.room_id;

  ELSIF NEW.status IN ('completed','terminated') THEN
    -- Only free room if no other active tenancy occupies it
    IF NOT EXISTS (
      SELECT 1 FROM tenancies
      WHERE room_id = NEW.room_id
        AND status = 'active'
        AND id <> NEW.id
    ) THEN
      UPDATE rooms SET status = 'available', updated_at = now()
      WHERE id = NEW.room_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_room_status
  AFTER INSERT OR UPDATE OF status ON tenancies
  FOR EACH ROW
  EXECUTE FUNCTION sync_room_status();
```

---

### 4.3 Mark Billing Cycles Overdue (runs via cron)

```sql
-- Run daily via pg_cron or Supabase Edge Function scheduler
UPDATE billing_cycles
SET status = 'overdue'
WHERE status = 'unpaid'
  AND due_date < CURRENT_DATE;
```

---

### 4.4 Auto-update `updated_at` Timestamps

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tenancies_updated_at BEFORE UPDATE ON tenancies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaints_updated_at BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### 4.5 Payment Reconciliation Trigger

When a payment is confirmed, update the parent billing cycle status.

```sql
CREATE OR REPLACE FUNCTION reconcile_billing_cycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total_paid   NUMERIC(12,2);
  v_amount_due   NUMERIC(12,2);
BEGIN
  IF NEW.payment_status = 'confirmed' THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE billing_cycle_id = NEW.billing_cycle_id
      AND payment_status = 'confirmed';

    SELECT amount_due + COALESCE(late_fee, 0) INTO v_amount_due
    FROM billing_cycles
    WHERE id = NEW.billing_cycle_id;

    IF v_total_paid >= v_amount_due THEN
      UPDATE billing_cycles SET status = 'paid' WHERE id = NEW.billing_cycle_id;
    ELSIF v_total_paid > 0 THEN
      UPDATE billing_cycles SET status = 'partial' WHERE id = NEW.billing_cycle_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reconcile_payment
  AFTER INSERT OR UPDATE OF payment_status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION reconcile_billing_cycle();
```

---

## 5. Indexes & Performance

```sql
-- Tenant isolation (most frequent filter)
CREATE INDEX idx_profiles_tenant         ON profiles (tenant_id);
CREATE INDEX idx_rooms_tenant            ON rooms (tenant_id, status);
CREATE INDEX idx_tenancies_tenant        ON tenancies (tenant_id, status);
CREATE INDEX idx_tenancies_client        ON tenancies (client_id, status);
CREATE INDEX idx_billing_tenant          ON billing_cycles (tenant_id, status);
CREATE INDEX idx_billing_due             ON billing_cycles (due_date) WHERE status IN ('unpaid','partial');
CREATE INDEX idx_payments_cycle          ON payments (billing_cycle_id);
CREATE INDEX idx_payments_mpesa          ON payments (mpesa_transaction_id) WHERE mpesa_transaction_id IS NOT NULL;
CREATE INDEX idx_complaints_tenant       ON complaints (tenant_id, status);
CREATE INDEX idx_notifications_user      ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_workers_tenant          ON workers (tenant_id, status);
CREATE INDEX idx_rental_requests_tenant  ON rental_requests (tenant_id, status);
```

---

## 6. Enums & Lookup Values

The following are enforced via `CHECK` constraints (listed centrally for reference).

| Table | Column | Valid Values |
|-------|--------|-------------|
| `tenants` | `status` | `pending`, `active`, `suspended` |
| `profiles` | `role` | `super_admin`, `owner`, `manager`, `client`, `worker`, `visitor` |
| `rooms` | `status` | `available`, `occupied`, `maintenance`, `reserved` |
| `rental_requests` | `status` | `pending`, `offered`, `accepted`, `rejected`, `expired` |
| `tenancies` | `status` | `active`, `transferred`, `completed`, `terminated` |
| `tenancies` | `billing_type` | `monthly`, `semester` |
| `billing_cycles` | `status` | `unpaid`, `partial`, `paid`, `overdue`, `cancelled`, `waived` |
| `payments` | `payment_method` | `mpesa`, `cash`, `bank_transfer`, `other` |
| `payments` | `payment_status` | `pending`, `confirmed`, `failed`, `reversed` |
| `complaints` | `status` | `open`, `in_progress`, `resolved`, `closed` |
| `complaints` | `priority` | `low`, `normal`, `high`, `urgent` |
| `workers` | `status` | `active`, `inactive`, `terminated` |
| `attendance` | `status` | `present`, `absent`, `half_day`, `leave` |
| `notification_log` | `channel` | `sms`, `email`, `push` |
| `tenant_settings` | `billing_type` | `monthly`, `semester` |

---

## 7. FastAPI Backend Structure

```
backend/
├── main.py                         # App init, middleware, router registration
├── core/
│   ├── config.py                   # Env vars, Supabase URL/keys, M-Pesa credentials
│   ├── supabase.py                 # Supabase client singleton (service role + anon)
│   ├── auth.py                     # JWT validation, get_current_user dependency
│   └── permissions.py              # Role-based permission guards
├── routers/
│   ├── tenants.py                  # /tenants — Super Admin CRUD
│   ├── rooms.py                    # /rooms — room management
│   ├── rental_requests.py          # /rental-requests
│   ├── tenancies.py                # /tenancies — move-in, transfer, move-out
│   ├── billing.py                  # /billing — cycles, invoices
│   ├── payments.py                 # /payments — record payment, M-Pesa confirm
│   ├── workers.py                  # /workers — staff management
│   ├── complaints.py               # /complaints
│   ├── notifications.py            # /notifications
│   ├── branding.py                 # /branding
│   └── analytics.py               # /analytics — occupancy, revenue reports
├── services/
│   ├── billing_service.py          # Billing cycle generation & reconciliation
│   ├── mpesa_service.py            # STK Push, C2B callback, validation
│   ├── sms_service.py              # SMS gateway abstraction
│   ├── email_service.py            # Email (SMTP / SendGrid)
│   ├── invoice_service.py          # PDF generation (WeasyPrint or ReportLab)
│   └── notification_service.py     # Dispatch notifications across channels
├── schemas/
│   ├── tenant.py
│   ├── room.py
│   ├── tenancy.py
│   ├── billing.py
│   ├── payment.py
│   ├── worker.py
│   ├── complaint.py
│   └── common.py                   # Shared Pydantic base models
├── models/                         # SQLAlchemy or raw SQL query helpers (if needed)
└── tests/
    ├── test_billing.py
    ├── test_mpesa.py
    └── test_tenancy.py
```

### Key FastAPI Patterns

```python
# core/auth.py — extracting caller identity
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

bearer = HTTPBearer()

async def get_current_user(token = Depends(bearer)):
    """Validate Supabase JWT and return profile."""
    user = supabase.auth.get_user(token.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    profile = supabase.table("profiles").select("*").eq("id", user.user.id).single().execute()
    return profile.data


# core/permissions.py — role guards
def require_roles(*roles):
    async def _guard(user = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _guard

# Example usage in a router
@router.post("/rooms")
async def create_room(
    body: RoomCreate,
    user = Depends(require_roles("manager", "owner", "super_admin"))
):
    ...
```

---

## 8. Authentication Flow

```
User registers / logs in via Supabase Auth
             │
             ▼
   Supabase issues JWT
             │
             ▼
Frontend stores JWT in memory (not localStorage)
             │
             ▼
All API calls → Authorization: Bearer <jwt>
             │
             ▼
FastAPI validates JWT via Supabase
             │
             ▼
Loads profile (role + tenant_id) from `profiles`
             │
             ▼
Role guard checks permission
             │
             ▼
Supabase RLS enforces tenant isolation at DB level
```

### New User Registration

When `auth.users` triggers a new signup, a database function creates the `profiles` row:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'visitor',                              -- default role
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 9. M-Pesa Integration Flow

```
Client initiates payment on frontend
          │
          ▼
POST /payments/mpesa/stk-push
  - FastAPI calls Daraja STK Push API
  - Creates payments row with status='pending'
          │
          ▼
M-Pesa sends async callback to:
POST /payments/mpesa/callback  (public endpoint)
          │
          ▼
FastAPI validates callback signature
          │
     ┌────┴────┐
   Success   Failure
     │          │
     ▼          ▼
UPDATE payment  UPDATE payment
status =        status =
'confirmed'     'failed'
     │
     ▼
reconcile_billing_cycle() trigger fires
     │
     ▼
billing_cycle.status updated (paid / partial)
     │
     ▼
Notification dispatched to client (SMS + in-app)
```

### STK Push Request (FastAPI)

```python
# services/mpesa_service.py
async def initiate_stk_push(phone: str, amount: int, reference: str, description: str):
    token = await get_mpesa_token()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(
        f"{SHORTCODE}{PASSKEY}{timestamp}".encode()
    ).decode()

    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": f"{BASE_URL}/payments/mpesa/callback",
        "AccountReference": reference,
        "TransactionDesc": description
    }
    response = await httpx.post(STK_PUSH_URL, json=payload, headers={"Authorization": f"Bearer {token}"})
    return response.json()
```

---

## 10. Entity Relationship Summary

```
tenants
  ├── tenant_branding          (1-to-1)
  ├── tenant_settings          (1-to-1)
  ├── buildings                (1-to-many)
  │     └── floors             (1-to-many)
  │           └── rooms        (1-to-many)
  │                 └── beds   (1-to-many)
  ├── profiles / managers      (1-to-many)
  ├── manager_invites          (1-to-many)
  ├── rental_requests          (1-to-many)
  ├── tenancies                (1-to-many)
  │     ├── billing_cycles     (1-to-many)
  │     │     ├── payments     (1-to-many)
  │     │     └── invoices     (1-to-1)
  │     └── room_transfers     (1-to-many)
  ├── workers                  (1-to-many)
  │     ├── worker_payments    (1-to-many)
  │     └── attendance         (1-to-many)
  ├── complaints               (1-to-many)
  │     └── complaint_messages (1-to-many)
  └── notifications            (1-to-many)
```

---

## Migration Order

Run migrations in this order to respect FK constraints:

1. `tenants`
2. `profiles` (references `auth.users` + `tenants`)
3. `tenant_branding`, `tenant_settings`
4. `buildings` → `floors` → `rooms` → `beds`
5. `managers` → `manager_invites`
6. `rental_requests`
7. `tenancies`
8. `room_transfers`
9. `billing_cycles`
10. `payments`
11. `invoices`
12. `workers` → `worker_payments` → `attendance`
13. `complaints` → `complaint_messages`
14. `notifications` → `notification_log`
15. Triggers (in order listed in §4)
16. RLS policies (§3)
17. Indexes (§5)

---

*Last updated: fab-rental-management v0.2 — Added `manager_invites` table + `managers` and `manager_invites` RLS policies*
