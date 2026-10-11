// src/components/ui/index.js — MODIFIED FILE
//
// Barrel export — import any shared component from "components/ui".
//
// Usage:
//   import { Button, Badge, Card }          from "../components/ui";
//   import { BillingBadge, SkeletonTable }  from "../components/ui";
//   import { Spinner, EmptyState }          from "../components/ui";
//
// Changes in this step: Button, Badge, Spinner rebuilt; added ThemeToggle, Card (+ parts),
// Skeleton (+ Text), EmptyState and Divider as their own files. Form fields, Avatar, Tooltip
// and Alert are rebuilt in the next step, so those exports are unchanged.

// ── Actions ───────────────────────────────────────────────────────────────────
export { default as Button } from "./Button.jsx";
export { default as ThemeToggle } from "./ThemeToggle.jsx";

// ── Form primitives (rebuilt in the next step) ────────────────────────────────
export { default as Input } from "./Input.jsx";
export { default as PasswordInput } from "./PasswordInput.jsx";
export { default as PhoneInput } from "./PhoneInput.jsx";
export { default as SelectInput } from "./SelectInput.jsx";
export { default as TextArea } from "./TextArea.jsx";
export { default as Checkbox } from "./Checkbox.jsx";
export { default as Toggle } from "./Toggle.jsx";

// ── Data display ──────────────────────────────────────────────────────────────
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

export { Card, CardHeader, CardBody, CardFooter } from "./Card.jsx";

export { default as Avatar } from "./Avatar.jsx";
export { AvatarGroup } from "./Avatar.jsx";

// ── Overlays & feedback (rebuilt in the next step) ────────────────────────────
export { default as Tooltip } from "./Tooltip.jsx";
export { default as Alert } from "./Alert.jsx";

// ── Loading states ────────────────────────────────────────────────────────────
export { default as Spinner } from "./Spinner.jsx";
export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from "./Skeleton.jsx";

// ── Layout helpers ────────────────────────────────────────────────────────────
export { default as EmptyState } from "./EmptyState.jsx";
export { default as Divider } from "./Divider.jsx";