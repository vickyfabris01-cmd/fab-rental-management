# fabRentals — Bug Tracker
> Generated from debugging.docx · Prioritised by severity · Ready to solve

---

## Priority Key
- 🔴 **CRITICAL** — Crash / broken flow / data not saving
- 🟠 **HIGH** — Wrong data / broken feature / console error  
- 🟡 **MEDIUM** — UX gap / missing functionality
- 🟢 **LOW** — Polish / cosmetic / improvement

---

## GENERAL (All Dashboards)

| # | Priority | Bug | File(s) |
|---|---|---|---|
| G-1 | ✅ | Navigating between pages in same dashboard fails to load data until refresh — pages don't re-fetch on route change | All pages — need `useEffect` deps on route params |
| G-2 | ✅ | Sign-out is unresponsive — requires page refresh first before it responds | `authStore.js`, `DashboardLayout.jsx` |
| G-3 | ✅ | Profile pages are blank across all dashboards (client, manager, owner, worker) | All `*ProfilePage.jsx` |
| G-4 | 🟢 | Page data should be pre-fetched (or at least skeletons shown) before render — navigation feels slow | All pages |

---

## CLIENT PAGE

| # | Priority | Bug | File(s) |
|---|---|---|---|
| C-1 | ✅ | **`ClientProfilePage` crashes with import error** — `Divider.jsx` import path wrong: `"../../components/ui/Divider.jsx"` — file exported from `Spinner.jsx` | `ClientProfilePage.jsx` line 12 |
| C-2 | ✅ | **Room transfer fails** — `from_bed_id` column does not exist in `room_transfers` table: `Could not find the 'from_bed_id' column of 'room_transfers' in the schema cache` | `lib/api/tenancies.js`, `TransferRequestModal.jsx` |
| C-3 | ✅ | Billing cycles not generating correctly for client — cycles not appearing in billing page | `BillingPage.jsx`, `lib/api/billing.js`, DB trigger |

---

## MANAGER PAGE

| # | Priority | Bug | File(s) |
|---|---|---|---|
| M-1 | ✅ | **Announcement fails** — RLS blocks notification insert: `new row violates row-level security policy for table "notifications"` | `AnnouncementModal.jsx`, DB RLS on `notifications` |
| M-2 | ✅ | **Record Payment button failing** — payments are recorded but balances and collected amounts don't update for manager or owner | `ManualPaymentModal.jsx`, `lib/api/payments.js`, DB trigger `reconcile_billing_cycle` |
| M-3 | ✅ | Complaint status update (`Start Work`) — success alert shows but progress/status does not update in the UI | `ManagerComplaintsPage.jsx` |
| M-4 | ✅ | Room type dropdown sticks to `single` — selecting another type has no effect | `RoomFormModal.jsx` — SelectInput `onChange` not updating form state |
| M-5 | ✅ | **Room type names to change**: rename `studio → 1 Bedroom`, `suite → 2 Bedroom`, `dormitory → Stalls` | `RoomFormModal.jsx`, `PropertiesPage.jsx`, DB CHECK constraint |
| M-6 | ✅ | Worker add modal has no way to give worker access — redesigned to AssignRoleModal lookup flow to dashboard — no email/account field shown | `BuildingFormModal.jsx` (`WorkerFormModal`), worker login flow |
| M-7 | ✅ | Manager should NOT be able to invite another manager — only owner can add managers | `ManagerSettingsPage.jsx` — remove invite button for manager role |

---

## OWNER PAGE

| # | Priority | Bug | File(s) |
|---|---|---|---|
| O-1 | ✅ | **`BillingStatusDonut` SVG error** — `<text> attribute y: Expected length, "calc(42% + 18px)"` | `BillingStatusDonut.jsx` line 144 — SVG `y` attr can't use CSS `calc()` |
| O-2 | ✅ | **`PaymentMethodPie` SVG errors** — `NaN` and `"42%12"` passed as `y` attribute: `<text> attribute y: Expected length, "NaN"` and `"42%12"` | `PaymentMethodPie.jsx` lines 92, 103 — NaN from empty data + string concat bug |
| O-3 | ✅ | Managers listing under owner page shows no managers even though a manager exists for that tenant | `OwnerDashboard.jsx` — wrong query or RLS blocking `profiles` fetch |
| O-4 | ✅ | Financials, Billing, Worker Costs pages not showing correct data | `FinancialSummaryPage.jsx`, `OwnerBillingPage.jsx`, `WorkerCostsPage.jsx` |
| O-5 | ✅ | Owner should also be able to edit tenant branding and info (not just manager) | `ManagerSettingsPage.jsx` or separate owner settings |
| O-6 | ✅ | Manager invite flow — owner writes email, system fetches that profile, owner clicks to assign as manager (no email link needed — direct assignment) | `InviteManagerModal.jsx`, `AcceptInvitePage.jsx`, profile update flow |

