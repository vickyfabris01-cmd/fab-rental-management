// =============================================================================
// components/ui/index.js
// Barrel export — import any component from "@/components/ui"
//
// Usage:
//   import { Button, Badge, Avatar }       from "../components/ui";
//   import { BillingBadge, SkeletonTable } from "../components/ui";
//   import { Spinner, EmptyState }         from "../components/ui";
// =============================================================================

// ── Form primitives ───────────────────────────────────────────────────────────
export { default as Button } from "./Button.jsx";
export { default as Input } from "./Input.jsx";
export { default as PasswordInput } from "./PasswordInput.jsx";
export { default as PhoneInput } from "./PhoneInput.jsx";
export { default as SelectInput } from "./SelectInput.jsx";
export { default as TextArea } from "./TextArea.jsx";
export { default as Checkbox } from "./Checkbox.jsx";
export { default as Toggle } from "./Toggle.jsx";

// ── Data display ─────────────────────────────────────────────────────────────
export { default as Badge } from "./Badge.jsx";
export {
  BillingBadge,
  PaymentBadge,
  RoomBadge,
  RequestBadge,
  ComplaintBadge,
  RoleBadge,
  TenantBadge,
  MethodBadge,
} from "./Badge.jsx";

export { default as Avatar } from "./Avatar.jsx";
export { AvatarGroup } from "./Avatar.jsx";

// ── Overlays & feedback ──────────────────────────────────────────────────────
export { default as Tooltip } from "./Tooltip.jsx";
export { default as Alert } from "./Alert.jsx";

// ── Loading states ────────────────────────────────────────────────────────────
export { default as Spinner } from "./Spinner.jsx";
export { SkeletonCard } from "./Spinner.jsx";
export { SkeletonTable } from "./Spinner.jsx";

// ── Layout helpers ────────────────────────────────────────────────────────────
export { EmptyState } from "./Spinner.jsx";
export { Divider } from "./Spinner.jsx";
