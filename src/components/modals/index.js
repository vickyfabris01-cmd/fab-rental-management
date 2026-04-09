// =============================================================================
// components/modals/index.js
// All named modal exports.
//
// Usage:
//   import { MPesaPayModal, MoveInModal, RoomFormModal } from "@/components/modals";
//   import { MPesaPayModal } from "@/components";   ← also works via master barrel
// =============================================================================

// Base primitives (already in Modal.jsx)
export { Modal, Drawer, ConfirmDialog } from "./Modal.jsx";

// Payment modals
export { default as MPesaPayModal } from "./MPesaPayModal.jsx";
export { default as ManualPaymentModal } from "./ManualPaymentModal.jsx";

// Request + tenancy lifecycle
export { default as RentalRequestModal } from "./RentalRequestModal.jsx";
export { MoveInModal, MoveOutModal } from "./MoveInModal.jsx";
export {
  TransferRequestModal,
  ApproveTransferModal,
} from "./TransferRequestModal.jsx";

// Complaint
export { default as NewComplaintModal } from "./NewComplaintModal.jsx";

// Property management forms
export { default as RoomFormModal } from "./RoomFormModal.jsx";
export { BuildingFormModal, WorkerFormModal } from "./BuildingFormModal.jsx";
export { TenantFormModal } from "./TenantFormModal.jsx";

// Team + comms
export { default as InviteManagerModal } from "./InviteManagerModal.jsx";
export { default as AnnouncementModal } from "./AnnouncementModal.jsx";
export { default as GenerateInvoiceModal } from "./GenerateInvoiceModal.jsx";
export { default as AssignRoleModal } from "./AssignRoleModal.jsx";