---

## SUPER ADMIN PAGE

| # | Priority | Bug | File(s) |
|---|---|---|---|
| S-1 | ✅ | **`GrowthLineChart` width/height = -1 warning** — chart container has no dimensions at render time | `GrowthLineChart.jsx` line 110 — missing `minWidth`/`minHeight` on container |
| S-2 | ✅ | System Health panel must display correct/real data | `SuperAdminDashboard.jsx` |
| S-3 | ✅ | Platform growth graph should include owners and managers (not just tenants + users) | `lib/api/analytics.js` — `getPlatformAnalytics` |

---

## PUBLIC PAGE

| # | Priority | Bug | File(s) |
|---|---|---|---|
| P-1 | ✅ | Room images not displaying correctly on home/public page | `PublicPage.jsx`, `BrowsePage.jsx` — JSONB image array access |
| P-2 | ✅ | All data on public page must be fetched correctly from DB (no leftover seed data) | `BrowsePage.jsx`, `lib/api/rooms.js` |
| P-3 | ✅ | Properties section should be on same page (anchor link), not a separate page. `How it works` also anchor-linked | `PublicPage.jsx` |
| P-4 | ✅ | Unauthenticated user cannot click `Request a Room` — needs a note: "Create an account to request a room" | `BrowsePage.jsx`, `RentalRequestModal.jsx` |
| P-5 | ✅ | Logo and room photos need clear distinction: logo shows before tenant name, room photos shown separately | `BrowsePage.jsx`, `PropertyDetailPage.jsx` |
| P-6 | ✅ | Photo sharing across rooms of same type — same building block rooms should share photo set rather than each uploading duplicate | `RoomFormModal.jsx` — link photos by building/block |
| P-7 | ✅ | Sign-in and Sign-up pages need a back link to public home page | `LoginPage.jsx`, `SignupPage.jsx` |
| P-8 | ✅ | Logged-in users (all roles) should be able to view the public page from their dashboard with a "View as public" link — with greeting + click-back-to-dashboard | `DashboardLayout.jsx`, `PublicLayout.jsx`, role-aware nav |
| P-9 | ✅ | Sign-out should redirect to public home page (not login page) | `authStore.js` — post-signout redirect |

---

## Solve Order (recommended)

### Batch 1 — Crashes (must fix before anything else)
1. `C-1` — ClientProfilePage Divider import crash
2. `C-2` — Room transfer `from_bed_id` column error
3. `O-1` — BillingStatusDonut SVG calc() crash
4. `O-2` — PaymentMethodPie NaN crash
5. `M-1` — Announcement RLS block

### Batch 2 — Broken core features
6. `M-2` — Record payment / balance not updating
7. `M-3` — Complaint status not reflecting in UI
8. `M-4` — Room type dropdown stuck on single
9. `S-1` — GrowthLineChart zero-dimension warning
10. `O-3` — Managers listing empty on owner page
11. `G-2` — Sign-out unresponsive

### Batch 3 — Data & UX gaps
12. `G-1` — Page data not reloading on navigation
13. `G-3` — Profile pages blank
14. `C-3` — Billing cycles not generating for client
15. `M-5` — Room type rename
16. `M-6` — Worker dashboard access
17. `S-2` — System Health real data
18. `O-4` — Owner financials correct data

### Batch 4 — Public page & polish
19. `P-1` through `P-9`
20. `S-3`, `O-5`, `O-6`, `M-7`, `P-8`, `P-9`

### To do Later in the database
1. update the billing triger, under `M-2` Record payment / balance not updating
---

## Role Assignment Redesign (all invite flows replaced)

**Old flow (removed):** Email invite links via `manager_invites` table → `AcceptInvitePage`

**New flow:** User creates account → becomes `visitor` → inviter looks up their email via `AssignRoleModal` → clicks Assign

**Permission matrix:**
- `super_admin` assigns `owner` (from AdminUsersPage → Assign Owner button)
- `owner` assigns `manager` (from OwnerDashboard → Assign Manager, or ManagerSettingsPage)
- `manager` assigns `worker` (from WorkforcePage → Assign Dashboard Access button)
- `client` — assigned automatically via tenancy trigger when move-in is active (no manual flow)

**New files:** `src/components/modals/AssignRoleModal.jsx`
**New DB RPCs:** `assign_role()`, `lookup_visitor_by_email()`
**Removed DB RPC:** `invite_worker()`
