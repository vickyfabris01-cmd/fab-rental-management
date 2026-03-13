# fab-rental-management — UI/UX Structure Reference

> **Stack:** React + Vite · Tailwind CSS · Supabase Auth · React Router v6
> **Design System:** Warm terracotta + deep charcoal · Playfair Display + DM Sans

---

## Table of Contents

1. [Design System & Tokens](#1-design-system--tokens)
2. [Application Shell & Routing](#2-application-shell--routing)
3. [Navigation Structures by Role](#3-navigation-structures-by-role)
4. [Page Inventory](#4-page-inventory)
   - 4.1 [Public / Visitor Pages](#41-public--visitor-pages)
   - 4.2 [Auth Pages](#42-auth-pages)
   - 4.3 [Client (Resident) Pages](#43-client-resident-pages)
   - 4.4 [Manager Pages](#44-manager-pages)
   - 4.5 [Owner Pages](#45-owner-pages)
   - 4.6 [Super Admin Pages](#46-super-admin-pages)
   - 4.7 [Worker Pages](#47-worker-pages)
5. [Shared Components Library](#5-shared-components-library)
6. [Layout Patterns](#6-layout-patterns)
7. [User Flow Diagrams](#7-user-flow-diagrams)
8. [Route Map](#8-route-map)
9. [State Management](#9-state-management)
10. [Responsive Breakpoints](#10-responsive-breakpoints)
11. [Accessibility & UX Standards](#11-accessibility--ux-standards)
12. [Page-by-Page Component Breakdown](#12-page-by-page-component-breakdown)

---

## 1. Design System & Tokens

### 1.1 Color Palette

```js
// tailwind.config.js — extend colors
colors: {
  brand: {
    primary:    '#C5612C',   // Terracotta — CTAs, active states, accents
    dark:       '#A84E22',   // Terracotta hover
    light:      '#FFF5EF',   // Terracotta tint — backgrounds, badges
    border:     '#C5612C26', // Terracotta 15% opacity — card borders
  },
  surface: {
    base:       '#FAF7F2',   // Warm off-white — page background
    card:       '#FFFFFF',   // Pure white — card backgrounds
    muted:      '#F5EDE0',   // Warm sand — secondary surfaces
    border:     '#E8DDD4',   // Light border
  },
  ink: {
    DEFAULT:    '#1A1412',   // Near-black — primary text
    muted:      '#5C4A3A',   // Medium brown — secondary text
    subtle:     '#8B7355',   // Light brown — placeholder, captions
  },
  dark: {
    bg:         '#1A1412',   // Dark charcoal — dark sections, sidebar
    surface:    '#2D1E16',   // Dark card bg
    border:     '#FFFFFF1A', // White 10% — dark mode borders
    text:       '#F5EDE0',   // Light text on dark
    muted:      '#A89080',   // Muted text on dark
  },
  status: {
    success:    '#10B981',
    warning:    '#F59E0B',
    error:      '#EF4444',
    info:       '#3B82F6',
    successBg:  '#ECFDF5',
    warningBg:  '#FFFBEB',
    errorBg:    '#FEF2F2',
    infoBg:     '#EFF6FF',
  }
}
```

### 1.2 Typography

```js
// Font pairing
fontFamily: {
  display: ['Playfair Display', 'Georgia', 'serif'],  // headings, hero text
  sans:    ['DM Sans', 'system-ui', 'sans-serif'],     // body, UI, labels
}

// Scale usage
// text-xs    (12px) — labels, badges, captions, table headers
// text-sm    (14px) — body text, form inputs, nav items
// text-base  (16px) — card body, descriptions
// text-lg    (18px) — card headings, section subtitles
// text-xl    (20px) — page subtitles
// text-2xl   (24px) — section headings
// text-3xl+  (30px+) — font-display only, hero / page titles
```

### 1.3 Spacing & Radius

```
Spacing scale: 4px base unit (Tailwind default)
Page padding:  px-6 (24px mobile) · px-8 (32px tablet) · px-10+ (desktop)
Section gap:   py-16 (64px) between major sections
Card padding:  p-6 (24px) standard · p-4 (16px) compact

Border radius:
  rounded-xl   (12px) — inputs, small cards
  rounded-2xl  (16px) — cards, modals
  rounded-3xl  (24px) — large feature cards
  rounded-full        — buttons (pill), badges, avatars
```

### 1.4 Shadows

```css
shadow-card:   0 2px 8px rgba(0,0,0,0.06)
shadow-hover:  0 12px 32px rgba(0,0,0,0.10)
shadow-modal:  0 24px 64px rgba(0,0,0,0.16)
shadow-brand:  0 8px 24px rgba(197,97,44,0.20)
```

### 1.5 Motion Tokens

```css
/* Page transitions */
transition-page: opacity 200ms ease, transform 200ms ease

/* Card hover */
transition-card: transform 300ms cubic-bezier(.22,.68,0,1.2), box-shadow 300ms ease

/* Micro interactions */
transition-fast: all 150ms ease
transition-base: all 250ms ease

/* Loading states */
animate-spin     — spinner
animate-pulse    — skeleton loaders, live indicators
animate-bounce   — notification badges (use sparingly)
```

### 1.6 Component Token Reference

| Element | Classes |
|---------|---------|
| Primary button | `bg-brand-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-dark transition-base` |
| Secondary button | `border border-surface-border text-ink px-6 py-3 rounded-full font-medium hover:border-brand-primary transition-base` |
| Ghost button | `text-brand-primary font-medium hover:underline transition-base` |
| Danger button | `bg-red-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-600` |
| Input field | `w-full px-4 py-3.5 border border-surface-border rounded-xl text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-border outline-none` |
| Badge — paid | `bg-status-successBg text-status-success text-xs font-semibold px-2.5 py-1 rounded-full` |
| Badge — overdue | `bg-status-errorBg text-status-error text-xs font-semibold px-2.5 py-1 rounded-full` |
| Badge — pending | `bg-status-warningBg text-status-warning text-xs font-semibold px-2.5 py-1 rounded-full` |
| Section label | `text-brand-primary text-xs font-semibold uppercase tracking-widest` |
| Page title | `font-display text-3xl lg:text-4xl font-black text-ink` |
| Card | `bg-white rounded-2xl border border-surface-border p-6 shadow-card` |

---

## 2. Application Shell & Routing

### 2.1 Entry Point Logic

On app load, `App.jsx` checks auth state and routes accordingly:

```
App Load
  │
  ├─ No session → PublicPage (/)
  │
  └─ Session exists → fetch profile
        │
        ├─ role: visitor     → /browse
        ├─ role: client       → /dashboard
        ├─ role: manager      → /manage
        ├─ role: owner        → /owner
        ├─ role: worker       → /worker
        └─ role: super_admin  → /admin
```

### 2.2 Layout Shells

There are **4 distinct layout shells** used across the application:

| Shell | Used By | Structure |
|-------|---------|-----------|
| `PublicLayout` | Visitor, Public pages | Top navbar + full-width content + footer |
| `AuthLayout` | Login, Signup pages | Split panel (decorative left + form right) |
| `DashboardLayout` | Client, Manager, Owner, Worker | Sidebar (desktop) + top bar + main content area |
| `AdminLayout` | Super Admin | Wider sidebar + denser data layout + no branding |

### 2.3 DashboardLayout Structure

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (fixed, 260px desktop / drawer mobile)         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Logo + Tenant Branding                           │  │
│  │  ─────────────────────────────────                │  │
│  │  Navigation Items (role-based)                    │  │
│  │  ─────────────────────────────────                │  │
│  │  User Avatar + Name + Role Badge                  │  │
│  │  Sign Out                                         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  MAIN AREA (flex-1, scrollable)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  TOPBAR (sticky, 64px)                            │  │
│  │  Page Title · Breadcrumb · Actions · Notif Bell   │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  PAGE CONTENT (px-6 py-8)                         │  │
│  │  ...                                              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.4 Tenant Branding Injection

When a logged-in user's tenant has branding configured, the DashboardLayout injects CSS variables:

```js
// On mount, after fetching tenant_branding
document.documentElement.style.setProperty('--brand-primary', branding.primary_color)
document.documentElement.style.setProperty('--brand-secondary', branding.secondary_color)
document.documentElement.style.setProperty('--brand-font', branding.font_family)
```

---

## 3. Navigation Structures by Role

### 3.1 Visitor (Public Navbar)

```
fabrentals logo    [Properties]  [How It Works]  [For Managers]  [Pricing]    [Sign In]  [Get Started →]
```

Mobile: hamburger → slide-down menu

---

### 3.2 Client (Resident) Sidebar

```
🏠  fabrentals                     ← tenant logo if available
─────────────────────
📊  Dashboard                      /dashboard
🏡  My Room                        /dashboard/room
📄  Billing & Invoices             /dashboard/billing
💳  Payments                       /dashboard/payments
🔁  Request Room Transfer          /dashboard/transfer-request
💬  Complaints                     /dashboard/complaints
🔔  Notifications                  /dashboard/notifications
─────────────────────
👤  My Profile                     /dashboard/profile
🚪  Sign Out
```

---

### 3.3 Manager Sidebar

```
🏠  fabrentals [Tenant Name]
─────────────────────
📊  Dashboard                      /manage
🏢  Properties                     /manage/properties
   ├── Buildings                   /manage/properties/buildings
   ├── Rooms                       /manage/properties/rooms
   └── Beds                        /manage/properties/beds
👥  Residents                      /manage/residents
   ├── All Residents               /manage/residents
   ├── Rental Requests             /manage/residents/requests
   └── Move-In / Move-Out          /manage/residents/tenancies
💰  Billing                        /manage/billing
   ├── Billing Cycles              /manage/billing/cycles
   ├── Payments                    /manage/billing/payments
   └── Invoices                    /manage/billing/invoices
👷  Workforce                      /manage/workforce
   ├── Workers                     /manage/workforce/workers
   ├── Salaries                    /manage/workforce/salaries
   └── Attendance                  /manage/workforce/attendance
💬  Complaints                     /manage/complaints
📢  Announcements                  /manage/announcements
🔔  Notifications                  /manage/notifications
─────────────────────
⚙️  Settings                       /manage/settings
   ├── Branding                    /manage/settings/branding
   ├── Billing Config              /manage/settings/billing
   └── SMS / Email                 /manage/settings/notifications
👤  My Profile                     /manage/profile
🚪  Sign Out
```

---

### 3.4 Owner Sidebar

```
📊  fabrentals [Tenant Name]
─────────────────────
📊  Overview                       /owner
🏢  Occupancy Report               /owner/occupancy
💰  Financial Summary              /owner/financials
📄  Billing Overview               /owner/billing
👷  Worker Costs                   /owner/workforce
📈  Analytics                      /owner/analytics
─────────────────────
👤  My Profile                     /owner/profile
🚪  Sign Out
```

---

### 3.5 Super Admin Sidebar

```
⚡  fabrentals ADMIN
─────────────────────
📊  Platform Overview              /admin
🏢  Tenants                        /admin/tenants
   ├── All Tenants                 /admin/tenants
   ├── Pending Approval            /admin/tenants/pending
   └── Suspended                   /admin/tenants/suspended
👥  All Users                      /admin/users
💰  Platform Revenue               /admin/revenue
📊  System Analytics               /admin/analytics
⚙️  System Settings                /admin/settings
🛡️  Audit Logs                     /admin/audit
─────────────────────
👤  Admin Profile                  /admin/profile
🚪  Sign Out
```

---

### 3.6 Worker Sidebar

```
👷  fabrentals
─────────────────────
📊  My Overview                    /worker
💵  Pay History                    /worker/payments
📅  Attendance                     /worker/attendance
─────────────────────
👤  My Profile                     /worker/profile
🚪  Sign Out
```

---

## 4. Page Inventory

### 4.1 Public / Visitor Pages

---

#### `PublicPage` — `/`

**Purpose:** Marketing landing + property discovery for unauthenticated visitors.

**Sections:**
1. **Navbar** — logo, links, sign in / get started CTAs
2. **Hero** — headline, subtext, two CTAs (Browse / List Property), property card preview with floating badges
3. **Stats Bar** — 4 platform statistics in dark background band
4. **Properties Section** — search input + type filter tabs + responsive property grid
5. **How It Works** — 4-step horizontal flow
6. **CTA Banner** — warm gradient panel with sign-up and browse buttons
7. **Footer** — logo, legal links, copyright

**Key Interactions:**
- Navbar becomes opaque + shadow on scroll past 40px
- Filter tabs update property grid without page reload
- Search filters in real-time (debounced 300ms)
- Property cards animate up on hover, image zooms
- "Request" button on card → redirect to `/signup` if not logged in

**Data needed:** `rooms` (public, available only) + `tenant_branding` per property

---

#### `BrowsePage` — `/browse`

**Purpose:** Full browse experience for logged-in visitors with no active tenancy.

**Sections:**
1. **Topbar** — search, location filter, price range slider, type filter
2. **Map + List Toggle** (optional future feature placeholder)
3. **Property Grid** — same cards as PublicPage but with "Request Room" modal
4. **Empty State** — when no results match filters

**Key Interactions:**
- Filter sidebar on desktop, bottom sheet on mobile
- "Request Room" opens `<RentalRequestModal>` inline
- After request submitted → success toast + request status badge on card

---

#### `PropertyDetailPage` — `/property/:tenantSlug`

**Purpose:** Full detail view of a specific tenant's available rooms.

**Sections:**
1. **Property Hero** — cover image, name, location, rating, type badge
2. **Amenities Grid** — icon + label cards
3. **Available Rooms Table/Grid** — room number, type, price, capacity, status
4. **Gallery** — image grid (lightbox on click)
5. **Request Form** — preferred move-in date, message, submit button
6. **Location Map** (static map embed placeholder)

---

### 4.2 Auth Pages

---

#### `LoginPage` — `/login`

**Layout:** `AuthLayout` — split panel

**Left Panel (decorative):**
- Brand gradient background with circle pattern
- Logo
- Animated floating activity cards (billing due, payment confirmed, complaint resolved)
- Manager register link

**Right Panel (form):**
- Page title + subtitle
- Email input
- Password input with show/hide toggle
- Remember me checkbox
- Forgot password link (triggers inline forgot-password mode)
- Sign In button (with spinner during loading)
- Google OAuth button
- Role quick-select tiles (Resident / Manager / Owner) — informational only
- Link to signup

**Forgot Password Mode (inline, no redirect):**
- Back arrow
- Email input
- Send Reset Link button
- Success state: envelope illustration + confirmation text

**Validation:**
- Email: required, valid format
- Password: required
- Errors shown inline below each field

---

#### `SignupPage` — `/signup`

**Layout:** `AuthLayout` — split panel

**Left Panel (decorative):**
- Dark background with hexagonal pattern
- Logo
- Headline: "Your Next Home Starts Here."
- Feature checklist (4 items)
- Testimonial card

**Right Panel (form) — 2 steps:**

**Step 1 — Credentials:**
- Step progress indicator (1 → 2)
- Email input
- Password input with strength meter (4-segment bar: Weak / Fair / Good / Strong)
- Confirm password input
- Continue → button
- Google sign-up divider + button

**Step 2 — Personal Info:**
- Full name input
- Phone number input with `🇰🇪 +254` prefix
- Account type info box (visitor → client upgrade explanation)
- Terms & privacy checkbox
- Back + Create Account buttons

**Validation:**
- Step 1: email format, password min 8 chars, passwords match
- Step 2: full name required, valid KE phone, terms accepted

---

#### `AcceptInvitePage` — `/invite/:token`

**Purpose:** Handles manager invite links sent via email.

**States:**
1. **Loading** — validating token
2. **Valid token** — shows tenant name, inviter name, "Accept & Create Account" form (name, password)
3. **Already accepted** — redirects to login
4. **Expired token** — error state + "contact your manager" message
5. **Invalid token** — 404-style error

---

#### `ResetPasswordPage` — `/reset-password`

**Purpose:** Handles Supabase password reset link.

**Form:** New password + confirm password + strength meter + Set Password button

---

### 4.3 Client (Resident) Pages

All pages use `DashboardLayout` with client sidebar.

---

#### `ClientDashboard` — `/dashboard`

**Purpose:** At-a-glance overview of the resident's current status.

**Layout:** `DashboardLayout`

**Content Sections:**

**1. Welcome Banner**
- "Good morning, [Name]" heading
- Current room + building
- Active tenancy start date
- Move-out date (if known)

**2. Quick Stats Row (4 cards)**
| Card | Data |
|------|------|
| Current Balance | Amount outstanding |
| Next Due Date | Upcoming billing cycle due date |
| Tenancy Status | Active / days remaining |
| Open Complaints | Count of unresolved complaints |

**3. Billing Snapshot**
- Current billing cycle progress bar (amount paid / amount due)
- Pay Now button (triggers M-Pesa modal)
- View all billing link

**4. Recent Payment History**
- Last 3 payments — date, amount, method, status badge
- View all link

**5. Active Complaints**
- Up to 2 most recent open complaints
- Status badge (Open / In Progress)
- View all link

**6. Notifications Feed**
- Last 5 unread notifications
- Mark all read button

---

#### `MyRoomPage` — `/dashboard/room`

**Sections:**
1. **Room Detail Card** — room number, building, floor, type, capacity, amenities list, images gallery
2. **Tenancy Summary** — move-in date, billing type, agreed price, approved by
3. **Room Transfer Request Button** → opens `<TransferRequestModal>`
4. **Transfer History** — past room transfers if any

---

#### `BillingPage` — `/dashboard/billing`

**Sections:**
1. **Page Header** — "Billing & Invoices" + current billing type badge

**2. Billing Cycles Table**

| Column | Content |
|--------|---------|
| Period | "Jan 2025 – Feb 2025" |
| Amount Due | KES formatted |
| Late Fee | if applicable |
| Due Date | formatted date |
| Status | paid / partial / unpaid / overdue badge |
| Paid | amount paid |
| Balance | remaining |
| Actions | View Invoice · Pay Now |

- Row highlight: overdue rows get red-tinted background
- Sticky header on scroll

**3. Summary Sidebar / Section**
- Total paid to date
- Total outstanding
- Next payment due

---

#### `PaymentsPage` — `/dashboard/payments`

**Sections:**
1. **Payments Table**

| Column | Content |
|--------|---------|
| Date | formatted datetime |
| Amount | KES formatted |
| Method | M-Pesa / Cash badge |
| M-Pesa Ref | transaction ID (truncated) |
| Billing Period | linked |
| Status | confirmed / pending / failed badge |

2. **Pay Rent CTA Panel** — large card with M-Pesa button if balance > 0

---

#### `TransferRequestPage` — `/dashboard/transfer-request`

**Sections:**
1. **Current Room Summary**
2. **Available Rooms Grid** — filterable by type/floor/price
3. **Transfer Request Form**
   - Select room dropdown
   - Preferred transfer date
   - Reason (textarea)
   - Submit button
4. **Transfer Request History** — past requests + status

---

#### `ClientComplaintsPage` — `/dashboard/complaints`

**Sections:**
1. **New Complaint Button** → opens `<NewComplaintModal>`
2. **Complaints List**
   - Each item: title, category badge, priority badge, status badge, created date, last update
   - Click → expand inline thread view OR navigate to detail page
3. **Complaint Detail View** (modal or sub-page `/dashboard/complaints/:id`)
   - Title + category + priority + status
   - Description
   - Message thread (client ↔ manager)
   - Message input (textarea + send button)
   - Attachments

---

#### `NotificationsPage` — `/dashboard/notifications`

**Sections:**
1. **Filter tabs** — All · Unread · Billing · Complaints · System
2. **Notifications List**
   - Icon by type · title · body · time ago
   - Unread: bold title + left colored border
   - Read: muted
3. **Mark All Read** button (top right)

---

#### `ClientProfilePage` — `/dashboard/profile`

**Sections:**
1. **Avatar Upload** — click to upload image to Supabase Storage
2. **Personal Info Form** — full name, phone, email (read-only)
3. **Change Password** section (separate form)
4. **Tenancy History** — past tenancies (read-only, historical records)

---

### 4.4 Manager Pages

All pages use `DashboardLayout` with manager sidebar.

---

#### `ManagerDashboard` — `/manage`

**Quick Stats Row (6 cards)**
| Card | Data |
|------|------|
| Total Rooms | count |
| Occupied Rooms | count + % bar |
| Vacant Rooms | count |
| Pending Requests | count + badge |
| Overdue Payments | count + amount |
| Open Complaints | count |

**Sections:**
1. **Occupancy Overview** — building-by-building occupancy progress bars
2. **Pending Rental Requests** — top 5, quick approve/reject actions
3. **Overdue Billing Cycles** — top 5, with resident name + amount
4. **Recent Payments** — last 5 payments received
5. **Open Complaints** — top 5, priority-sorted
6. **Workforce Salary Calendar** — upcoming salary due dates

---

#### `PropertiesPage` — `/manage/properties`

**Sub-pages / Tabs:**

**Buildings Tab:**
- Buildings list (name, address, floor count, room count)
- Add Building button → `<BuildingFormModal>`
- Edit / Delete per building

**Rooms Tab:**
- Filter bar: building, floor, status, room type
- Rooms table:

| Column | Content |
|--------|---------|
| Room # | |
| Building / Floor | |
| Type | single / double / dorm |
| Capacity | |
| Price | KES/mo |
| Status | available / occupied / maintenance / reserved badge |
| Tenant | current resident name (if occupied) |
| Actions | Edit · View · Toggle Status |

- Add Room button → `<RoomFormModal>`

**Beds Tab:**
- Beds per room view
- Toggle individual bed occupancy

---

#### `RentalRequestsPage` — `/manage/residents/requests`

**Filter tabs:** All · Pending · Offered · Accepted · Rejected

**Requests Table:**
| Column | Content |
|--------|---------|
| Applicant | avatar + name |
| Room Requested | room number + type |
| Preferred Move-In | date |
| Message | truncated preview |
| Submitted | time ago |
| Status | badge |
| Actions | View · Approve · Make Offer · Reject |

**Request Detail Modal / Drawer:**
- Full applicant profile
- Room details
- Message
- Action buttons: Approve Move-In | Make Offer | Reject
- Rejection reason textarea (when rejecting)

---

#### `TenanciesPage` — `/manage/residents/tenancies`

**Filter tabs:** Active · Completed · Terminated

**Tenancies Table:**
| Column | Content |
|--------|---------|
| Resident | avatar + name |
| Room | number + building |
| Move-In | date |
| Move-Out | date or "Active" |
| Billing Type | monthly / semester badge |
| Agreed Price | KES |
| Status | badge |
| Actions | View · Transfer · Move-Out |

**Move-Out Modal:**
- Confirm move-out date
- Final billing cycle settlement summary
- Confirm button

---

#### `ResidentsPage` — `/manage/residents`

**Sections:**
1. **Residents Search + Filter** bar
2. **Residents Grid / Table**
   - Avatar, name, room, move-in date, billing status, complaint count
   - Click → `ResidentDetailPage`

**`ResidentDetailPage` — `/manage/residents/:id`**
- Profile info
- Current tenancy summary
- Billing cycles mini-table
- Payments mini-table
- Complaints list
- Room transfer history

---

#### `ManagerBillingPage` — `/manage/billing/cycles`

**Filter:** tenant-wide or by resident, date range, status

**Billing Cycles Table** (same structure as client view but for all residents)

Additional columns: Resident Name, Room

**Bulk Actions:**
- Mark selected as waived
- Export to CSV

---

#### `ManagerPaymentsPage` — `/manage/billing/payments`

**Sections:**
1. **Record Manual Payment** button → `<ManualPaymentModal>`
2. **Payments Table** (all residents)
   - Additional column: Recorded By
3. **M-Pesa Reconciliation Panel**
   - Pending/unmatched M-Pesa transactions
   - Manual match button

**`<ManualPaymentModal>`:**
- Select resident dropdown
- Select billing cycle dropdown (auto-filtered by resident)
- Amount
- Payment method (cash / bank transfer / other)
- Notes
- Confirm Payment button

---

#### `InvoicesPage` — `/manage/billing/invoices`

**Invoices Table:**
| Column | Content |
|--------|---------|
| Invoice # | |
| Resident | |
| Period | |
| Amount | KES |
| Issued Date | |
| Actions | Download PDF · Resend Email |

- Generate Invoice button (creates PDF via backend, stores in Supabase Storage)

---

#### `WorkforcePage` — `/manage/workforce/workers`

**Workers Table:**
| Column | Content |
|--------|---------|
| Worker | avatar + name |
| Role | security / cleaner / etc. |
| Phone | |
| Salary | KES/mo |
| Pay Cycle | weekly / biweekly / monthly |
| Status | active / inactive badge |
| Actions | Pay · Edit · Deactivate |

- Add Worker button → `<WorkerFormModal>`

**`<WorkerFormModal>`:**
- Full name, phone, ID number
- Role (dropdown)
- Salary amount
- Pay cycle
- Start date
- Optional: link to existing user account

---

#### `WorkerSalariesPage` — `/manage/workforce/salaries`

**Sections:**
1. **Upcoming Payments** — workers with salary due in next 7 days
2. **Payment History Table**
   - Worker, period, amount, method, M-Pesa ref, status, paid at
   - Record Payment button per worker

---

#### `AttendancePage` — `/manage/workforce/attendance`

**Layout:** Calendar grid view (monthly) per worker

- Date cells: present ✅ / absent ❌ / half-day 🌓 / leave 🏖️
- Bulk mark attendance per day
- Export attendance report

---

#### `ManagerComplaintsPage` — `/manage/complaints`

**Filter tabs:** All · Open · In Progress · Resolved · Closed

**Filter:** by priority, category, assigned to

**Complaints Table:**
| Column | Content |
|--------|---------|
| Resident | name |
| Title | |
| Category | |
| Priority | badge (low / normal / high / urgent) |
| Status | badge |
| Assigned To | manager name |
| Created | time ago |
| Actions | View · Assign · Update Status |

**Complaint Detail Page `/manage/complaints/:id`:**
- Full details + message thread
- Status update dropdown
- Assign to manager dropdown
- Priority update
- Internal notes field (not visible to client)

---

#### `AnnouncementsPage` — `/manage/announcements`

**Sections:**
1. **Past Announcements List** — title, audience, sent at, channel badges
2. **New Announcement Form**
   - Title
   - Body (rich text or textarea)
   - Audience: All Residents / Specific Building / Specific Floor
   - Channel: In-App · SMS · Email (multi-select toggles)
   - Schedule or Send Now

---

#### `ManagerSettingsPage` — `/manage/settings`

**Sub-sections (tabs):**

**Branding Tab:**
- Logo upload (drag-drop to Supabase Storage)
- Primary color picker
- Secondary color picker
- Font family dropdown
- Tagline input
- Live preview card
- Save button

**Billing Config Tab:**
- Billing type toggle (Monthly / Semester)
- Billing due day (number input 1-28)
- Grace period (days)
- Late fee percentage
- Currency (locked to KES for now)
- M-Pesa shortcode
- M-Pesa passkey (masked)
- Save button

**Notifications Tab:**
- SMS enabled toggle
- Email enabled toggle
- Notification triggers checklist:
  - Payment received ✓
  - Invoice generated ✓
  - Overdue reminder ✓
  - Complaint status update ✓
  - Move-in confirmed ✓

---

### 4.5 Owner Pages

All pages use `DashboardLayout` with owner sidebar. Read-only throughout — no create/edit actions.

---

#### `OwnerDashboard` — `/owner`

**Stats Row (6 cards):**
| Card | Data |
|------|------|
| Total Units | room count |
| Occupancy Rate | % with circular gauge |
| Monthly Revenue | expected vs collected |
| Outstanding Rent | total overdue |
| Worker Payroll | monthly total |
| Net Cash Flow | revenue - payroll |

**Sections:**
1. Revenue vs Expenses chart (line/bar — last 6 months)
2. Occupancy trend chart (last 12 months)
3. Top Performing Buildings table
4. Recent Large Payments

---

#### `OccupancyReportPage` — `/owner/occupancy`

**Sections:**
1. **Building Breakdown Table** — name, total rooms, occupied, vacant, occupancy %
2. **Floor-Level Drilldown** (expandable rows)
3. **Occupancy Heatmap** by month (optional)
4. **Export PDF / CSV** buttons

---

#### `FinancialSummaryPage` — `/owner/financials`

**Sections:**
1. **Date Range Picker** (month / quarter / year / custom)
2. **Revenue Summary Cards** — expected, collected, outstanding, overdue
3. **Monthly Revenue Chart** (bar chart)
4. **Billing Cycles Breakdown Table** — by status, filtered by date range
5. **Export** button

---

#### `OwnerBillingPage` — `/owner/billing`

- Same as manager billing table but read-only
- No record payment actions

---

#### `WorkerCostsPage` — `/owner/workforce`

- Worker list with salary costs
- Monthly payroll total
- Payment history chart
- Export CSV

---

#### `AnalyticsPage` — `/owner/analytics`

**Charts:**
1. Occupancy over time (line chart)
2. Revenue collected vs expected (grouped bar chart)
3. Complaint resolution time (average)
4. Payment method breakdown (pie/donut — M-Pesa vs Cash vs Other)
5. Billing status distribution (donut chart)

---

### 4.6 Super Admin Pages

All pages use `AdminLayout`.

---

#### `AdminDashboard` — `/admin`

**Platform Stats Row:**
| Card | Data |
|------|------|
| Total Tenants | active + pending |
| Total Users | all profiles |
| Monthly Transactions | payment volume |
| Platform Revenue | (if subscription model) |

**Sections:**
1. New tenant sign-ups (last 30 days) chart
2. Pending tenant approvals list (quick approve/suspend buttons)
3. System health indicators
4. Recent audit log entries

---

#### `AdminTenantsPage` — `/admin/tenants`

**Filter tabs:** All · Pending · Active · Suspended

**Tenants Table:**
| Column | Content |
|--------|---------|
| Tenant Name | logo + name + slug |
| Owner | name + email |
| Status | badge |
| Rooms | total count |
| Residents | active tenancy count |
| Joined | date |
| Actions | Approve · Suspend · View |

**Tenant Detail Page `/admin/tenants/:id`:**
- Full tenant info
- Branding settings (read-only)
- Manager list
- Room count, resident count
- Revenue stats
- Audit activity

---

#### `AdminUsersPage` — `/admin/users`

**Users Table:**
| Column | Content |
|--------|---------|
| User | avatar + name + email |
| Role | badge |
| Tenant | name |
| Status | active / inactive |
| Joined | date |
| Actions | View · Edit Role · Suspend |

---

#### `AdminAuditPage` — `/admin/audit`

**Audit Log Table:**
| Column | Content |
|--------|---------|
| Timestamp | datetime |
| Actor | user + role |
| Action | description |
| Table | affected table |
| Record ID | UUID (truncated) |
| IP Address | |

- Filter by date, actor, action type
- Export CSV

---

### 4.7 Worker Pages

---

#### `WorkerDashboard` — `/worker`

**Sections:**
1. **Greeting Card** — name, role, tenant name
2. **Salary Summary Card** — monthly salary, last paid date, next expected payment
3. **Recent Payments** — last 3 salary payments
4. **Attendance This Month** — calendar mini-view (read-only)

---

#### `WorkerPaymentsPage` — `/worker/payments`

**Payments Table:**
| Column | Content |
|--------|---------|
| Period | month / date range |
| Amount | KES |
| Method | M-Pesa / Cash badge |
| M-Pesa Ref | if applicable |
| Status | paid / pending badge |
| Date Paid | |

---

#### `WorkerAttendancePage` — `/worker/attendance`

- Monthly calendar view (read-only)
- Status per day: present / absent / half-day / leave
- Summary: days present, days absent, leave count

---

## 5. Shared Components Library

### 5.1 Layout Components

| Component | Props | Usage |
|-----------|-------|-------|
| `<PublicLayout>` | `children` | Wraps all public pages |
| `<AuthLayout>` | `children, leftPanel` | Login, signup, reset |
| `<DashboardLayout>` | `children, role` | All logged-in dashboards |
| `<AdminLayout>` | `children` | Super admin pages |
| `<Sidebar>` | `role, navItems, branding` | Role-specific nav |
| `<Topbar>` | `title, breadcrumb, actions` | Dashboard top bar |
| `<PageHeader>` | `title, subtitle, actions` | Reusable page heading |

### 5.2 Data Display

| Component | Props | Usage |
|-----------|-------|-------|
| `<StatsCard>` | `label, value, icon, trend, color` | Dashboard stat tiles |
| `<DataTable>` | `columns, data, loading, onRowClick` | All tabular data |
| `<EmptyState>` | `icon, title, description, action` | No results states |
| `<PropertyCard>` | `property, onRequest` | Public property listing |
| `<RoomCard>` | `room, onSelect` | Room picker |
| `<BillingCycleRow>` | `cycle, onPay, onView` | Billing table row |
| `<PaymentRow>` | `payment` | Payment history row |
| `<ComplaintCard>` | `complaint, onView` | Complaint list item |
| `<NotificationItem>` | `notification, onRead` | Notification list item |
| `<WorkerCard>` | `worker, onPay, onEdit` | Worker management card |

### 5.3 Forms & Inputs

| Component | Props | Usage |
|-----------|-------|-------|
| `<Input>` | `label, error, ...inputProps` | All form text inputs |
| `<PhoneInput>` | `value, onChange, error` | KE phone with prefix |
| `<SelectInput>` | `label, options, value, onChange` | Dropdowns |
| `<DatePicker>` | `label, value, onChange` | Date selection |
| `<TextArea>` | `label, rows, error, ...props` | Multi-line inputs |
| `<Checkbox>` | `label, checked, onChange` | Styled checkbox |
| `<Toggle>` | `checked, onChange, label` | Settings toggles |
| `<ColorPicker>` | `value, onChange` | Branding color input |
| `<FileUpload>` | `onUpload, accept, preview` | Logo / image uploads |
| `<PasswordInput>` | `showStrength, ...props` | Password with meter |
| `<SearchBar>` | `placeholder, onSearch, debounce` | Global search inputs |

### 5.4 Feedback & Overlays

| Component | Props | Usage |
|-----------|-------|-------|
| `<Modal>` | `isOpen, onClose, title, children, size` | All modals |
| `<Drawer>` | `isOpen, onClose, side, children` | Mobile nav, detail panels |
| `<Toast>` | `type, message, duration` | Success/error notifications |
| `<ToastContainer>` | — | Global toast renderer (top-right) |
| `<ConfirmDialog>` | `isOpen, message, onConfirm, onCancel` | Destructive action confirms |
| `<LoadingSpinner>` | `size, color` | Button + page loaders |
| `<SkeletonCard>` | `lines, hasImage` | Loading state placeholders |
| `<SkeletonTable>` | `rows, cols` | Table loading state |
| `<Badge>` | `variant, size` | Status labels (paid/overdue/etc.) |
| `<Alert>` | `type, title, message, onClose` | Inline alerts |
| `<Tooltip>` | `content, children` | Hover info labels |

### 5.5 Charts (recharts)

| Component | Used On | Chart Type |
|-----------|---------|------------|
| `<OccupancyChart>` | Owner, Manager Dashboard | Bar chart |
| `<RevenueChart>` | Owner Analytics | Line + bar combined |
| `<PaymentMethodPie>` | Owner Analytics | Donut chart |
| `<BillingStatusDonut>` | Owner Analytics | Donut chart |
| `<AttendanceHeatmap>` | Attendance pages | Custom grid |
| `<TrendSparkline>` | StatsCard (optional) | Mini line chart |

### 5.6 Modals (Named)

| Modal | Trigger | Fields |
|-------|---------|--------|
| `<RentalRequestModal>` | "Request Room" button | Room (pre-filled), move-in date, message |
| `<MoveInModal>` | Manager approves request | Confirm details, billing type, agreed price |
| `<MoveOutModal>` | Manager action | Move-out date, final settlement summary |
| `<TransferRequestModal>` | Client requests transfer | Select new room, preferred date, reason |
| `<ApproveTransferModal>` | Manager approves transfer | Confirm rooms, effective date |
| `<ManualPaymentModal>` | Manager records payment | Resident, billing cycle, amount, method, notes |
| `<MPesaPayModal>` | Client pays rent | Pre-filled amount, phone confirmation, STK push |
| `<NewComplaintModal>` | Client submits complaint | Title, category, priority, description, attachments |
| `<RoomFormModal>` | Add/Edit room | All room fields |
| `<BuildingFormModal>` | Add/Edit building | Name, address |
| `<WorkerFormModal>` | Add/Edit worker | All worker fields |
| `<InviteManagerModal>` | Owner invites manager | Email input, role confirmation |
| `<AnnouncementModal>` | Send announcement | Title, body, audience, channel |
| `<GenerateInvoiceModal>` | Manager generates invoice | Billing cycle selection, preview |

### 5.7 Navigation Components

| Component | Usage |
|-----------|-------|
| `<NavItem>` | Single sidebar link with icon, label, active state |
| `<NavGroup>` | Collapsible group of nav items |
| `<Breadcrumb>` | Topbar breadcrumb trail |
| `<TabBar>` | Filter tabs (All / Pending / etc.) |
| `<Pagination>` | Table pagination controls |
| `<BackButton>` | Navigates to previous page |

---

## 6. Layout Patterns

### 6.1 Dashboard Stats Row

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Icon    │ │  Icon    │ │  Icon    │ │  Icon    │
│  Value   │ │  Value   │ │  Value   │ │  Value   │
│  Label   │ │  Label   │ │  Label   │ │  Label   │
│  Trend ↑ │ │  Trend ↓ │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
grid grid-cols-2 md:grid-cols-4 gap-4
```

### 6.2 Page with Table

```
┌─────────────────────────────────────────────────┐
│  PageHeader: Title           [+ Add Button]     │
├─────────────────────────────────────────────────┤
│  Filter Bar: [Tabs] [Search] [Date Range]       │
├─────────────────────────────────────────────────┤
│  DataTable                                      │
│  ┌──────┬──────┬──────┬──────┬──────┬────────┐  │
│  │ Col  │ Col  │ Col  │ Col  │ Col  │Actions │  │
│  ├──────┼──────┼──────┼──────┼──────┼────────┤  │
│  │      │      │      │      │      │ •••    │  │
│  └──────┴──────┴──────┴──────┴──────┴────────┘  │
│  Pagination: ← 1 2 3 → (showing 1-20 of 84)    │
└─────────────────────────────────────────────────┘
```

### 6.3 Split Detail View

```
┌──────────────────────┬──────────────────────────┐
│  List Panel (40%)    │  Detail Panel (60%)       │
│  ─────────────────   │  ─────────────────────    │
│  Item 1 (selected)  ●│  Selected item detail     │
│  Item 2              │  Full info, actions       │
│  Item 3              │  Message thread           │
│                      │                           │
└──────────────────────┴──────────────────────────┘
Used for: Complaints, Rental Requests (desktop)
```

### 6.4 Settings Tabs Layout

```
┌──────────────────────────────────────────────────┐
│  Settings                                        │
├──────────────────────────────────────────────────┤
│  [Branding] [Billing Config] [Notifications]     │
├──────────────────────────────────────────────────┤
│                                                  │
│  Tab content (form)                              │
│                                                  │
│                              [Cancel] [Save →]  │
└──────────────────────────────────────────────────┘
```

---

## 7. User Flow Diagrams

### 7.1 New Visitor → Active Resident

```
Visit / (PublicPage)
  │
  ├─ Browse properties → PropertyDetailPage
  │      │
  │      └─ Click "Request Room"
  │              │
  │              ├─ Not logged in → Redirect to /signup
  │              └─ Logged in → <RentalRequestModal>
  │                                  │
  ↓                                  ↓
Signup (/signup)              Request submitted
  │                                  │
  └─ Account created (visitor)  Manager reviews (/manage/residents/requests)
          │                          │
          └─ Browses /browse    ┌────┴────┐
                                │        │
                             Approve   Reject
                                │        │
                         <MoveInModal>  Email notification to visitor
                                │
                         Tenancy created
                                │
                         Profile upgraded: visitor → client
                                │
                         Client redirected to /dashboard
```

### 7.2 Billing Cycle → Payment Flow

```
Tenancy created
  │
  └─ Trigger: generate_billing_cycles()
          │
          ├─ 12 monthly cycles created (or 2 semester)
          │
          └─ Due date approaches (3 days before)
                  │
                  ├─ SMS reminder sent
                  ├─ Email reminder sent
                  └─ In-app notification created
                          │
                  Client opens /dashboard/billing
                          │
                  Clicks "Pay Now" → <MPesaPayModal>
                          │
                  STK Push sent to phone
                          │
                  M-Pesa callback → POST /payments/mpesa/callback
                          │
                  Payment confirmed → billing_cycle updated
                          │
                  Invoice generated (PDF)
                          │
                  Notification: "Payment received ✓"
```

### 7.3 Manager Invite Flow

```
Owner opens /manage/settings → Managers tab
  │
  └─ Clicks "Invite Manager"
          │
          └─ <InviteManagerModal> → enters email
                  │
                  └─ POST /managers/invite
                          │
                          ├─ manager_invites row created
                          └─ Email sent with link: /invite/:token
                                  │
                          Invitee clicks link
                                  │
                          /invite/:token validates token
                                  │
                          Form: enter name + password
                                  │
                          Accept → profile.role = 'manager'
                                  │
                          Redirect to /manage
```

### 7.4 Complaint Flow

```
Client: /dashboard/complaints → "New Complaint"
  │
  └─ <NewComplaintModal> → submit
          │
          └─ complaints row created (status: open)
                  │
                  Manager sees in /manage/complaints
                          │
                  Manager opens complaint → assigns to self
                  (status: in_progress)
                          │
                  Client notified (in-app + SMS/email)
                          │
                  Manager replies → complaint_messages row
                          │
                  Client replies → complaint_messages row
                          │
                  Manager marks resolved
                  (status: resolved)
                          │
                  Client notified "Complaint resolved ✓"
```

---

## 8. Route Map

```
/                             PublicPage
/browse                       BrowsePage (visitor logged in)
/property/:slug               PropertyDetailPage

/login                        LoginPage
/signup                       SignupPage
/invite/:token                AcceptInvitePage
/reset-password               ResetPasswordPage

/dashboard                    ClientDashboard
/dashboard/room               MyRoomPage
/dashboard/billing            BillingPage
/dashboard/payments           PaymentsPage
/dashboard/transfer-request   TransferRequestPage
/dashboard/complaints         ClientComplaintsPage
/dashboard/complaints/:id     ComplaintDetailPage
/dashboard/notifications      NotificationsPage
/dashboard/profile            ClientProfilePage

/manage                       ManagerDashboard
/manage/properties            PropertiesPage (tabbed: buildings/rooms/beds)
/manage/residents             ResidentsPage
/manage/residents/:id         ResidentDetailPage
/manage/residents/requests    RentalRequestsPage
/manage/residents/tenancies   TenanciesPage
/manage/billing/cycles        ManagerBillingPage
/manage/billing/payments      ManagerPaymentsPage
/manage/billing/invoices      InvoicesPage
/manage/workforce/workers     WorkforcePage
/manage/workforce/salaries    WorkerSalariesPage
/manage/workforce/attendance  AttendancePage
/manage/complaints            ManagerComplaintsPage
/manage/complaints/:id        ComplaintDetailPage (manager view)
/manage/announcements         AnnouncementsPage
/manage/notifications         ManagerNotificationsPage
/manage/settings              ManagerSettingsPage (tabbed)
/manage/profile               ManagerProfilePage

/owner                        OwnerDashboard
/owner/occupancy              OccupancyReportPage
/owner/financials             FinancialSummaryPage
/owner/billing                OwnerBillingPage
/owner/workforce              WorkerCostsPage
/owner/analytics              AnalyticsPage
/owner/profile                OwnerProfilePage

/worker                       WorkerDashboard
/worker/payments              WorkerPaymentsPage
/worker/attendance            WorkerAttendancePage
/worker/profile               WorkerProfilePage

/admin                        AdminDashboard
/admin/tenants                AdminTenantsPage
/admin/tenants/pending        (filter of /admin/tenants)
/admin/tenants/:id            TenantDetailPage
/admin/users                  AdminUsersPage
/admin/revenue                AdminRevenuePage
/admin/analytics              AdminAnalyticsPage
/admin/settings               AdminSettingsPage
/admin/audit                  AdminAuditPage
/admin/profile                AdminProfilePage
```

### Route Guards

```jsx
// React Router v6 pattern
<Route element={<RequireAuth roles={['client']} />}>
  <Route path="/dashboard/*" element={<ClientRoutes />} />
</Route>

<Route element={<RequireAuth roles={['manager', 'owner']} />}>
  <Route path="/manage/*" element={<ManagerRoutes />} />
</Route>

<Route element={<RequireAuth roles={['owner']} />}>
  <Route path="/owner/*" element={<OwnerRoutes />} />
</Route>

<Route element={<RequireAuth roles={['super_admin']} />}>
  <Route path="/admin/*" element={<AdminRoutes />} />
</Route>

<Route element={<RequireAuth roles={['worker']} />}>
  <Route path="/worker/*" element={<WorkerRoutes />} />
</Route>
```

---

## 9. State Management

### 9.1 Global State (Zustand or Context)

```
authStore
  ├── user: auth.User | null
  ├── profile: Profile | null
  ├── loading: boolean
  ├── signIn(email, password)
  ├── signOut()
  └── refreshProfile()

tenantStore
  ├── tenant: Tenant | null
  ├── branding: TenantBranding | null
  ├── settings: TenantSettings | null
  └── fetchTenantData(tenantId)

notificationStore
  ├── notifications: Notification[]
  ├── unreadCount: number
  ├── markRead(id)
  └── markAllRead()
```

### 9.2 Server State (React Query / TanStack Query)

All API data is fetched and cached via React Query. Key query keys:

```js
// Rooms
['rooms', tenantId, filters]
['room', roomId]

// Tenancies
['tenancies', tenantId, filters]
['tenancy', tenancyId]
['my-tenancy', userId]

// Billing
['billing-cycles', tenancyId]
['billing-cycles', tenantId, filters]  // manager view
['payments', billingCycleId]

// Complaints
['complaints', tenantId, filters]
['complaint', complaintId]

// Workers
['workers', tenantId]
['worker-payments', workerId]

// Rental Requests
['rental-requests', tenantId, status]

// Notifications
['notifications', userId]
['unread-count', userId]
```

### 9.3 Realtime Subscriptions (Supabase)

Subscribe to these channels in the relevant pages:

| Channel | Table | Event | Used On |
|---------|-------|-------|---------|
| `notifications:user_id=eq.{uid}` | notifications | INSERT | All logged-in pages (topbar bell) |
| `complaints:tenant_id=eq.{tid}` | complaints | UPDATE | Manager complaints page |
| `complaint_messages:complaint_id=eq.{cid}` | complaint_messages | INSERT | Complaint detail thread |
| `payments:billing_cycle_id=eq.{id}` | payments | INSERT | Client billing page (M-Pesa confirmation) |
| `rental_requests:tenant_id=eq.{tid}` | rental_requests | INSERT | Manager dashboard (new request badge) |

---

## 10. Responsive Breakpoints

```
Mobile:  < 640px  (sm) — single column, bottom nav, drawers
Tablet:  640–1024px (md) — 2 columns, condensed sidebar
Desktop: > 1024px (lg)  — full sidebar + multi-column layouts
Wide:    > 1280px (xl)  — wider content area, more grid columns
```

### Mobile-Specific Patterns

| Desktop Pattern | Mobile Equivalent |
|----------------|-------------------|
| Fixed sidebar | Hamburger → full-screen drawer |
| Data table | Scrollable horizontal table or card list |
| Split detail view | Stack: list → tap → full-screen detail |
| Modal | Bottom sheet drawer |
| Date pickers | Native mobile date inputs |
| Hover tooltips | Tap-to-show tooltips |
| Multi-column forms | Single column, full-width inputs |
| Tab bars (horizontal) | Scrollable horizontal pill tabs |

### Bottom Navigation (Mobile Client)

```
┌────────────────────────────────────┐
│  🏠 Home  📄 Billing  💬 Help  👤 Me  │
└────────────────────────────────────┘
Fixed bottom, 4 items, icon + label
Active item: brand-primary color + underline dot
```

---

## 11. Accessibility & UX Standards

### Focus Management
- All interactive elements have visible `:focus-visible` outlines
- Modals trap focus inside while open
- On modal close, focus returns to trigger element

### ARIA
- `role="dialog"` + `aria-modal="true"` on all modals
- `aria-label` on icon-only buttons
- `aria-live="polite"` on toast container
- `aria-expanded` on collapsible nav groups
- `aria-current="page"` on active nav item

### Loading States
- Every data-fetching component shows `<SkeletonCard>` or `<SkeletonTable>` while loading
- Buttons show spinner + disable during async actions
- Never show empty state before first load completes

### Empty States
Every list/table has a designed empty state with:
- Contextual illustration (SVG icon, not generic)
- Descriptive title ("No rental requests yet")
- Helpful subtitle ("Rental requests from visitors will appear here")
- Action button where applicable ("Browse Properties")

### Error Handling
- API errors → `<Alert type="error">` above the form
- 404 pages → branded 404 with navigation options
- Auth errors → clear message + retry option
- Network errors → "Something went wrong. Try again." toast

### Toast Notifications
- Success: green, bottom-right, auto-dismiss 4s
- Error: red, bottom-right, persistent until closed
- Info: blue, bottom-right, auto-dismiss 5s
- Warning: amber, bottom-right, auto-dismiss 5s
- Max 3 toasts visible simultaneously — queue the rest

### Form Validation
- Validate on blur (not on every keystroke)
- Validate all fields on submit
- Errors shown inline below the field
- First error field auto-focused on submit fail
- Clear error when user begins correcting the field

---

## 12. Page-by-Page Component Breakdown

### ClientDashboard `/dashboard`

```jsx
<DashboardLayout>
  <PageHeader title="Dashboard" />

  {/* Row 1: Stats */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatsCard label="Current Balance" value="KES 8,500" icon={WalletIcon} color="error" />
    <StatsCard label="Next Due" value="Mar 15" icon={CalendarIcon} color="warning" />
    <StatsCard label="Tenancy" value="Active" icon={HomeIcon} color="success" />
    <StatsCard label="Complaints" value="2 Open" icon={ChatIcon} color="info" />
  </div>

  {/* Row 2: Billing snapshot + recent payments */}
  <div className="grid lg:grid-cols-3 gap-6 mt-6">
    <div className="lg:col-span-2">
      <BillingSnapshotCard cycle={currentCycle} onPay={openMPesaModal} />
    </div>
    <RecentPaymentsList payments={recentPayments} />
  </div>

  {/* Row 3: Complaints + Notifications */}
  <div className="grid lg:grid-cols-2 gap-6 mt-6">
    <RecentComplaintsList complaints={openComplaints} />
    <NotificationsFeed notifications={unreadNotifications} />
  </div>

  {/* Modals */}
  <MPesaPayModal isOpen={payModalOpen} onClose={closePayModal} cycle={currentCycle} />
</DashboardLayout>
```

---

### ManagerDashboard `/manage`

```jsx
<DashboardLayout>
  <PageHeader title="Manager Dashboard" subtitle={tenantName} />

  {/* Stats row */}
  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    <StatsCard label="Total Rooms" ... />
    <StatsCard label="Occupied" ... />
    <StatsCard label="Vacant" ... />
    <StatsCard label="Pending Requests" ... />
    <StatsCard label="Overdue Payments" ... />
    <StatsCard label="Open Complaints" ... />
  </div>

  {/* Occupancy overview */}
  <OccupancyOverviewCard buildings={buildings} className="mt-6" />

  {/* Grid: Requests + Overdue + Payments + Complaints */}
  <div className="grid lg:grid-cols-2 gap-6 mt-6">
    <PendingRequestsPanel requests={pendingRequests} onApprove onReject />
    <OverdueBillingPanel cycles={overdueCycles} />
    <RecentPaymentsPanel payments={recentPayments} />
    <OpenComplaintsPanel complaints={openComplaints} />
  </div>
</DashboardLayout>
```

---

### BillingPage `/dashboard/billing`

```jsx
<DashboardLayout>
  <PageHeader title="Billing & Invoices">
    <Badge variant={billingType === 'monthly' ? 'info' : 'warning'}>
      {billingType === 'monthly' ? 'Monthly Billing' : 'Semester Billing'}
    </Badge>
  </PageHeader>

  {/* Summary cards */}
  <div className="grid grid-cols-3 gap-4 mb-6">
    <StatsCard label="Total Paid" value={`KES ${totalPaid}`} color="success" />
    <StatsCard label="Outstanding" value={`KES ${outstanding}`} color="error" />
    <StatsCard label="Next Due" value={nextDueDate} color="warning" />
  </div>

  <DataTable
    columns={billingColumns}
    data={billingCycles}
    loading={isLoading}
    onRowClick={(cycle) => cycle.status !== 'paid' && openPayModal(cycle)}
  />

  <MPesaPayModal ... />
</DashboardLayout>
```

---


src/
│
├── main.jsx                          # Vite entry point
├── App.jsx                           # Root router + auth redirect logic
├── index.css                         # Tailwind directives + global styles
│
├── assets/
│   ├── logo.svg
│   └── fonts/                        # If self-hosting fonts
│
├── config/
│   ├── supabase.js                   # Supabase client init (anon key)
│   └── constants.js                  # App-wide constants (roles, routes, etc.)
│
├── store/
│   ├── authStore.js                  # Zustand — user, profile, signIn, signOut
│   ├── tenantStore.js                # Zustand — tenant, branding, settings
│   └── notificationStore.js          # Zustand — notifications, unread count
│
├── hooks/
│   ├── useAuth.js                    # Auth state + profile fetch
│   ├── useTenant.js                  # Tenant + branding data
│   ├── useRealtime.js                # Supabase realtime subscriptions
│   ├── useNotifications.js           # Notification fetch + mark read
│   └── useDebounce.js                # Search debounce utility
│
├── lib/
│   ├── api/
│   │   ├── auth.js                   # signIn, signUp, signOut, resetPassword
│   │   ├── profile.js                # fetchProfile, updateProfile
│   │   ├── rooms.js                  # getRooms, createRoom, updateRoom
│   │   ├── tenancies.js              # getTenancies, createTenancy, moveOut
│   │   ├── rentalRequests.js         # getRequests, createRequest, approve, reject
│   │   ├── billing.js                # getBillingCycles, getInvoices
│   │   ├── payments.js               # getPayments, recordPayment, mpesaSTKPush
│   │   ├── complaints.js             # getComplaints, createComplaint, updateStatus
│   │   ├── workers.js                # getWorkers, createWorker, recordSalary
│   │   ├── notifications.js          # getNotifications, markRead
│   │   ├── tenants.js                # (super admin) getTenants, approveTenant
│   │   └── analytics.js             # getOccupancyStats, getRevenueStats
│   ├── mpesa.js                      # STK push, callback helpers
│   ├── formatters.js                 # formatCurrency, formatDate, formatPhone
│   └── validators.js                 # Form validation helpers (email, KE phone, etc.)
│
├── layouts/
│   ├── PublicLayout.jsx              # Navbar + footer wrapper for public pages
│   ├── AuthLayout.jsx                # Split-panel wrapper for login/signup
│   ├── DashboardLayout.jsx           # Sidebar + topbar wrapper (all logged-in roles)
│   └── AdminLayout.jsx               # Dark dense layout for super admin
│
├── components/
│   │
│   ├── ui/                           # Primitive reusable UI components
│   │   ├── Button.jsx                # Primary, secondary, ghost, danger variants
│   │   ├── Input.jsx                 # Labeled input with error state
│   │   ├── PasswordInput.jsx         # Input + show/hide + strength meter
│   │   ├── PhoneInput.jsx            # +254 prefix KE phone input
│   │   ├── SelectInput.jsx           # Styled select/dropdown
│   │   ├── TextArea.jsx              # Labeled textarea
│   │   ├── Checkbox.jsx              # Custom styled checkbox
│   │   ├── Toggle.jsx                # On/off toggle switch
│   │   ├── Badge.jsx                 # Status badges (paid, overdue, pending…)
│   │   ├── Avatar.jsx                # Initials or image avatar
│   │   ├── Tooltip.jsx               # Hover tooltip wrapper
│   │   ├── Alert.jsx                 # Inline alert (success/error/info/warning)
│   │   ├── Spinner.jsx               # Loading spinner
│   │   ├── SkeletonCard.jsx          # Loading placeholder card
│   │   ├── SkeletonTable.jsx         # Loading placeholder table rows
│   │   ├── EmptyState.jsx            # No-data state with icon + CTA
│   │   └── Divider.jsx               # Horizontal divider with optional label
│   │
│   ├── layout/                       # Structural layout components
│   │   ├── Sidebar.jsx               # Role-aware sidebar nav
│   │   ├── Topbar.jsx                # Dashboard top bar
│   │   ├── PageHeader.jsx            # Page title + subtitle + action slot
│   │   ├── Breadcrumb.jsx            # Breadcrumb trail
│   │   └── BottomNav.jsx             # Mobile bottom navigation (client)
│   │
│   ├── navigation/
│   │   ├── NavItem.jsx               # Single sidebar nav link
│   │   ├── NavGroup.jsx              # Collapsible nav section
│   │   └── TabBar.jsx                # Horizontal filter tabs
│   │
│   ├── data/                         # Data display components
│   │   ├── DataTable.jsx             # Generic sortable/paginated table
│   │   ├── StatsCard.jsx             # KPI stat tile (value, label, trend)
│   │   ├── Pagination.jsx            # Table pagination controls
│   │   ├── PropertyCard.jsx          # Public property listing card
│   │   ├── RoomCard.jsx              # Room picker card
│   │   ├── BillingCycleRow.jsx       # Single billing cycle table row
│   │   ├── PaymentRow.jsx            # Single payment history row
│   │   ├── ComplaintCard.jsx         # Complaint list item
│   │   ├── NotificationItem.jsx      # Single notification row
│   │   └── WorkerCard.jsx            # Worker summary card
│   │
│   ├── charts/                       # Recharts wrappers
│   │   ├── RevenueChart.jsx          # Bar — expected vs collected
│   │   ├── OccupancyChart.jsx        # Bar — occupancy by building/month
│   │   ├── OccupancyTrendLine.jsx    # Line — occupancy rate over time
│   │   ├── PaymentMethodPie.jsx      # Donut — M-Pesa vs Cash vs Bank
│   │   ├── BillingStatusDonut.jsx    # Donut — paid/partial/unpaid/overdue
│   │   ├── GrowthLineChart.jsx       # Line — platform tenants + users (admin)
│   │   └── TrendSparkline.jsx        # Mini inline sparkline for stat cards
│   │
│   ├── modals/                       # Named modal components
│   │   ├── Modal.jsx                 # Base modal wrapper (backdrop + panel)
│   │   ├── ConfirmDialog.jsx         # Generic confirm/cancel destructive dialog
│   │   ├── MPesaPayModal.jsx         # STK push flow (form → waiting → success)
│   │   ├── ManualPaymentModal.jsx    # Manager records cash/bank payment
│   │   ├── RentalRequestModal.jsx    # Visitor submits rental request
│   │   ├── MoveInModal.jsx           # Manager approves move-in
│   │   ├── MoveOutModal.jsx          # Manager confirms move-out
│   │   ├── TransferRequestModal.jsx  # Client requests room transfer
│   │   ├── ApproveTransferModal.jsx  # Manager approves transfer
│   │   ├── NewComplaintModal.jsx     # Client submits complaint
│   │   ├── RoomFormModal.jsx         # Add/edit room
│   │   ├── BuildingFormModal.jsx     # Add/edit building
│   │   ├── WorkerFormModal.jsx       # Add/edit worker
│   │   ├── InviteManagerModal.jsx    # Owner invites manager by email
│   │   ├── AnnouncementModal.jsx     # Manager sends announcement
│   │   └── GenerateInvoiceModal.jsx  # Generate + preview invoice PDF
│   │
│   └── feedback/
│       ├── Toast.jsx                 # Single toast notification
│       └── ToastContainer.jsx        # Global toast renderer (top-right)
│
├── pages/
│   │
│   ├── public/
│   │   ├── PublicPage.jsx            # / — Landing + property browse (done ✓)
│   │   ├── BrowsePage.jsx            # /browse — Logged-in visitor browse
│   │   └── PropertyDetailPage.jsx    # /property/:slug — Single property detail
│   │
│   ├── auth/
│   │   ├── LoginPage.jsx             # /login (done ✓)
│   │   ├── SignupPage.jsx            # /signup (done ✓)
│   │   ├── AcceptInvitePage.jsx      # /invite/:token
│   │   └── ResetPasswordPage.jsx     # /reset-password
│   │
│   ├── client/
│   │   ├── ClientDashboard.jsx       # /dashboard (done ✓)
│   │   ├── MyRoomPage.jsx            # /dashboard/room
│   │   ├── BillingPage.jsx           # /dashboard/billing
│   │   ├── PaymentsPage.jsx          # /dashboard/payments
│   │   ├── TransferRequestPage.jsx   # /dashboard/transfer-request
│   │   ├── ClientComplaintsPage.jsx  # /dashboard/complaints
│   │   ├── ComplaintDetailPage.jsx   # /dashboard/complaints/:id
│   │   ├── NotificationsPage.jsx     # /dashboard/notifications
│   │   └── ClientProfilePage.jsx     # /dashboard/profile
│   │
│   ├── manager/
│   │   ├── ManagerDashboard.jsx      # /manage (done ✓)
│   │   ├── PropertiesPage.jsx        # /manage/properties
│   │   ├── ResidentsPage.jsx         # /manage/residents
│   │   ├── ResidentDetailPage.jsx    # /manage/residents/:id
│   │   ├── RentalRequestsPage.jsx    # /manage/residents/requests
│   │   ├── TenanciesPage.jsx         # /manage/residents/tenancies
│   │   ├── ManagerBillingPage.jsx    # /manage/billing/cycles
│   │   ├── ManagerPaymentsPage.jsx   # /manage/billing/payments
│   │   ├── InvoicesPage.jsx          # /manage/billing/invoices
│   │   ├── WorkforcePage.jsx         # /manage/workforce/workers
│   │   ├── WorkerSalariesPage.jsx    # /manage/workforce/salaries
│   │   ├── AttendancePage.jsx        # /manage/workforce/attendance
│   │   ├── ManagerComplaintsPage.jsx # /manage/complaints
│   │   ├── AnnouncementsPage.jsx     # /manage/announcements
│   │   ├── ManagerSettingsPage.jsx   # /manage/settings
│   │   └── ManagerProfilePage.jsx    # /manage/profile
│   │
│   ├── owner/
│   │   ├── OwnerDashboard.jsx        # /owner (done ✓)
│   │   ├── OccupancyReportPage.jsx   # /owner/occupancy
│   │   ├── FinancialSummaryPage.jsx  # /owner/financials
│   │   ├── OwnerBillingPage.jsx      # /owner/billing
│   │   ├── WorkerCostsPage.jsx       # /owner/workforce
│   │   └── AnalyticsPage.jsx         # /owner/analytics
│   │
│   ├── admin/
│   │   ├── SuperAdminDashboard.jsx   # /admin (done ✓)
│   │   ├── AdminTenantsPage.jsx      # /admin/tenants
│   │   ├── TenantDetailPage.jsx      # /admin/tenants/:id
│   │   ├── AdminUsersPage.jsx        # /admin/users
│   │   ├── AdminRevenuePage.jsx      # /admin/revenue
│   │   ├── AdminAnalyticsPage.jsx    # /admin/analytics
│   │   ├── AdminSettingsPage.jsx     # /admin/settings
│   │   └── AdminAuditPage.jsx        # /admin/audit
│   │
│   └── worker/
│       ├── WorkerDashboard.jsx       # /worker (done ✓)
│       ├── WorkerPaymentsPage.jsx    # /worker/payments
│       ├── WorkerAttendancePage.jsx  # /worker/attendance
│       └── WorkerProfilePage.jsx     # /worker/profile
│
└── router/
    ├── AppRouter.jsx                 # All routes defined with React Router v6
    ├── RequireAuth.jsx               # Auth guard — redirects if no session
    ├── RequireRole.jsx               # Role guard — redirects if wrong role
    └── routes.js                     # Route path constants (avoids magic strings)

*Last updated: fab-rental-management v0.1 — UI/UX Structure Reference*
*Pages: 40+ · Components: 60+ · Roles: 6 · Layouts: 4*
